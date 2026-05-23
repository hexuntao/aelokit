#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const dbShimRoot = join(root, 'apps/web/src/db');
const allowedShimExportPatterns = [
  /^export\s+\*\s+from\s+'@repo\/db(?:\/[a-z-]+)?';$/,
  /^export\s+\{\s*getDb\s*\}\s+from\s+'@repo\/db';$/,
];

function listFiles(directoryPath) {
  const entries = readdirSync(directoryPath, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const entryPath = join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      return listFiles(entryPath);
    }

    return [entryPath];
  });
}

function isAllowedShimLine(line) {
  return allowedShimExportPatterns.some((pattern) => pattern.test(line));
}

function validateShimFile(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return 'shim file is empty';
  }

  const invalidLines = lines.filter((line) => !isAllowedShimLine(line));

  if (invalidLines.length > 0) {
    return `shim must only contain @repo/db re-exports (found: ${invalidLines.join(', ')})`;
  }

  return null;
}

if (!statSync(dbShimRoot, { throwIfNoEntry: false })?.isDirectory()) {
  console.error('❌ apps/web/src/db: directory not found');
  process.exit(1);
}

const dbFiles = listFiles(dbShimRoot)
  .filter((filePath) => statSync(filePath).isFile())
  .sort();

let hasErrors = false;

for (const filePath of dbFiles) {
  const repositoryPath = relative(root, filePath);
  const dbRelativePath = relative(dbShimRoot, filePath);

  if (dbRelativePath.startsWith('migrations/')) {
    console.error(
      `❌ ${repositoryPath}: real migrations must live in packages/db/src/migrations/**`
    );
    hasErrors = true;
    continue;
  }

  const validationError = validateShimFile(filePath);

  if (validationError) {
    console.error(`❌ ${repositoryPath}: ${validationError}`);
    hasErrors = true;
    continue;
  }

  console.log(`✅ ${repositoryPath}: shim OK`);
}

if (hasErrors) {
  console.error(
    '\n❌ DB shim boundary check FAILED. apps/web/src/db must stay shim-only, and migrations must only exist in packages/db/src/migrations/**'
  );
  process.exit(1);
}

console.log('\n✅ All DB shim boundary checks passed');
