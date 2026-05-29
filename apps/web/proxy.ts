import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { AUTH_REFRESH_COOKIE_NAME } from './src/features/auth/auth-constants';

const PROTECTED_PATH_PREFIXES = ['/dashboard'];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasRefreshCookie = Boolean(request.cookies.get(AUTH_REFRESH_COOKIE_NAME)?.value);
  const isProtectedPath = PROTECTED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtectedPath && !hasRefreshCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/login' && hasRefreshCookie) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/dashboard/:path*'],
};
