/**
 * RF-008, RF-016: OpenAI Gateway Service
 */

import { OPENAI_API_KEY } from '@env';
import type { ExtractedInvoiceItem, Unit } from '../types';
import { normalizeUnit } from '../utils/unitConversion';

// React Native FormData file type
type ReactNativeFile = {
  uri: string;
  type: string;
  name: string;
};

// API Configuration
const OPENAI_API_BASE_URL = 'https://api.openai.com/v1';
const CHAT_COMPLETIONS_ENDPOINT = `${OPENAI_API_BASE_URL}/chat/completions`;
const AUDIO_TRANSCRIPTIONS_ENDPOINT = `${OPENAI_API_BASE_URL}/audio/transcriptions`;

// Models
const GPT_MODEL = 'gpt-4o-mini';
const WHISPER_MODEL = 'whisper-1';

// Token Limits
const MAX_TOKENS_INVOICE = 2000;
const MAX_TOKENS_AUDIO = 1000;
const MAX_TOKENS_PRODUCTION = 2000;

// Audio Configuration
const AUDIO_LANGUAGE = 'pt';
const AUDIO_MIME_TYPE = 'audio/mp4';
const AUDIO_FILE_NAME = 'audio.mp4';

// Content Types
const CONTENT_TYPE_JSON = 'application/json';

// HTTP Status Codes
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;
const HTTP_STATUS_UNAUTHORIZED = 401;
const HTTP_STATUS_PAYLOAD_TOO_LARGE = 413;

// Error Codes
const ERROR_CODE_INSUFFICIENT_QUOTA = 'insufficient_quota';

// Error Messages
const ERROR_MESSAGES = {
  API_KEY_NOT_CONFIGURED:
    'OPENAI_API_KEY não configurada. Configure no arquivo .env antes de usar os serviços de IA.',
  INVALID_RESPONSE_FORMAT: 'Invalid response format from OpenAI',
  QUOTA_EXHAUSTED:
    'Quota da API OpenAI esgotada. Verifique seu plano e detalhes de cobrança em https://platform.openai.com/account/billing',
  TOO_MANY_REQUESTS:
    'Muitas requisições. Por favor, aguarde um momento e tente novamente.',
  INVALID_API_KEY:
    'Chave da API OpenAI inválida ou expirada. Verifique o arquivo .env.',
  IMAGE_TOO_LARGE:
    'Imagem muito grande. Por favor, capture uma imagem com menor resolução.',
} as const;

// Regex Patterns
const JSON_ARRAY_PATTERN = /\[[\s\S]*\]/;
const JSON_OBJECT_PATTERN = /\{[\s\S]*\}/;

// Prompt Templates
const UNIT_DESCRIPTIONS = `IMPORTANTE: A unidade de medida DEVE ser uma das seguintes opções (use exatamente como escrito):
- "kg" (quilogramas)
- "g" (gramas)
- "L" (litros - use L maiúsculo)
- "mL" (mililitros)
- "un" (unidades)
- "duzia" (dúzias)

Se mencionar outras unidades (como "pacote", "caixa", "unidade", etc.), converta para "un".
Se usar "litro" ou "litros", use "L".
Se usar "quilo" ou "quilograma", use "kg".`;

const getInvoiceExtractionPrompt = (): string => {
  return `Extraia todos os itens desta nota fiscal de supermercado. Para cada item, retorne: nome do produto, quantidade e unidade de medida.

${UNIT_DESCRIPTIONS}

Retorne em formato JSON estruturado: [{"nome": "...", "quantidade": ..., "unidade": "..."}]. 
Apenas retorne o JSON, sem texto adicional.`;
};

const getAudioExtractionPrompt = (transcriptionText: string): string => {
  return `Extraia os itens e quantidades mencionados neste texto sobre uso de ingredientes.

${UNIT_DESCRIPTIONS}

Exemplo: 'vou usar 2kg de farinha e 500g de açúcar' deve retornar: [{"nome": "farinha", "quantidade": 2, "unidade": "kg"}, {"nome": "açúcar", "quantidade": 500, "unidade": "g"}]

Retorne em formato JSON: [{"nome": "...", "quantidade": ..., "unidade": "..."}]. 
Apenas retorne o JSON, sem texto adicional.

Texto: ${transcriptionText}`;
};

const getProductionPotentialPrompt = (
  recipes: unknown,
  stock: unknown,
): string => {
  return `Considere essas receitas que quero fazer: ${JSON.stringify(
    recipes,
    null,
    2,
  )}

E isso que tenho no estoque: ${JSON.stringify(stock, null, 2)}

Me fale quanto eu posso produzir de cada uma delas baseado no estoque disponível.

Retorne em formato JSON estruturado: {"potencialProdutivo": [{"receita": "nome da receita", "quantidadePossivel": X, "unidade": "unidades"}]}

Apenas retorne o JSON, sem texto adicional.`;
};

/**
 * RF-008: Extract items from invoice image
 */
async function extractInvoiceItemsDirectFetch(
  imageBase64: string,
): Promise<ExtractedInvoiceItem[]> {
  if (!OPENAI_API_KEY) {
    throw new Error(ERROR_MESSAGES.API_KEY_NOT_CONFIGURED);
  }

  const prompt = getInvoiceExtractionPrompt();
  const imageUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const response = await fetch(CHAT_COMPLETIONS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': CONTENT_TYPE_JSON,
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: GPT_MODEL,
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
      max_tokens: MAX_TOKENS_INVOICE,
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

      if (response.status === HTTP_STATUS_TOO_MANY_REQUESTS) {
        if (errorData?.error?.code === ERROR_CODE_INSUFFICIENT_QUOTA) {
          throw new Error(ERROR_MESSAGES.QUOTA_EXHAUSTED);
        }
        throw new Error(ERROR_MESSAGES.TOO_MANY_REQUESTS);
      }

      if (response.status === HTTP_STATUS_UNAUTHORIZED) {
        throw new Error(ERROR_MESSAGES.INVALID_API_KEY);
      }

      if (response.status === HTTP_STATUS_PAYLOAD_TOO_LARGE) {
        throw new Error(ERROR_MESSAGES.IMAGE_TOO_LARGE);
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

  const jsonMatch = content.match(JSON_ARRAY_PATTERN);
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

  throw new Error(ERROR_MESSAGES.INVALID_RESPONSE_FORMAT);
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
    if (!OPENAI_API_KEY) {
      throw new Error(ERROR_MESSAGES.API_KEY_NOT_CONFIGURED);
    }

    const formData = new FormData();

    if (audioUri.startsWith('file://')) {
      const file: ReactNativeFile = {
        uri: audioUri,
        type: AUDIO_MIME_TYPE,
        name: AUDIO_FILE_NAME,
      };
      formData.append('file', file as unknown as Blob);
    } else if (audioFile) {
      formData.append('file', audioFile as unknown as Blob);
    } else {
      const fetchResponse = await fetch(audioUri);
      const blob = await fetchResponse.blob();
      formData.append('file', blob);
    }

    formData.append('model', WHISPER_MODEL);
    formData.append('language', AUDIO_LANGUAGE);

    const transcriptionResponse = await fetch(AUDIO_TRANSCRIPTIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      // @ts-ignore - React Native FormData type incompatibility
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      let errorMessage = `OpenAI API error: ${transcriptionResponse.status} ${transcriptionResponse.statusText}`;
      try {
        const errorData = (await transcriptionResponse.json()) as {
          error?: {
            message?: string;
            type?: string;
            code?: string;
          };
        };
        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        const errorText = await transcriptionResponse.text();
        errorMessage = `${errorMessage} - ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const transcriptionData = (await transcriptionResponse.json()) as {
      text?: string;
    };
    const text = transcriptionData.text || '';

    console.log('🎤 [OPENAI] Transcrição do áudio:', text);

    const prompt = getAudioExtractionPrompt(text);

    const chatResponse = await fetch(CHAT_COMPLETIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': CONTENT_TYPE_JSON,
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: MAX_TOKENS_AUDIO,
      }),
    });

    if (!chatResponse.ok) {
      let errorMessage = `OpenAI API error: ${chatResponse.status} ${chatResponse.statusText}`;
      try {
        const errorData = (await chatResponse.json()) as {
          error?: {
            message?: string;
            type?: string;
            code?: string;
          };
        };
        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
        }
      } catch {
        const errorText = await chatResponse.text();
        errorMessage = `${errorMessage} - ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    const chatData = (await chatResponse.json()) as {
      choices?: Array<{
        message?: { content?: string };
      }>;
    };
    const content = chatData.choices?.[0]?.message?.content || '';

    console.log('🤖 [OPENAI] Resposta completa da IA:', content);

    const jsonMatch = content.match(JSON_ARRAY_PATTERN);
    if (jsonMatch) {
      const rawItems = JSON.parse(jsonMatch[0]) as Array<{
        nome: string;
        quantidade: number;
        unidade: string;
      }>;

      console.log(
        '📦 [OPENAI] Itens brutos extraídos:',
        JSON.stringify(rawItems, null, 2),
      );

      const items: ExtractedInvoiceItem[] = rawItems
        .filter(item => item.nome && item.quantidade && item.unidade)
        .map(item => ({
          nome: item.nome,
          quantidade: item.quantidade,
          unidade: normalizeUnit(item.unidade),
        }));

      console.log(
        '✅ [OPENAI] Itens processados e normalizados:',
        JSON.stringify(items, null, 2),
      );

      return items;
    }

    throw new Error(ERROR_MESSAGES.INVALID_RESPONSE_FORMAT);
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
    const prompt = getProductionPotentialPrompt(recipes, stock);

    const response = await fetch(CHAT_COMPLETIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': CONTENT_TYPE_JSON,
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: MAX_TOKENS_PRODUCTION,
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

    const jsonMatch = content.match(JSON_OBJECT_PATTERN);
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

    throw new Error(ERROR_MESSAGES.INVALID_RESPONSE_FORMAT);
  } catch (error) {
    console.error('Error calculating production potential:', error);
    throw error;
  }
}
