import { LoginForm } from '../../src/features/auth/login-form';

type LoginPageProps = {
  searchParams?: Promise<{
    redirectTo?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-6 py-12 sm:px-8">
      <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
            Authentication
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Sign in to the protected workspace.
          </h1>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            This flow is connected to the backend JWT authentication service, keeps refresh state
            compatible with secure HttpOnly cookies, centralizes access-token handling in memory,
            and prepares the client for silent refresh orchestration and future RBAC checks.
          </p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">Current backend placeholder credentials</p>
            <p className="mt-2">Identifier: demo@example.com</p>
            <p>Password: Password123!</p>
          </div>
        </section>

        <LoginForm redirectTo={resolvedSearchParams?.redirectTo} />
      </div>
    </main>
  );
}
