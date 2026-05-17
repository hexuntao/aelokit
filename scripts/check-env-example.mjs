#!/usr/bin/env node

import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT_DIR = process.cwd();
const ENV_EXAMPLE_PATH = join(ROOT_DIR, 'env.example');
const DOT_ENV_EXAMPLE_PATH = join(ROOT_DIR, '.env.example');
const SERVER_ENV_PATH = join(ROOT_DIR, 'packages/env/src/server.ts');
const CLIENT_ENV_PATH = join(ROOT_DIR, 'packages/env/src/client.ts');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function parseEnvExample(content) {
  const vars = new Set();
  const duplicates = [];
  const seen = new Set();
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || trimmed === '') continue;

    const match = trimmed.match(/^([A-Z][A-Z0-9_]*)=/);
    if (match) {
      const varName = match[1];
      if (seen.has(varName)) {
        duplicates.push(varName);
      } else {
        seen.add(varName);
        vars.add(varName);
      }
    }
  }

  return { vars, duplicates };
}

function parseEnvSchema(content, schemaType) {
  const vars = new Set();
  const schemaRegex = schemaType === 'server' ? /server:\s*\{([\s\S]*?)\n\s*\}/ : /client:\s*\{([\s\S]*?)\n\s*\}/;
  const match = content.match(schemaRegex);

  if (!match) return vars;

  const schemaContent = match[1];
  const varRegex = /([A-Z][A-Z0-9_]*):\s/g;
  let varMatch;

  while ((varMatch = varRegex.exec(schemaContent)) !== null) {
    vars.add(varMatch[1]);
  }

  return vars;
}

function validateNextPublicPrefix(serverVars, clientVars) {
  const errors = [];

  for (const varName of serverVars) {
    if (varName.startsWith('NEXT_PUBLIC_')) {
      errors.push(`Server schema variable "${varName}" should not start with NEXT_PUBLIC_`);
    }
  }

  return errors;
}

function main() {
  let hasErrors = false;
  const warnings = [];

  log('cyan', '\n=== Env Example Consistency Check ===\n');

  if (existsSync(DOT_ENV_EXAMPLE_PATH)) {
    log('red', '✗ FAIL: .env.example exists (should not exist)');
    log('red', '  The canonical env file is env.example, not .env.example');
    hasErrors = true;
  } else {
    log('green', '✓ PASS: .env.example does not exist');
  }

  if (!existsSync(ENV_EXAMPLE_PATH)) {
    log('red', '✗ FAIL: env.example does not exist');
    hasErrors = true;
    console.log('\n');
    process.exit(1);
  } else {
    log('green', '✓ PASS: env.example exists');
  }

  const envExampleContent = readFileSync(ENV_EXAMPLE_PATH, 'utf-8');
  const { vars: exampleVars, duplicates: duplicateVars } = parseEnvExample(envExampleContent);

  if (duplicateVars.length > 0) {
    log('red', `✗ FAIL: Duplicate variables in env.example: ${duplicateVars.join(', ')}`);
    hasErrors = true;
  } else {
    log('green', '✓ PASS: No duplicate variables in env.example');
  }

  if (!existsSync(SERVER_ENV_PATH)) {
    log('red', `✗ FAIL: ${SERVER_ENV_PATH} does not exist`);
    hasErrors = true;
    console.log('\n');
    process.exit(1);
  }

  if (!existsSync(CLIENT_ENV_PATH)) {
    log('red', `✗ FAIL: ${CLIENT_ENV_PATH} does not exist`);
    hasErrors = true;
    console.log('\n');
    process.exit(1);
  }

  const serverContent = readFileSync(SERVER_ENV_PATH, 'utf-8');
  const clientContent = readFileSync(CLIENT_ENV_PATH, 'utf-8');

  const serverVars = parseEnvSchema(serverContent, 'server');
  const clientVars = parseEnvSchema(clientContent, 'client');
  const schemaVars = new Set([...serverVars, ...clientVars]);

  log('green', `✓ Found ${serverVars.size} variables in server schema`);
  log('green', `✓ Found ${clientVars.size} variables in client schema`);
  log('green', `✓ Found ${exampleVars.size} variables in env.example`);

  const missingInExample = [...schemaVars].filter(v => !exampleVars.has(v));
  const notInSchema = [...exampleVars].filter(v => !schemaVars.has(v));

  console.log('\n--- Validation Results ---\n');

  if (missingInExample.length > 0) {
    log('red', `✗ FAIL: Variables in schema but missing in env.example (${missingInExample.length}):`);
    for (const v of missingInExample) {
      log('red', `  - ${v}`);
    }
    hasErrors = true;
  } else {
    log('green', '✓ PASS: All schema variables exist in env.example');
  }

  const prefixErrors = validateNextPublicPrefix(serverVars, clientVars);
  if (prefixErrors.length > 0) {
    log('red', '✗ FAIL: NEXT_PUBLIC_ prefix violations:');
    for (const err of prefixErrors) {
      log('red', `  - ${err}`);
    }
    hasErrors = true;
  } else {
    log('green', '✓ PASS: No NEXT_PUBLIC_ prefix violations');
  }

  const reservedVars = ['SKIP_ENV_VALIDATION'];
  const actualNotInSchema = notInSchema.filter(v => !reservedVars.includes(v));

  if (actualNotInSchema.length > 0) {
    log('yellow', `\n⚠ WARNING: Variables in env.example but not in schema (${actualNotInSchema.length}):`);
    for (const v of actualNotInSchema) {
      log('yellow', `  - ${v}`);
    }
    log('yellow', '  (This is OK for reserved/provider-specific variables)');
  }

  console.log('\n--- Summary ---\n');

  if (hasErrors) {
    log('red', '✗ Check failed with errors');
    console.log('\n');
    process.exit(1);
  } else {
    log('green', '✓ All checks passed');
    if (actualNotInSchema.length > 0) {
      log('yellow', `  (${actualNotInSchema.length} warnings)`);
    }
    console.log('\n');
    process.exit(0);
  }
}

main();
