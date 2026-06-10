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
const TOKEN_COUNT_KEY_PATTERNS = [
  /(^|[_-])tokens?$/i,
  /(^|[_-])(input|output|cached|reasoning|total)tokens?$/i,
];
const PERMISSION_DECISION_METADATA_KEYS = new Set([
  'action',
  'decidedAt',
  'id',
  'outcome',
  'reasonCode',
  'reasonMessage',
  'resourceId',
  'resourceType',
  'subjectType',
]);

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

function isTokenCountMetadataKey(key: string): boolean {
  return TOKEN_COUNT_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function isAuditSafePermissionDecisionMetadata(
  value: Record<string, unknown>
): boolean {
  const keys = Object.keys(value);
  if (
    !keys.every((key) => PERMISSION_DECISION_METADATA_KEYS.has(key)) ||
    value.reasonMessage === undefined ||
    value.reasonCode === undefined ||
    value.outcome === undefined ||
    value.action === undefined ||
    value.resourceId === undefined
  ) {
    return false;
  }

  return (
    typeof value.reasonMessage === 'string' &&
    typeof value.reasonCode === 'string' &&
    (value.outcome === 'allow' || value.outcome === 'deny') &&
    (value.action === 'read' || value.action === 'execute') &&
    typeof value.resourceId === 'string'
  );
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

  const metadata = value as Record<string, unknown>;
  const isPermissionDecisionMetadata =
    isAuditSafePermissionDecisionMetadata(metadata);
  const sanitized: Record<string, unknown> = {};
  for (const [key, childValue] of Object.entries(metadata)) {
    if (key === 'reasonMessage' && isPermissionDecisionMetadata) {
      sanitized[key] = childValue;
      continue;
    }

    if (isRawMessageContentKey(key)) {
      sanitized[key] = '[Redacted]';
      continue;
    }

    if (isSensitiveMetadataKey(key) && !isTokenCountMetadataKey(key)) {
      sanitized[key] = '[Redacted]';
      continue;
    }

    sanitized[key] = sanitizeAuditMetadata(childValue, depth + 1);
  }

  return sanitized;
}
