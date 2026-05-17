import { serverEnv } from '@repo/env/server';
import type { StorageConfig } from '../types';

/**
 * Default storage configuration
 *
 * This configuration is loaded from environment variables
 */
export const storageConfig: StorageConfig = {
  region: serverEnv.STORAGE_REGION || '',
  endpoint: serverEnv.STORAGE_ENDPOINT,
  accessKeyId: serverEnv.STORAGE_ACCESS_KEY_ID || '',
  secretAccessKey: serverEnv.STORAGE_SECRET_ACCESS_KEY || '',
  bucketName: serverEnv.STORAGE_BUCKET_NAME || '',
  publicUrl: serverEnv.STORAGE_PUBLIC_URL,
  forcePathStyle: true,
};
