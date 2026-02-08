import { supabaseAdmin, DOCUMENTS_BUCKET } from '@/server/lib/supabase';
import {
  generateFileKey,
  validateFileBuffer,
  FileValidationError,
} from '@/server/utils/file-validation';

/**
 * Storage service result types
 */
export interface UploadResult {
  key: string;
  url: string;
}

export interface StorageError {
  message: string;
  code: string;
}

/**
 * Storage service for document management
 * Uses Supabase Storage for file storage
 */
export class StorageService {
  /**
   * Upload a file to storage
   * @param buffer - File buffer
   * @param fileName - Original file name
   * @param contentType - MIME type
   * @param userId - User ID for organizing files
   * @returns Upload result with key and URL
   */
  static async uploadFile(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    userId: string
  ): Promise<UploadResult> {
    // Validate file before upload
    validateFileBuffer(buffer, fileName, contentType);

    // Generate unique key
    const key = generateFileKey(userId, fileName);

    // Upload to Supabase Storage
    const { error } = await supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .upload(key, buffer, {
        contentType,
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw new Error(`Ошибка загрузки файла: ${error.message}`);
    }

    // Return key (URL will be generated on demand via signed URL)
    return {
      key,
      url: key, // Store key as URL reference
    };
  }

  /**
   * Get a signed URL for temporary file access
   * @param key - File key in storage
   * @param expiresIn - Expiration time in seconds (default 1 hour)
   * @returns Signed URL
   */
  static async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .createSignedUrl(key, expiresIn);

    if (error || !data) {
      console.error('Signed URL error:', error);
      throw new Error('Не удалось получить ссылку на файл');
    }

    return data.signedUrl;
  }

  /**
   * Get multiple signed URLs at once
   * @param keys - Array of file keys
   * @param expiresIn - Expiration time in seconds
   * @returns Map of key to signed URL
   */
  static async getSignedUrls(
    keys: string[],
    expiresIn: number = 3600
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    // Supabase doesn't have batch signed URL generation, so we do it in parallel
    const promises = keys.map(async (key) => {
      try {
        const url = await this.getSignedUrl(key, expiresIn);
        results.set(key, url);
      } catch {
        // Skip failed URLs
        console.error(`Failed to get signed URL for ${key}`);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Delete a file from storage
   * @param key - File key to delete
   * @returns Success boolean
   */
  static async deleteFile(key: string): Promise<boolean> {
    const { error } = await supabaseAdmin.storage.from(DOCUMENTS_BUCKET).remove([key]);

    if (error) {
      console.error('Storage delete error:', error);
      throw new Error(`Ошибка удаления файла: ${error.message}`);
    }

    return true;
  }

  /**
   * Delete multiple files from storage
   * @param keys - Array of file keys to delete
   * @returns Number of successfully deleted files
   */
  static async deleteFiles(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;

    const { error } = await supabaseAdmin.storage.from(DOCUMENTS_BUCKET).remove(keys);

    if (error) {
      console.error('Storage batch delete error:', error);
      throw new Error(`Ошибка удаления файлов: ${error.message}`);
    }

    return keys.length;
  }

  /**
   * Check if a file exists in storage
   * @param key - File key to check
   * @returns Boolean indicating existence
   */
  static async fileExists(key: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .list(key.split('/').slice(0, -1).join('/'), {
        search: key.split('/').pop(),
      });

    if (error) {
      return false;
    }

    return data.length > 0;
  }

  /**
   * Download a file from storage
   * @param key - File key to download
   * @returns File buffer
   */
  static async downloadFile(key: string): Promise<Buffer> {
    const { data, error } = await supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .download(key);

    if (error || !data) {
      console.error('Storage download error:', error);
      throw new Error('Не удалось скачать файл');
    }

    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Get file metadata
   * @param key - File key
   * @returns File metadata or null
   */
  static async getFileMetadata(key: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
  } | null> {
    // Extract folder path and filename
    const parts = key.split('/');
    const fileName = parts.pop();
    const folderPath = parts.join('/');

    const { data, error } = await supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .list(folderPath, {
        search: fileName,
      });

    if (error || !data || data.length === 0) {
      return null;
    }

    const file = data.find((f) => f.name === fileName);
    if (!file) {
      return null;
    }

    return {
      size: file.metadata?.size || 0,
      contentType: file.metadata?.mimetype || 'application/octet-stream',
      lastModified: new Date(file.updated_at || file.created_at),
    };
  }
}

// Export validation error for API routes
export { FileValidationError };
