import { createCorrelationId } from '../../../lib/http/correlation-id';
import type { LoginResponse, ProblemDetails, RefreshResponse } from '../auth-types';
import { AUTH_REFRESH_COOKIE_NAME } from '../auth-constants';

type CorrelationHeaders = {
  clientPlatform: string;
  correlationId: string;
  traceparent?: string;
  tracestate?: string;
};

type ProxyRequestOptions = {
  accessToken?: string;
  body?: Record<string, unknown>;
  correlation: CorrelationHeaders;
  endpoint: string;
  method: 'GET' | 'POST';
};

type ProxyResult<T> = {
  body: T;
  correlationId: string;
  status: number;
};

const GENERIC_AUTH_FAILURE = 'Authentication failed.';
const AUTH_BACKEND_UNAVAILABLE = 'Authentication service is temporarily unavailable.';

function getBackendBaseUrl(): string {
  const baseUrl = process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw createProblemDetails(500, 'AUTH_CONFIGURATION_ERROR', AUTH_BACKEND_UNAVAILABLE, true);
  }

  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

function createProblemDetails(
  status: number,
  code: string,
  detail: string,
  retryable: boolean,
  correlationId = createCorrelationId(),
): ProblemDetails {
  return {
    code,
    correlationId,
    detail,
    retryable,
    status,
    timestamp: new Date().toISOString(),
    title: status >= 500 ? 'Service Unavailable' : status === 400 ? 'Bad Request' : 'Unauthorized',
    type: `https://example.com/problems/${code.toLowerCase()}`,
  };
}

function createFallbackProblemFromStatus(status: number, correlationId: string): ProblemDetails {
  if (status === 400) {
    return createProblemDetails(
      status,
      'AUTH_INVALID_REQUEST',
      'The authentication request is invalid.',
      false,
      correlationId,
    );
  }

  if (status === 429) {
    return createProblemDetails(
      status,
      'AUTH_RATE_LIMITED',
      'Authentication requests are temporarily throttled.',
      true,
      correlationId,
    );
  }

  if (status >= 500) {
    return createProblemDetails(
      status,
      'AUTH_DEPENDENCY_UNAVAILABLE',
      AUTH_BACKEND_UNAVAILABLE,
      true,
      correlationId,
    );
  }

  return createProblemDetails(
    status,
    'AUTH_UNAUTHORIZED',
    GENERIC_AUTH_FAILURE,
    false,
    correlationId,
  );
}

export function extractCorrelationHeaders(request: Request): CorrelationHeaders {
  return {
    clientPlatform: request.headers.get('x-client-platform') ?? 'web',
    correlationId: request.headers.get('x-correlation-id') ?? createCorrelationId(),
    traceparent: request.headers.get('traceparent') ?? undefined,
    tracestate: request.headers.get('tracestate') ?? undefined,
  };
}

export function logAuthProxyEvent(
  level: 'error' | 'info' | 'warn',
  event: string,
  payload: Record<string, unknown>,
): void {
  const logger = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
  logger('[web-auth-proxy]', {
    event,
    level,
    timestamp: new Date().toISOString(),
    ...payload,
  });
}

export function prepareAuthMetric(name: string, tags: Record<string, string>): void {
  logAuthProxyEvent('info', 'auth.metric.prepared', {
    metricName: name,
    tags,
  });
}

export function sanitizeTokenResponse<T extends LoginResponse | RefreshResponse>(response: T): T {
  return {
    ...response,
    refreshToken: 'cookie-managed',
  };
}

export function buildRefreshCookie(tokenValue: string, expiresAt: string) {
  return {
    expires: new Date(expiresAt),
    httpOnly: true,
    name: AUTH_REFRESH_COOKIE_NAME,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    value: tokenValue,
  };
}

export function clearRefreshCookie() {
  return {
    expires: new Date(0),
    httpOnly: true,
    name: AUTH_REFRESH_COOKIE_NAME,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    value: '',
  };
}

export function createBackendUnavailableProblem(correlationId: string): ProblemDetails {
  return createProblemDetails(
    503,
    'AUTH_DEPENDENCY_UNAVAILABLE',
    AUTH_BACKEND_UNAVAILABLE,
    true,
    correlationId,
  );
}

export function parseBackendProblem(error: unknown, fallback: ProblemDetails): ProblemDetails {
  if (error && typeof error === 'object' && 'code' in error && 'status' in error) {
    return error as ProblemDetails;
  }

  return fallback;
}

export async function proxyAuthRequest<T>({
  accessToken,
  body,
  correlation,
  endpoint,
  method,
}: ProxyRequestOptions): Promise<ProxyResult<T>> {
  const response = await fetch(`${getBackendBaseUrl()}${endpoint}`, {
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    headers: {
      'content-type': 'application/json',
      'x-client-platform': correlation.clientPlatform,
      'x-correlation-id': correlation.correlationId,
      ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      ...(correlation.traceparent ? { traceparent: correlation.traceparent } : {}),
      ...(correlation.tracestate ? { tracestate: correlation.tracestate } : {}),
    },
    method,
  }).catch(() => {
    throw createBackendUnavailableProblem(correlation.correlationId);
  });

  const responseCorrelationId =
    response.headers.get('x-correlation-id') ?? correlation.correlationId;

  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.includes('application/json')) {
      const problem = (await response.json()) as ProblemDetails;
      throw {
        ...problem,
        correlationId: problem.correlationId || responseCorrelationId,
        detail:
          response.status === 400
            ? problem.detail
            : response.status === 429
              ? 'Authentication requests are temporarily throttled.'
              : response.status >= 500
                ? AUTH_BACKEND_UNAVAILABLE
                : GENERIC_AUTH_FAILURE,
      } satisfies ProblemDetails;
    }

    throw createFallbackProblemFromStatus(response.status, responseCorrelationId);
  }

  return {
    body: (await response.json()) as T,
    correlationId: responseCorrelationId,
    status: response.status,
  };
}
