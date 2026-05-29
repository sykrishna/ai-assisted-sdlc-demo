import { NextResponse } from 'next/server';
import type { LoginResponse } from '../../../../../src/features/auth/auth-types';
import {
  buildRefreshCookie,
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
      identifier?: string;
      password?: string;
    };

    logAuthProxyEvent('info', 'auth.proxy.login.started', {
      correlationId: correlation.correlationId,
      hasIdentifier: Boolean(body.identifier),
    });

    const result = await proxyAuthRequest<LoginResponse>({
      body,
      correlation,
      endpoint: '/api/v1/auth/login',
      method: 'POST',
    });

    const response = NextResponse.json(sanitizeTokenResponse(result.body), { status: 200 });
    response.cookies.set(
      buildRefreshCookie(result.body.refreshToken, result.body.session.expiresAt),
    );

    logAuthProxyEvent('info', 'auth.proxy.login.completed', {
      correlationId: result.correlationId,
      sessionId: result.body.session.sessionId,
      statusCode: result.status,
    });
    prepareAuthMetric('auth.login.success', { status: 'success' });

    return response;
  } catch (error) {
    const problem = parseBackendProblem(
      error,
      createBackendUnavailableProblem(correlation.correlationId),
    );
    logAuthProxyEvent('warn', 'auth.proxy.login.failed', {
      code: problem.code,
      correlationId: problem.correlationId,
      statusCode: problem.status,
    });
    prepareAuthMetric('auth.login.failure', { code: problem.code, status: 'failure' });
    return NextResponse.json(problem, { status: problem.status });
  }
}
