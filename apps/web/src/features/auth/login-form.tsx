'use client';

import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useAuth } from './auth-context';

type LoginFormProps = {
  redirectTo?: string;
};

export function LoginForm({ redirectTo }: LoginFormProps) {
  const router = useRouter();
  const { error, login, status } = useAuth();
  const [identifier, setIdentifier] = useState('demo@example.com');
  const [password, setPassword] = useState('Password123!');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destination = (
    redirectTo && redirectTo.startsWith('/') ? redirectTo : '/dashboard'
  ) as Route;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      await login({
        deviceContext: {
          userAgent: navigator.userAgent,
        },
        identifier,
        password,
      });

      router.replace(destination);
    } catch {
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
  };

  const disabled = isSubmitting || status === 'loading';

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-950">Sign in</h2>
        <p className="text-sm text-slate-600">
          Access tokens remain in memory only. Refresh continuity is prepared for HttpOnly cookie
          transport.
        </p>
      </div>

      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="identifier">
            Email or username
          </label>
          <input
            autoComplete="username"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
            id="identifier"
            name="identifier"
            onChange={(event) => setIdentifier(event.target.value)}
            required
            type="text"
            value={identifier}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700" htmlFor="password">
            Password
          </label>
          <input
            autoComplete="current-password"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400"
            id="password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>

        {error ? (
          <p
            aria-live="polite"
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
          >
            {error}
          </p>
        ) : null}

        <button
          className="inline-flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={disabled}
          type="submit"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}
