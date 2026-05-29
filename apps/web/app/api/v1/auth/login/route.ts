import { NextResponse } from 'next/server';
import {
  buildRefreshCookie,
  createLoginResponse,
  getProblemDetails,
} from '../../../../../src/features/auth/server/mock-auth-server';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      identifier?: string;
      password?: string;
    };

    const result = createLoginResponse(body.identifier ?? '', body.password ?? '');
    const response = NextResponse.json(result.response, { status: 200 });
    response.cookies.set(
      buildRefreshCookie(result.refreshCookie.token, result.refreshCookie.expiresAt),
    );

    return response;
  } catch (error) {
    const problem = getProblemDetails(error);
    return NextResponse.json(problem, { status: problem.status });
  }
}
