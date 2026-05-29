'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '../src/features/auth/auth-context';
import { FrontendRuntimeHooks } from '../src/lib/observability/frontend-runtime-hooks';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <FrontendRuntimeHooks />
      {children}
    </AuthProvider>
  );
}
