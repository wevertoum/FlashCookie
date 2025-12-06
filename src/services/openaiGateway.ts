/**
 * RF-008, RF-016: OpenAI Gateway Service
 */

import { OPENAI_API_KEY } from '@env';
import OpenAI from 'openai';
import type { ExtractedInvoiceItem, Unit } from '../types';
import { normalizeUnit } from '../utils/unitConversion';

let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY não configurada. Configure no arquivo .env antes de usar os serviços de IA.',
    );
  }

  if (!openai) {
    openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      dangerouslyAllowBrowser: true,
    });

    console.log('OpenAI client initialized', {
      hasApiKey: !!OPENAI_API_KEY,
      apiKeyPrefix: OPENAI_API_KEY?.substring(0, 7) + '...',
    });
  }

  return openai;
}

/**
 * RF-008: Extract items from invoice image
 */
async function extractInvoiceItemsDirectFetch(
  imageBase64: string,
): Promise<ExtractedInvoiceItem[]> {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY não configurada. Configure no arquivo .env antes de usar os serviços de IA.',
    );
  }

  const prompt = `Extraia todos os itens desta nota fiscal de supermercado. Para cada item, retorne: nome do produto, quantidade e unidade de medida.

IMPORTANTE: A unidade de medida DEVE ser uma das seguintes opções (use exatamente como escrito, em minúsculas):
- "kg" (quilogramas)
- "g" (gramas)
- "L" (litros - use L maiúsculo)
- "mL" (mililitros)
- "un" (unidades)
- "duzia" (dúzias)

Se a nota fiscal usar outras unidades (como "pacote", "caixa", "unidade", etc.), converta para "un".
Se usar "litro" ou "litros", use "L".
Se usar "quilo" ou "quilograma", use "kg".

Retorne em formato JSON estruturado: [{"nome": "...", "quantidade": ..., "unidade": "..."}]. 
Apenas retorne o JSON, sem texto adicional.`;

  const imageUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;

    try {
      const errorData = (await response.json()) as {
        error?: {
          message?: string;
          type?: string;
          code?: string;
        };
      };

      if (errorData?.error?.message) {
        errorMessage = errorData.error.message;
      }

      if (response.status === 429) {
        if (errorData?.error?.code === 'insufficient_quota') {
          throw new Error(
            'Quota da API OpenAI esgotada. Verifique seu plano e detalhes de cobrança em https://platform.openai.com/account/billing',
          );
        }
        throw new Error(
          'Muitas requisições. Por favor, aguarde um momento e tente novamente.',
        );
      }

      if (response.status === 401) {
        throw new Error(
          'Chave da API OpenAI inválida ou expirada. Verifique o arquivo .env.',
        );
      }

      if (response.status === 413) {
        throw new Error(
          'Imagem muito grande. Por favor, capture uma imagem com menor resolução.',
        );
      }
    } catch {
      const errorText = await response.text();
      errorMessage = `${errorMessage} - ${errorText}`;
    }

    throw new Error(errorMessage);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: { content?: string };
    }>;
  };
  const content = data.choices?.[0]?.message?.content || '';

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    const rawItems = JSON.parse(jsonMatch[0]) as Array<{
      nome: string;
      quantidade: number;
      unidade: string;
    }>;

    const items: ExtractedInvoiceItem[] = rawItems
      .filter(item => item.nome && item.quantidade && item.unidade)
      .map(item => ({
        nome: item.nome,
        quantidade: item.quantidade,
        unidade: normalizeUnit(item.unidade),
      }));

    return items;
  }

  throw new Error('Invalid response format from OpenAI');
}

/**
 * RF-008: Extract items from invoice image
 */
export async function extractInvoiceItems(
  imageBase64: string,
): Promise<ExtractedInvoiceItem[]> {
  return await extractInvoiceItemsDirectFetch(imageBase64);
}

/**
 * Extract items from audio transcription
 * RF-016: Process audio with Whisper + GPT
 */
export async function extractItemsFromAudio(
  audioUri: string,
  audioFile?: Blob | File,
): Promise<ExtractedInvoiceItem[]> {
  try {
    let file: File | Blob;

    if (audioFile) {
      file = audioFile;
    } else {
      const fetchResponse = await fetch(audioUri);
      file = await fetchResponse.blob();
    }

    const client = getOpenAIClient();
    const transcription = await client.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'pt',
    });

    const text = transcription.text;

    const prompt = `Extraia os itens e quantidades mencionados neste texto sobre uso de ingredientes.

IMPORTANTE: A unidade de medida DEVE ser uma das seguintes opções (use exatamente como escrito):
- "kg" (quilogramas)
- "g" (gramas)
- "L" (litros - use L maiúsculo)
- "mL" (mililitros)
- "un" (unidades)
- "duzia" (dúzias)

Se o texto mencionar outras unidades (como "pacote", "caixa", "unidade", etc.), converta para "un".
Se usar "litro" ou "litros", use "L".
Se usar "quilo" ou "quilograma", use "kg".

Exemplo: 'vou usar 2kg de farinha e 500g de açúcar' deve retornar: [{"nome": "farinha", "quantidade": 2, "unidade": "kg"}, {"nome": "açúcar", "quantidade": 500, "unidade": "g"}]

Retorne em formato JSON: [{"nome": "...", "quantidade": ..., "unidade": "..."}]. 
Apenas retorne o JSON, sem texto adicional.

Texto: ${text}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || '';

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const rawItems = JSON.parse(jsonMatch[0]) as Array<{
        nome: string;
        quantidade: number;
        unidade: string;
      }>;

      const items: ExtractedInvoiceItem[] = rawItems
        .filter(item => item.nome && item.quantidade && item.unidade)
        .map(item => ({
          nome: item.nome,
          quantidade: item.quantidade,
          unidade: normalizeUnit(item.unidade),
        }));

      return items;
    }

    throw new Error('Invalid response format from OpenAI');
  } catch (error) {
    console.error('Error extracting items from audio:', error);
    throw error;
  }
}

/**
 * Calculate production potential
 * RF-031: Send recipes and stock to OpenAI for calculation
 */
export async function calculateProductionPotential(
  recipes: Array<{
    nome: string;
    rendimento: number;
    ingredientes: Array<{
      nome: string;
      quantidade: number;
      unidade: Unit;
      quantidadeDisponivel: number;
    }>;
  }>,
  stock: Array<{
    nome: string;
    quantidade: number;
    unidade: Unit;
  }>,
): Promise<
  Array<{
    receita: string;
    quantidadePossivel: number;
    unidade: Unit;
  }>
> {
  try {
    const prompt = `Considere essas receitas que quero fazer: ${JSON.stringify(
      recipes,
      null,
      2,
    )}

E isso que tenho no estoque: ${JSON.stringify(stock, null, 2)}

Me fale quanto eu posso produzir de cada uma delas baseado no estoque disponível.

Retorne em formato JSON estruturado: {"potencialProdutivo": [{"receita": "nome da receita", "quantidadePossivel": X, "unidade": "unidades"}]}

Apenas retorne o JSON, sem texto adicional.`;

    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content || '';

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]) as {
        potencialProdutivo: Array<{
          receita: string;
          quantidadePossivel: number;
          unidade: string;
        }>;
      };

      return (result.potencialProdutivo || []).map(item => ({
        receita: item.receita,
        quantidadePossivel: item.quantidadePossivel,
        unidade: normalizeUnit(item.unidade),
      }));
    }

    throw new Error('Invalid response format from OpenAI');
  } catch (error) {
    console.error('Error calculating production potential:', error);
    throw error;
  }
}
