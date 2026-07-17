import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_20%,#c8e8db_0%,transparent_50%),linear-gradient(165deg,#f3f6f4_0%,#e7efe9_55%,#dce8e1_100%)]"
      />
      <main className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
        <p className="font-mono text-sm tracking-[0.2em] text-accent uppercase">
          Finance Tracker
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground">
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
