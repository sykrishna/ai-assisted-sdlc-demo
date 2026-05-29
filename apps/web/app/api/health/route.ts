import { NextResponse } from 'next/server';
import {
  createBackendUnavailableProblem,
  extractCorrelationHeaders,
  parseBackendProblem,
  proxyAuthRequest,
} from '../../../src/features/auth/server/backend-auth-proxy';
import type { HealthStatusResponse } from '../../../src/features/auth/auth-types';

export async function GET(request: Request) {
  const correlation = extractCorrelationHeaders(request);

  try {
    const result = await proxyAuthRequest<HealthStatusResponse>({
      correlation,
      endpoint: '/api/v1/health',
      method: 'GET',
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    const problem = parseBackendProblem(
      error,
      createBackendUnavailableProblem(correlation.correlationId),
    );
    return NextResponse.json(problem, { status: problem.status });
  }
}
