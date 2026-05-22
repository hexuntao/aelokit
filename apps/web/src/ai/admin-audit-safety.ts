const SENSITIVE_KEY_PATTERNS = [
  /api[_-]?key/i,
  /authorization/i,
  /cookie/i,
  /credential/i,
  /mcp.*credential/i,
  /password/i,
  /secret/i,
  /token/i,
];

const RAW_CONTENT_KEY_PATTERNS = [/content/i, /message/i, /prompt/i, /text/i];
const MAX_METADATA_DEPTH = 5;

export function canAccessAdminUsageAudit(
  user: { readonly role?: string | null } | undefined,
  isDemo: boolean
): boolean {
  return user?.role === 'admin' || isDemo;
}

function isSensitiveMetadataKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function isRawMessageContentKey(key: string): boolean {
  return RAW_CONTENT_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function sanitizeAuditMetadata(value: unknown, depth = 0): unknown {
  if (depth > MAX_METADATA_DEPTH) {
    return '[Max depth exceeded]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeAuditMetadata(item, depth + 1));
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, childValue] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (isSensitiveMetadataKey(key)) {
      sanitized[key] = '[Redacted]';
      continue;
    }

    sanitized[key] = sanitizeAuditMetadata(childValue, depth + 1);
  }

  return sanitized;
}
