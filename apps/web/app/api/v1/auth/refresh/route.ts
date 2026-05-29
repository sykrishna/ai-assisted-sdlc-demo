import { NextResponse } from 'next/server';
import { AUTH_REFRESH_COOKIE_NAME } from '../../../../../src/features/auth/auth-constants';
import type { RefreshResponse } from '../../../../../src/features/auth/auth-types';
import {
  buildRefreshCookie,
  clearRefreshCookie,
  createBackendUnavailableProblem,
  extractCorrelationHeaders,
  parseBackendProblem,
  proxyAuthRequest,
  sanitizeTokenResponse,
  logAuthProxyEvent,
  prepareAuthMetric,
} from '../../../../../src/features/auth/server/backend-auth-proxy';

export async function POST(request: Request) {
  const correlation = extractCorrelationHeaders(request);

  try {
    const body = (await request.json()) as {
      refreshToken?: string;
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
    const refreshToken = requestCookies.get(AUTH_REFRESH_COOKIE_NAME) ?? body.refreshToken;

    const result = await proxyAuthRequest<RefreshResponse>({
      body: {
        refreshToken,
        sessionId: body.sessionId,
      },
      correlation,
      endpoint: '/api/v1/auth/refresh',
      method: 'POST',
    });

    const nextResponse = NextResponse.json(sanitizeTokenResponse(result.body), { status: 200 });
    nextResponse.cookies.set(
      buildRefreshCookie(result.body.refreshToken, result.body.session.expiresAt),
    );
    logAuthProxyEvent('info', 'auth.proxy.refresh.completed', {
      correlationId: result.correlationId,
      sessionId: result.body.session.sessionId,
      statusCode: result.status,
    });
    prepareAuthMetric('auth.refresh.success', { status: 'success' });
    return nextResponse;
  } catch (error) {
    const problem = parseBackendProblem(
      error,
      createBackendUnavailableProblem(correlation.correlationId),
    );
    const response = NextResponse.json(problem, { status: problem.status });
    if (problem.status === 401 || problem.status === 409) {
      response.cookies.set(clearRefreshCookie());
    }
    logAuthProxyEvent('warn', 'auth.proxy.refresh.failed', {
      code: problem.code,
      correlationId: problem.correlationId,
      statusCode: problem.status,
    });
    prepareAuthMetric('auth.refresh.failure', { code: problem.code, status: 'failure' });
    return response;
  }
}
