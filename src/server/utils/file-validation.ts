/**
 * File validation utilities for document uploads
 */

// Allowed MIME types for document uploads
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const;

// Allowed file extensions
export const ALLOWED_EXTENSIONS = ['.pdf', '.jpeg', '.jpg', '.png'] as const;

// Maximum file size: 10 MB
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Human-readable file size limit
export const MAX_FILE_SIZE_LABEL = '10 MB';

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

/**
 * File validation error
 */
export class FileValidationError extends Error {
  constructor(
    message: string,
    public code: 'INVALID_TYPE' | 'INVALID_SIZE' | 'INVALID_EXTENSION' | 'NO_FILE'
  ) {
    super(message);
    this.name = 'FileValidationError';
  }
}

/**
 * Validate file type, size, and extension
 * @throws FileValidationError if validation fails
 */
export function validateFile(file: File): void {
  if (!file) {
    throw new FileValidationError('Файл не предоставлен', 'NO_FILE');
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType)) {
    throw new FileValidationError(
      `Недопустимый тип файла: ${file.type}. Разрешены: PDF, JPEG, PNG`,
      'INVALID_TYPE'
    );
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new FileValidationError(
      `Файл слишком большой: ${sizeMB} MB. Максимальный размер: ${MAX_FILE_SIZE_LABEL}`,
      'INVALID_SIZE'
    );
  }

  // Check extension
  const extension = getFileExtension(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number])) {
    throw new FileValidationError(
      `Недопустимое расширение файла: ${extension}. Разрешены: ${ALLOWED_EXTENSIONS.join(', ')}`,
      'INVALID_EXTENSION'
    );
  }
}

/**
 * Validate file from buffer (for server-side validation)
 */
export function validateFileBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): void {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType)) {
    throw new FileValidationError(
      `Недопустимый тип файла: ${mimeType}. Разрешены: PDF, JPEG, PNG`,
      'INVALID_TYPE'
    );
  }

  // Check file size
  if (buffer.length > MAX_FILE_SIZE) {
    const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);
    throw new FileValidationError(
      `Файл слишком большой: ${sizeMB} MB. Максимальный размер: ${MAX_FILE_SIZE_LABEL}`,
      'INVALID_SIZE'
    );
  }

  // Check extension
  const extension = getFileExtension(fileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension as (typeof ALLOWED_EXTENSIONS)[number])) {
    throw new FileValidationError(
      `Недопустимое расширение файла: ${extension}. Разрешены: ${ALLOWED_EXTENSIONS.join(', ')}`,
      'INVALID_EXTENSION'
    );
  }
}

/**
 * Get file extension from filename
 */
export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot === -1) return '';
  return fileName.slice(lastDot);
}

/**
 * Sanitize filename - remove special characters, replace spaces
 * NOTE: Supabase Storage does NOT support Cyrillic characters in keys
 */
export function sanitizeFileName(fileName: string): string {
  // Get extension
  const extension = getFileExtension(fileName);
  const nameWithoutExt = fileName.slice(0, fileName.length - extension.length);

  // Remove special characters, keep only alphanumeric (ASCII), dashes, underscores
  // Cyrillic and other non-ASCII characters are NOT allowed by Supabase Storage
  const sanitized = nameWithoutExt
    .replace(/[^a-zA-Z0-9\s._-]/g, '') // Keep only ASCII alphanumeric, spaces, dots, dashes
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/\.+/g, '.') // Replace multiple dots with single
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^[._-]+|[._-]+$/g, '') // Remove leading/trailing special chars
    .slice(0, 100); // Limit length

  // If nothing left (e.g., filename was all Cyrillic), use generic name with timestamp
  const finalName = sanitized || `document_${Date.now()}`;

  return `${finalName}${extension.toLowerCase()}`;
}

/**
 * Generate unique file key for storage
 * Format: uploads/{userId}/{timestamp}-{sanitized-filename}
 */
export function generateFileKey(userId: string, fileName: string): string {
  const timestamp = Date.now();
  const sanitized = sanitizeFileName(fileName);
  return `uploads/${userId}/${timestamp}-${sanitized}`;
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file type label for display
 */
export function getFileTypeLabel(mimeType: string): string {
  const labels: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/jpeg': 'JPEG',
    'image/jpg': 'JPEG',
    'image/png': 'PNG',
  };
  return labels[mimeType] || 'Файл';
}

/**
 * Check if file is an image
 */
export function isImageFile(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Check if file is a PDF
 */
export function isPdfFile(mimeType: string): boolean {
  return mimeType === 'application/pdf';
}
