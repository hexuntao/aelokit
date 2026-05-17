#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const shims = [
  'apps/web/src/db/auth.schema.ts',
  'apps/web/src/db/app.schema.ts',
  'apps/web/src/db/schema.ts',
  'apps/web/src/db/index.ts',
];

const forbiddenPatterns = [
  'pgTable',
  'relations',
  'varchar',
  'integer',
  'boolean',
  'timestamp',
  'drizzle',
  'postgres',
];

const root = process.cwd();
let hasErrors = false;

for (const shim of shims) {
  const filePath = join(root, shim);
  let content;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    console.error(`❌ ${shim}: file not found`);
    hasErrors = true;
    continue;
  }

  const violations = [];
  for (const pattern of forbiddenPatterns) {
    const regex = new RegExp(`\\b${pattern}\\b`);
    if (regex.test(content)) {
      violations.push(pattern);
    }
  }

  if (violations.length > 0) {
    console.error(
      `❌ ${shim}: contains real schema code (${violations.join(', ')})`
    );
    hasErrors = true;
  } else {
    console.log(`✅ ${shim}: shim OK`);
  }
}

if (hasErrors) {
  console.error(
    '\n❌ DB shim boundary check FAILED. Real schema code must only exist in packages/db/src/*'
  );
  process.exit(1);
} else {
  console.log('\n✅ All DB shim boundary checks passed');
}
