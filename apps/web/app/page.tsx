import type { Route } from 'next';
import Link from 'next/link';

const loginRoute = '/login' as Route;
const dashboardRoute = '/dashboard' as Route;

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-10 px-6 py-16 sm:px-8">
      <section className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
          AI-Assisted SDLC Web
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          Foundational authentication flow for the Next.js PWA shell.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          The frontend is prepared for secure session restoration, protected navigation, centralized
          auth management, and future role-based authorization.
        </p>
      </section>

      <section className="grid gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:grid-cols-[1.2fr_0.8fr] sm:p-8">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold text-slate-900">Current scope</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li>Credential login form with generic auth failures.</li>
            <li>HttpOnly-cookie-compatible session restoration flow.</li>
            <li>Protected dashboard shell with centralized logout.</li>
            <li>Refresh orchestration hooks prepared for backend integration.</li>
          </ul>
        </div>

        <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Get started</h2>
            <p className="text-sm text-slate-600">
              Use the demo login flow to exercise the mock contract-backed session lifecycle.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              href={loginRoute}
            >
              Open login
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-950"
              href={dashboardRoute}
            >
              View protected area
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
