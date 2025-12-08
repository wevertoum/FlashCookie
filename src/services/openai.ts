import { OPENAI_API_KEY } from '@env';
import OpenAI from 'openai';

if (!OPENAI_API_KEY) {
  console.warn(
    'OPENAI_API_KEY não configurada. Configure no arquivo .env antes de usar os serviços de IA.',
  );
}

export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export const extractDataFromImage = async (
  imageBase64: string,
  prompt?: string,
): Promise<string> => {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                prompt ||
                'Extraia todos os dados relevantes desta nota fiscal, incluindo produtos, quantidades, valores e datas. Retorne em formato JSON.',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:')
                  ? imageBase64
                  : `data:image/png;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Erro ao extrair dados da imagem:', error);
    throw error;
  }
};

/**
 * Extrai dados de um áudio usando Whisper da OpenAI
 * @param audioUri - URI do arquivo de áudio ou base64
 * @param audioFile - Arquivo de áudio (FormData compatível)
 */
export const extractDataFromAudio = async (
  audioUri: string,
  audioFile?: Blob | File,
): Promise<string> => {
  try {
    let file: File | Blob;

    if (audioFile) {
      file = audioFile;
    } else {
      const fetchResponse = await fetch(audioUri);
      file = await fetchResponse.blob();
    }

    const response = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'pt',
    });

    return response.text;
  } catch (error) {
    console.error('Erro ao extrair dados do áudio:', error);
    throw error;
  }
};
