"use client";

import { useActionState } from "react";
import { signIn, type ActionResult } from "@/app/actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    signIn,
    null,
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="h-11 border border-foreground/15 bg-surface px-3 text-foreground outline-none focus:border-accent"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-foreground">Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="h-11 border border-foreground/15 bg-surface px-3 text-foreground outline-none focus:border-accent"
        />
      </label>
      {state && "error" in state ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-11 bg-accent text-sm font-medium text-white transition-colors hover:bg-[#146349] disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
