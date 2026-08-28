"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createFinanceMovementForm, type FinanceMovementFormState } from "@/app/admin/finanzas/actions";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

export function FinanceMovementForm({ month }: { month: string }) {
  const [state, formAction, pending] = useActionState<FinanceMovementFormState | undefined, FormData>(createFinanceMovementForm, undefined);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Fecha
          <input name="movementDate" type="date" required defaultValue={`${month}-01`} className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Tipo
          <select name="type" className={inputClass}>
            <option>Ingreso</option>
            <option>Costo de venta</option>
            <option>Gasto fijo</option>
            <option>Gasto variable</option>
            <option>Merma</option>
          </select>
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink sm:col-span-2">
          Categoría
          <input name="category" required placeholder="Ej. Compra de medicamentos" className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink sm:col-span-2">
          Concepto
          <input name="concept" required className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Cantidad
          <input name="amount" type="number" min="0" step="0.01" required className={inputClass} />
        </label>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Link href={`/admin/finanzas?mes=${month}`} className="rounded-full border border-admin-border px-5 py-2.5 text-[0.86rem] font-semibold text-admin-ink-soft">
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
