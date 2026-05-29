import { NextResponse } from 'next/server';
import type { SessionResponse } from '../../../../../src/features/auth/auth-types';
import {
  createBackendUnavailableProblem,
  extractCorrelationHeaders,
  parseBackendProblem,
  proxyAuthRequest,
  logAuthProxyEvent,
} from '../../../../../src/features/auth/server/backend-auth-proxy';

function extractAccessToken(headerValue: string | null): string | undefined {
  if (!headerValue?.startsWith('Bearer ')) {
    return undefined;
  }

  return headerValue.slice('Bearer '.length);
}

export async function GET(request: Request) {
  const correlation = extractCorrelationHeaders(request);

  try {
    const accessToken = extractAccessToken(request.headers.get('authorization'));

    const result = await proxyAuthRequest<SessionResponse>({
      accessToken,
      correlation,
      endpoint: '/api/v1/auth/session',
      method: 'GET',
    });

    logAuthProxyEvent('info', 'auth.proxy.session.completed', {
      correlationId: result.correlationId,
      sessionId: result.body.session.sessionId,
      statusCode: result.status,
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const problem = parseBackendProblem(
      error,
      createBackendUnavailableProblem(correlation.correlationId),
    );
    logAuthProxyEvent('warn', 'auth.proxy.session.failed', {
      code: problem.code,
      correlationId: problem.correlationId,
      statusCode: problem.status,
    });
    return NextResponse.json(problem, { status: problem.status });
  }
}
