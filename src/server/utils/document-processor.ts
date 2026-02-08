// Полифилы для pdf-parse (требуются в Node.js среде)
if (typeof globalThis.DOMMatrix === 'undefined') {
  // @ts-expect-error - DOMMatrix polyfill for pdf-parse
  globalThis.DOMMatrix = class DOMMatrix {
    constructor() {
      return { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };
    }
  };
}

if (typeof globalThis.ImageData === 'undefined') {
  // @ts-expect-error - ImageData polyfill for pdf-parse  
  globalThis.ImageData = class ImageData {
    constructor(width: number, height: number) {
      return { width, height, data: new Uint8ClampedArray(width * height * 4) };
    }
  };
}

if (typeof globalThis.Path2D === 'undefined') {
  // @ts-expect-error - Path2D polyfill for pdf-parse
  globalThis.Path2D = class Path2D {
    constructor() {}
  };
}

/**
 * Извлекает текст из PDF файла
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Используем require для CommonJS модуля (pdf-parse не поддерживает ESM)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfModule = require('pdf-parse');
    // pdf-parse может экспортировать функцию напрямую или через default
    const pdf = typeof pdfModule === 'function' ? pdfModule : pdfModule.default;
    
    if (typeof pdf !== 'function') {
      throw new Error('pdf-parse module not loaded correctly');
    }
    
    const data = await pdf(buffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Конвертирует Buffer изображения в base64
 */
export function imageToBase64(buffer: Buffer, mimeType: string): string {
  const base64 = buffer.toString('base64');
  return base64;
}

/**
 * Проверяет, является ли файл изображением
 */
export function isImageFile(mimeType: string): boolean {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
  return imageTypes.includes(mimeType.toLowerCase());
}

/**
 * Проверяет, является ли файл PDF
 */
export function isPDFFile(mimeType: string): boolean {
  return mimeType.toLowerCase() === 'application/pdf';
}

/**
 * Получает MIME тип из расширения файла
 */
export function getMimeTypeFromExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Обрабатывает документ для AI анализа
 * Возвращает текст для PDF или base64 для изображений
 */
export async function processDocumentForAI(
  buffer: Buffer,
  mimeType: string
): Promise<{
  content: string;
  isImage: boolean;
  mimeType: string;
}> {
  if (isPDFFile(mimeType)) {
    const text = await extractTextFromPDF(buffer);
    return {
      content: text,
      isImage: false,
      mimeType,
    };
  }

  if (isImageFile(mimeType)) {
    const base64 = imageToBase64(buffer, mimeType);
    return {
      content: base64,
      isImage: true,
      mimeType,
    };
  }

  // Для других типов пробуем как текст
  return {
    content: buffer.toString('utf-8'),
    isImage: false,
    mimeType,
  };
}

/**
 * Валидирует размер файла (максимум 10MB для AI обработки)
 */
export function validateFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return size <= maxSizeBytes;
}

/**
 * Разбивает длинный текст на части для обработки
 */
export function splitTextIntoChunks(text: string, maxChunkSize: number = 10000): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  let currentChunk = '';

  const paragraphs = text.split('\n\n');

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
