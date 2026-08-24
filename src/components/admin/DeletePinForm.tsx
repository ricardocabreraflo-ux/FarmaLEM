"use client";

import { useActionState } from "react";
import { saveDeletePinForm, type DeletePinFormState } from "@/app/admin/configuracion/actions";

const inputClass =
  "mt-1.5 w-full max-w-[160px] rounded-lg border border-admin-border bg-admin-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

export function DeletePinForm({ hasPin }: { hasPin: boolean }) {
  const [state, formAction, pending] = useActionState<DeletePinFormState | undefined, FormData>(saveDeletePinForm, undefined);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <label className="block text-[0.85rem] font-semibold text-admin-ink">
        {hasPin ? "Nuevo PIN (4 a 6 dígitos)" : "PIN (4 a 6 dígitos)"}
        <input name="pin" type="password" inputMode="numeric" pattern="\d{4,6}" required className={inputClass} />
      </label>
      <label className="block text-[0.85rem] font-semibold text-admin-ink">
        Confirmar PIN
        <input name="confirmPin" type="password" inputMode="numeric" pattern="\d{4,6}" required className={inputClass} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
      {state?.saved && <span className="text-[0.82rem] font-semibold text-admin-ok-text">Guardado</span>}
      {state?.error && <span className="text-[0.82rem] font-semibold text-admin-bad-text">{state.error}</span>}
    </form>
  );
}
