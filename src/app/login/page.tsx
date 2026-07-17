import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col bg-white">
      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <p className="font-mono text-sm tracking-[0.2em] text-accent uppercase">
          Finance Tracker
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Sign in
        </h1>
        <p className="mt-2 text-muted">Personal access only.</p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
