import { websiteConfig } from '@repo/config';
import { storageConfig } from './config/storage-config';
import type { StorageProvider } from './provider';
import { S3Provider } from './providers/s3';
import type { StorageConfig, StorageProviderName } from './types';

/**
 * Default storage configuration
 */
export const defaultStorageConfig: StorageConfig = storageConfig;

type StorageProviderFactory = () => StorageProvider;

const providerRegistry: Partial<
  Record<StorageProviderName, StorageProviderFactory>
> = {
  s3: () => new S3Provider(),
};

let storageProvider: StorageProvider | null = null;

function createStorageProvider(): StorageProvider {
  const name = websiteConfig.storage.provider;
  if (!name) throw new Error('storage.provider is required in websiteConfig.');
  const factory = providerRegistry[name];
  if (!factory) throw new Error(`Unsupported storage provider: ${name}.`);
  return factory();
}

/**
 * Get the storage provider
 * @returns current storage provider instance
 * @throws Error if provider is not initialized
 */
export const getStorageProvider = (): StorageProvider => {
  if (!storageProvider) storageProvider = createStorageProvider();
  return storageProvider;
};
