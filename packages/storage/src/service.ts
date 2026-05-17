import { getStorageProvider } from './registry';
import type { UploadFileResult } from './types';

/**
 * Uploads a file to the configured storage provider
 *
 * @param file - The file to upload (Buffer or Blob)
 * @param filename - Original filename with extension
 * @param contentType - MIME type of the file
 * @param folder - Optional folder path to store the file in
 * @returns Promise with the URL of the uploaded file and its storage key
 */
export const uploadFile = async (
  file: Buffer | Blob,
  filename: string,
  contentType: string,
  folder?: string
): Promise<UploadFileResult> => {
  const provider = getStorageProvider();
  return provider.uploadFile({ file, filename, contentType, folder });
};

/**
 * Deletes a file from the storage provider
 *
 * @param key - The storage key of the file to delete
 * @returns Promise that resolves when the file is deleted
 */
export const deleteFile = async (key: string): Promise<void> => {
  const provider = getStorageProvider();
  return provider.deleteFile(key);
};
