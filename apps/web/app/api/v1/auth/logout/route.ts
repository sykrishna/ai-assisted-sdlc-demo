import { NextResponse } from 'next/server';
import { AUTH_REFRESH_COOKIE_NAME } from '../../../../../src/features/auth/auth-constants';
import type { LogoutResponse } from '../../../../../src/features/auth/auth-types';
import {
  clearRefreshCookie,
  createBackendUnavailableProblem,
  extractCorrelationHeaders,
  parseBackendProblem,
  proxyAuthRequest,
  logAuthProxyEvent,
  prepareAuthMetric,
} from '../../../../../src/features/auth/server/backend-auth-proxy';

function extractAccessToken(headerValue: string | null): string | undefined {
  if (!headerValue?.startsWith('Bearer ')) {
    return undefined;
  }

  return headerValue.slice('Bearer '.length);
}

export async function POST(request: Request) {
  const correlation = extractCorrelationHeaders(request);

  try {
    const body = (await request.json()) as {
      allSessions?: boolean;
      sessionId?: string;
    };
    const cookieHeader = request.headers.get('cookie') ?? '';
    const requestCookies = new Map(
      cookieHeader
        .split(';')
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
          const [name, ...value] = entry.split('=');
          return [name, value.join('=')];
        }),
    );
    const result = await proxyAuthRequest<LogoutResponse>({
      accessToken: extractAccessToken(request.headers.get('authorization')),
      body,
      correlation,
      endpoint: '/api/v1/auth/logout',
      method: 'POST',
    });

    const response = NextResponse.json(result.body, { status: result.status });
    response.cookies.set(clearRefreshCookie());
    logAuthProxyEvent('info', 'auth.proxy.logout.completed', {
      correlationId: result.correlationId,
      hadRefreshCookie: Boolean(requestCookies.get(AUTH_REFRESH_COOKIE_NAME)),
      statusCode: result.status,
    });
    prepareAuthMetric('auth.logout.success', { status: 'success' });
    return response;
  } catch (error) {
    const problem = parseBackendProblem(
      error,
      createBackendUnavailableProblem(correlation.correlationId),
    );
    const response = NextResponse.json(problem, { status: problem.status });
    response.cookies.set(clearRefreshCookie());
    logAuthProxyEvent('warn', 'auth.proxy.logout.failed', {
      code: problem.code,
      correlationId: problem.correlationId,
      statusCode: problem.status,
    });
    prepareAuthMetric('auth.logout.failure', { code: problem.code, status: 'failure' });
    return response;
  }
}
