import { existsSync } from 'node:fs';
import path from 'node:path';

const WORKSPACE_MARKER = 'pnpm-workspace.yaml';
const DEVELOPMENT_ENV = 'development';
const TEST_ENV = 'test';

function findWorkspaceRoot(startDir = process.cwd()) {
  let currentDir = startDir;

  while (currentDir !== path.dirname(currentDir)) {
    if (existsSync(path.join(currentDir, WORKSPACE_MARKER))) {
      return currentDir;
    }

    currentDir = path.dirname(currentDir);
  }

  return startDir;
}

export function loadWorkspaceEnv(startDir = process.cwd()) {
  const workspaceRoot = findWorkspaceRoot(startDir);
  const nodeEnv = process.env.NODE_ENV;
  const environmentName =
    nodeEnv === 'production' || nodeEnv === TEST_ENV
      ? nodeEnv
      : DEVELOPMENT_ENV;
  const envFiles = [
    `.env.${environmentName}.local`,
    environmentName === TEST_ENV ? '' : '.env.local',
    `.env.${environmentName}`,
    '.env',
  ].filter(Boolean);
  const loadedFiles: string[] = [];

  for (const envFile of envFiles) {
    const envPath = path.join(workspaceRoot, envFile);

    if (!existsSync(envPath)) {
      continue;
    }

    process.loadEnvFile(envPath);
    loadedFiles.push(envPath);
  }

  return {
    workspaceRoot,
    loadedFiles,
  };
}
