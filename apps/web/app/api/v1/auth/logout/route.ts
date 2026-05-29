import { NextResponse } from 'next/server';
import { AUTH_REFRESH_COOKIE_NAME } from '../../../../../src/features/auth/auth-constants';
import {
  clearRefreshCookie,
  createLogoutResponse,
  getProblemDetails,
} from '../../../../../src/features/auth/server/mock-auth-server';

function extractAccessToken(headerValue: string | null): string | undefined {
  if (!headerValue?.startsWith('Bearer ')) {
    return undefined;
  }

  return headerValue.slice('Bearer '.length);
}

export async function POST(request: Request) {
  try {
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
    const response = NextResponse.json(
      createLogoutResponse(
        extractAccessToken(request.headers.get('authorization')),
        requestCookies.get(AUTH_REFRESH_COOKIE_NAME),
      ),
      { status: 200 },
    );
    response.cookies.set(clearRefreshCookie());
    return response;
  } catch (error) {
    const problem = getProblemDetails(error);
    const response = NextResponse.json(problem, { status: problem.status });
    response.cookies.set(clearRefreshCookie());
    return response;
  }
}
