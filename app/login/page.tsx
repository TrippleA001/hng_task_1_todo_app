import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-[420px] rounded-[20px] bg-card p-8 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.5)]">
        <h1 className="text-2xl font-bold text-ink">Tasks</h1>
        <p className="mt-1.5 text-sm text-muted">
          Sign in, or create an account to get the demo workspace.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
