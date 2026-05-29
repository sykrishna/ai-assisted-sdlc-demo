'use client';

import { useAuth } from '../../../src/features/auth/auth-context';

export default function DashboardPage() {
  const { error, isRefreshing, logout, session, status, user } = useAuth();

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12 sm:px-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Protected workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Authenticated session shell
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-600">
            This route is guarded by centralized auth state, cookie-aware restoration, and
            future-ready role metadata.
          </p>
        </div>

        <button
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
          onClick={() => {
            void logout();
          }}
          type="button"
        >
          Sign out
        </button>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-950">Session summary</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">User</dt>
              <dd className="mt-2 text-sm text-slate-700">{user?.displayName ?? 'Unavailable'}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Session ID
              </dt>
              <dd className="mt-2 break-all text-sm text-slate-700">
                {session?.sessionId ?? 'Unavailable'}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Roles</dt>
              <dd className="mt-2 text-sm text-slate-700">{user?.roles.join(', ') ?? 'None'}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</dt>
              <dd className="mt-2 text-sm capitalize text-slate-700">{status}</dd>
            </div>
          </dl>
        </article>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-950">Operational readiness</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>Session restore runs on load, reconnect, and app resume.</li>
              <li>Refresh scheduling is prepared without persisting refresh tokens client-side.</li>
              <li>Client logging is correlation-aware and avoids sensitive auth payloads.</li>
              <li>Role claims are available for future route- and feature-level checks.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-950">Runtime state</h2>
            <p className="mt-4 text-sm text-slate-600">
              {isRefreshing
                ? 'Refreshing session before access-token expiry.'
                : 'Session is stable and ready for protected API usage.'}
            </p>
            {error ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                {error}
              </p>
            ) : null}
          </section>
        </aside>
      </section>
    </main>
  );
}
