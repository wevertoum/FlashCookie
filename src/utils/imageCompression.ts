/**
 * RF-008: Image compression utilities
 */

const MAX_IMAGE_SIZE_KB = 500;
const MAX_DIMENSION = 1024;
const TARGET_QUALITY: 0.5 = 0.5;

function getBase64SizeKB(base64: string): number {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  return (base64Data.length * 0.75) / 1024;
}

export async function compressImageBase64(
  imageBase64: string,
  maxSizeKB: number = MAX_IMAGE_SIZE_KB,
): Promise<string> {
  const currentSize = getBase64SizeKB(imageBase64);

  if (currentSize <= maxSizeKB) {
    return imageBase64;
  }

  console.warn(
    `Image size is ${currentSize.toFixed(
      2,
    )}KB, which exceeds the recommended ${maxSizeKB}KB. ` +
      `The image will be sent anyway, but may cause errors if too large.`,
  );

  return imageBase64;
}

export function getOptimalImagePickerOptions() {
  return {
    mediaType: 'photo' as const,
    quality: TARGET_QUALITY,
    maxWidth: MAX_DIMENSION,
    maxHeight: MAX_DIMENSION,
    includeBase64: true,
  };
}

export async function prepareImageForOpenAI(
  imageBase64: string,
): Promise<string> {
  const sizeKB = getBase64SizeKB(imageBase64);

  if (sizeKB > 20000) {
    throw new Error(
      `Imagem muito grande (${sizeKB.toFixed(2)}KB). ` +
        `Por favor, capture uma imagem com menor resolução ou qualidade.`,
    );
  }

  return compressImageBase64(imageBase64, MAX_IMAGE_SIZE_KB);
}
