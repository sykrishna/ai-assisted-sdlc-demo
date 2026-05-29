import { NextResponse } from 'next/server';
import { AUTH_REFRESH_COOKIE_NAME } from '../../../../../src/features/auth/auth-constants';
import {
  buildRefreshCookie,
  clearRefreshCookie,
  createRefreshResponse,
  getProblemDetails,
} from '../../../../../src/features/auth/server/mock-auth-server';

export async function POST(request: Request) {
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

    const result = createRefreshResponse(refreshToken, body.sessionId);

    const nextResponse = NextResponse.json(result.response, { status: 200 });
    nextResponse.cookies.set(
      buildRefreshCookie(result.refreshCookie.token, result.refreshCookie.expiresAt),
    );
    return nextResponse;
  } catch (error) {
    const problem = getProblemDetails(error);
    const response = NextResponse.json(problem, { status: problem.status });
    if (problem.status === 401 || problem.status === 409) {
      response.cookies.set(clearRefreshCookie());
    }
    return response;
  }
}
