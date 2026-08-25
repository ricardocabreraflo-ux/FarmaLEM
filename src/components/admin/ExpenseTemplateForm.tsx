"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createExpenseTemplateForm, type ExpenseTemplateFormState } from "@/app/admin/finanzas/gastos/actions";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

export function ExpenseTemplateForm() {
  const [state, formAction, pending] = useActionState<ExpenseTemplateFormState | undefined, FormData>(createExpenseTemplateForm, undefined);

  return (
    <form action={formAction} className="mt-6 flex max-w-[440px] flex-col gap-4">
      <label className="block text-[0.85rem] font-semibold text-admin-ink">
        Nombre
        <input name="name" required placeholder="Ej. Renta del local" className={inputClass} />
      </label>
      <label className="block text-[0.85rem] font-semibold text-admin-ink">
        Tipo
        <select name="type" className={inputClass}>
          <option>Gasto fijo</option>
          <option>Gasto variable</option>
        </select>
      </label>
      <label className="block text-[0.85rem] font-semibold text-admin-ink">
        Categoría
        <input name="category" required placeholder="Ej. Renta" className={inputClass} />
      </label>
      <label className="block text-[0.85rem] font-semibold text-admin-ink">
        Monto estimado
        <input name="amount" type="number" min="0" step="0.01" required className={inputClass} />
      </label>

      <p className="rounded-lg bg-admin-primary-soft px-4 py-3 text-[0.82rem] text-admin-primary-deep">
        Este monto es solo la referencia mensual — cada mes lo registras con un toque desde la lista, y puedes ajustarlo si cambió.
      </p>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Link href="/admin/finanzas/gastos" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.86rem] font-semibold text-admin-ink-soft">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-admin-primary px-6 py-2.5 text-[0.86rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
