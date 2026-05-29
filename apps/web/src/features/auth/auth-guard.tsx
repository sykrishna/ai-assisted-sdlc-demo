'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { useAuth } from './auth-context';

const loginRoute = '/login' as Route;

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { error, status } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(loginRoute);
    }
  }, [router, status]);

  if (status === 'loading') {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-12">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
          Restoring secure session...
        </div>
      </main>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-12">
        <div className="rounded-2xl border border-amber-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
          {error ?? 'Redirecting to sign-in...'}
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
