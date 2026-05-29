import { createCorrelationId } from './correlation-id';
import { logFrontendEvent } from '../observability/frontend-logger';
import type { ProblemDetails } from '../../features/auth/auth-types';

type ApiRequestOptions = {
  accessToken?: string;
  body?: Record<string, unknown>;
  headers?: HeadersInit;
  method?: 'GET' | 'POST';
  path: string;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  readonly code: string;
  readonly correlationId: string;
  readonly retryable: boolean;
  readonly status: number;

  constructor(problem: ProblemDetails) {
    super(problem.detail);
    this.code = problem.code;
    this.correlationId = problem.correlationId;
    this.retryable = problem.retryable;
    this.status = problem.status;
  }
}

async function parseResponseBody<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function parseProblemDetails(
  response: Response,
  correlationId: string,
): Promise<ProblemDetails> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return parseResponseBody<ProblemDetails>(response);
  }

  return {
    code: 'HTTP_ERROR',
    correlationId,
    detail: 'Request failed.',
    retryable: response.status >= 500,
    status: response.status,
    timestamp: new Date().toISOString(),
    title: 'Request Failed',
    type: 'https://example.com/problems/http-error',
  };
}

export async function apiRequest<T>({
  accessToken,
  body,
  headers,
  method = 'GET',
  path,
  signal,
}: ApiRequestOptions): Promise<T> {
  const correlationId = createCorrelationId();
  const startedAt = performance.now();

  const response = await fetch(path, {
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Platform': 'pwa',
      'X-Correlation-Id': correlationId,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    method,
    signal,
  });

  const durationMs = Math.round(performance.now() - startedAt);

  if (!response.ok) {
    const problem = await parseProblemDetails(
      response,
      response.headers.get('x-correlation-id') ?? correlationId,
    );
    logFrontendEvent('warn', 'auth.api.failure', {
      code: problem.code,
      correlationId: problem.correlationId,
      durationMs,
      path,
      retryable: problem.retryable,
      status: response.status,
    });
    throw new ApiError(problem);
  }

  logFrontendEvent('info', 'auth.api.success', {
    correlationId,
    durationMs,
    path,
    status: response.status,
  });

  return parseResponseBody<T>(response);
}
