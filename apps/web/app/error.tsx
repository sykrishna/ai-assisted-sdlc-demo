'use client';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-12">
          <div className="w-full rounded-2xl border border-rose-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-rose-700">
              Application error
            </p>
            <h1 className="mt-3 text-2xl font-semibold text-slate-950">
              Something unexpected interrupted the flow.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              The app is prepared for dedicated route-level error boundaries. Retry the last
              transition, or return to the login page if the issue persists.
            </p>
            <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              {error.digest ?? error.message}
            </p>
            <button
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              onClick={reset}
              type="button"
            >
              Retry
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
