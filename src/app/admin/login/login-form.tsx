"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <div>
        <label htmlFor="username" className="text-[0.85rem] font-semibold text-admin-ink">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          autoFocus
          className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-[0.85rem] font-semibold text-admin-ink">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary"
        />
      </div>
      {state?.error && (
        <p role="alert" className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-full bg-admin-primary py-3 font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
