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
const MAX_TOKENS_AUDIO = 2000;
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
  return `Você é um assistente especializado em extrair ingredientes e quantidades de receitas culinárias.

IMPORTANTE: Extraia TODOS os ingredientes e quantidades mencionados no texto. Não deixe nenhum de fora.

${UNIT_DESCRIPTIONS}

INSTRUÇÕES:
- Analise o texto cuidadosamente e identifique TODOS os ingredientes mencionados
- Para cada ingrediente, identifique sua quantidade e unidade de medida
- Retorne um array JSON com TODOS os itens encontrados
- Se o texto mencionar múltiplos ingredientes, todos devem aparecer no resultado

EXEMPLOS:
Texto: "vou usar 2kg de farinha e 500g de açúcar"
Resultado: [{"nome": "farinha", "quantidade": 2, "unidade": "kg"}, {"nome": "açúcar", "quantidade": 500, "unidade": "g"}]

Texto: "preciso de 1 litro de leite, 3 ovos e 250 gramas de manteiga"
Resultado: [{"nome": "leite", "quantidade": 1, "unidade": "L"}, {"nome": "ovos", "quantidade": 3, "unidade": "un"}, {"nome": "manteiga", "quantidade": 250, "unidade": "g"}]

Texto: "500g de farinha, 200g de açúcar, 100g de manteiga, 2 ovos"
Resultado: [{"nome": "farinha", "quantidade": 500, "unidade": "g"}, {"nome": "açúcar", "quantidade": 200, "unidade": "g"}, {"nome": "manteiga", "quantidade": 100, "unidade": "g"}, {"nome": "ovos", "quantidade": 2, "unidade": "un"}]

Retorne APENAS o JSON em formato de array: [{"nome": "...", "quantidade": ..., "unidade": "..."}]
Não adicione explicações, comentários ou texto adicional. Apenas o JSON.

Texto a analisar:
${transcriptionText}`;
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

IMPORTANTE: Para cada receita, identifique se há ingredientes faltando ou em quantidade insuficiente que impedem ou limitam a produção. 
- Se um ingrediente necessário não está presente no estoque, adicione um alerta do tipo "ingrediente_faltando"
- Se um ingrediente está presente mas em quantidade insuficiente para produzir a quantidade máxima possível, adicione um alerta do tipo "ingrediente_insuficiente"

Cada alerta deve conter:
- tipo: "ingrediente_faltando" ou "ingrediente_insuficiente"
- ingrediente: nome do ingrediente
- quantidadeNecessaria: quantidade necessária para a receita (do campo ingredientes da receita)
- unidadeNecessaria: unidade da quantidade necessária
- quantidadeDisponivel: quantidade disponível no estoque (0 se não estiver presente)
- unidadeDisponivel: unidade da quantidade disponível
- mensagem: mensagem explicativa sobre o problema (ex: "Faltam 500g de açúcar para completar a receita")

Retorne em formato JSON estruturado: 
{
  "potencialProdutivo": [
    {
      "receita": "nome da receita",
      "quantidadePossivel": X,
      "unidade": "unidades",
      "alertas": [
        {
          "tipo": "ingrediente_faltando",
          "ingrediente": "nome do ingrediente",
          "quantidadeNecessaria": X,
          "unidadeNecessaria": "unidade",
          "quantidadeDisponivel": 0,
          "unidadeDisponivel": "unidade",
          "mensagem": "mensagem explicativa"
        }
      ]
    }
  ]
}

O campo "alertas" é opcional - inclua apenas se houver ingredientes faltando ou insuficientes.

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
    console.log(
      '📏 [OPENAI] Tamanho da transcrição:',
      text.length,
      'caracteres',
    );
    console.log('📏 [OPENAI] Número de palavras:', text.split(/\s+/).length);

    if (!text || text.trim().length === 0) {
      throw new Error('Transcrição de áudio vazia. Tente gravar novamente.');
    }

    const prompt = getAudioExtractionPrompt(text);
    console.log(
      '📝 [OPENAI] Prompt completo sendo enviado (primeiros 500 caracteres):',
      prompt.substring(0, 500),
    );

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
    console.log(
      '📏 [OPENAI] Tamanho da resposta:',
      content.length,
      'caracteres',
    );

    // Check if transcription seems incomplete (too short for multiple items)
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 10) {
      console.warn(
        '⚠️ [OPENAI] Transcrição parece curta (',
        wordCount,
        'palavras). Verifique se todos os ingredientes foram capturados.',
      );
    }

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
      console.log('📊 [OPENAI] Total de itens extraídos:', rawItems.length);

      if (rawItems.length === 1 && wordCount > 15) {
        console.warn(
          '⚠️ [OPENAI] Apenas 1 item extraído, mas a transcrição tem',
          wordCount,
          'palavras. Pode haver mais itens que não foram capturados.',
        );
      }

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
    alertas?: Array<{
      tipo: 'ingrediente_faltando' | 'ingrediente_insuficiente';
      ingrediente: string;
      quantidadeNecessaria: number;
      unidadeNecessaria: Unit;
      quantidadeDisponivel: number;
      unidadeDisponivel: Unit;
      mensagem: string;
    }>;
  }>
> {
  try {
    console.log(
      '📊 [PRODUCTION POTENTIAL] Iniciando cálculo de potencial produtivo',
    );
    console.log(
      '📋 [PRODUCTION POTENTIAL] Receitas recebidas:',
      JSON.stringify(recipes, null, 2),
    );
    console.log(
      '📦 [PRODUCTION POTENTIAL] Estoque recebido:',
      JSON.stringify(stock, null, 2),
    );

    const prompt = getProductionPotentialPrompt(recipes, stock);
    console.log('💬 [PRODUCTION POTENTIAL] Prompt sendo enviado para IA:');
    console.log(prompt);

    const requestBody = {
      model: GPT_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: MAX_TOKENS_PRODUCTION,
    };
    console.log(
      '📤 [PRODUCTION POTENTIAL] Request body:',
      JSON.stringify(requestBody, null, 2),
    );

    const response = await fetch(CHAT_COMPLETIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': CONTENT_TYPE_JSON,
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log(
      '📥 [PRODUCTION POTENTIAL] Status da resposta:',
      response.status,
      response.statusText,
    );

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
    console.log('📨 [PRODUCTION POTENTIAL] Resposta completa da IA:');
    console.log(content);

    const jsonMatch = content.match(JSON_OBJECT_PATTERN);
    if (jsonMatch) {
      console.log(
        '✅ [PRODUCTION POTENTIAL] JSON encontrado na resposta:',
        jsonMatch[0],
      );

      const parsedResult = JSON.parse(jsonMatch[0]) as {
        potencialProdutivo: Array<{
          receita: string;
          quantidadePossivel: number;
          unidade: string;
          alertas?: Array<{
            tipo: 'ingrediente_faltando' | 'ingrediente_insuficiente';
            ingrediente: string;
            quantidadeNecessaria: number;
            unidadeNecessaria: string;
            quantidadeDisponivel: number;
            unidadeDisponivel: string;
            mensagem: string;
          }>;
        }>;
      };

      console.log(
        '🔍 [PRODUCTION POTENTIAL] Resultado parseado:',
        JSON.stringify(parsedResult, null, 2),
      );

      const roundNumber = (value: number): number => {
        if (Number.isInteger(value)) {
          return value;
        }
        return Math.round(value * 10000) / 10000;
      };

      const processedResult = (parsedResult.potencialProdutivo || []).map(
        item => ({
          receita: item.receita,
          quantidadePossivel: roundNumber(item.quantidadePossivel),
          unidade: normalizeUnit(item.unidade),
          alertas: item.alertas?.map(alerta => ({
            ...alerta,
            quantidadeNecessaria: roundNumber(alerta.quantidadeNecessaria),
            quantidadeDisponivel: roundNumber(alerta.quantidadeDisponivel),
            unidadeNecessaria: normalizeUnit(alerta.unidadeNecessaria),
            unidadeDisponivel: normalizeUnit(alerta.unidadeDisponivel),
          })),
        }),
      );

      console.log(
        '✨ [PRODUCTION POTENTIAL] Resultado processado e normalizado:',
        JSON.stringify(processedResult, null, 2),
      );
      console.log(
        '📊 [PRODUCTION POTENTIAL] Total de receitas processadas:',
        processedResult.length,
      );

      return processedResult;
    }

    console.error(
      '❌ [PRODUCTION POTENTIAL] JSON não encontrado na resposta da IA',
    );
    console.error('📄 [PRODUCTION POTENTIAL] Conteúdo recebido:', content);
    throw new Error(ERROR_MESSAGES.INVALID_RESPONSE_FORMAT);
  } catch (error) {
    console.error('Error calculating production potential:', error);
    throw error;
  }
}
