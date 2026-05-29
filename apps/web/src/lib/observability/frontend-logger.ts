type FrontendLogLevel = 'error' | 'info' | 'warn';

const SENSITIVE_KEYS = new Set([
  'accessToken',
  'authorization',
  'password',
  'refreshToken',
  'token',
]);

function sanitizeValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeValue(entry));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => {
        if (SENSITIVE_KEYS.has(key)) {
          return [key, '[redacted]'];
        }

        return [key, sanitizeValue(entryValue)];
      }),
    );
  }

  return value;
}

export function logFrontendEvent(
  level: FrontendLogLevel,
  event: string,
  payload: Record<string, unknown> = {},
): void {
  const safePayload = sanitizeValue(payload);
  const structuredPayload =
    safePayload && typeof safePayload === 'object' && !Array.isArray(safePayload)
      ? safePayload
      : {};

  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;

  logger('[web-auth]', {
    event,
    level,
    timestamp: new Date().toISOString(),
    ...structuredPayload,
  });
}
