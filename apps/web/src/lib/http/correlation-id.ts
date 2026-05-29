export function createCorrelationId(): string {
  if (typeof globalThis.crypto !== 'undefined' && 'randomUUID' in globalThis.crypto) {
    return globalThis.crypto.randomUUID();
  }

  return `corr-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}
