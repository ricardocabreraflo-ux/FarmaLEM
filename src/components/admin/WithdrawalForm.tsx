"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createWithdrawalForm, type WithdrawalFormState } from "@/app/admin/salidas/actions";
import { mexicoCityToday } from "@/lib/dates";
import type { Supplier } from "@/lib/suppliers";
import type { Profile } from "@/lib/profiles";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

export function WithdrawalForm({ isAdmin, suppliers, employees }: { isAdmin: boolean; suppliers: Supplier[]; employees: Profile[] }) {
  const [state, formAction, pending] = useActionState<WithdrawalFormState | undefined, FormData>(createWithdrawalForm, undefined);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Fecha
          <input name="withdrawalDate" type="date" required defaultValue={mexicoCityToday()} className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Turno
          <select name="shift" className={inputClass}>
            <option>Matutino</option>
            <option>Vespertino</option>
          </select>
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Tipo
          <select name="type" className={inputClass}>
            <option>Nómina</option>
            <option>Gasto</option>
            <option>Proveedor</option>
            <option>Otro</option>
          </select>
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Cantidad
          <input name="amount" type="number" min="0" step="0.01" required className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink sm:col-span-2">
          Concepto
          <input name="concept" required className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Empleada (opcional, para Nómina)
          <select name="employeeId" defaultValue="" className={inputClass}>
            <option value="">No aplica</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Proveedor (opcional)
          <select name="supplierId" defaultValue="" className={inputClass}>
            <option value="">No aplica</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Factura (opcional)
          <input name="invoice" className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Persona que recibió (opcional)
          <input name="recipient" className={inputClass} />
        </label>
      </div>

      <p className="rounded-lg bg-admin-primary-soft px-4 py-3 text-[0.85rem] text-admin-primary-deep">
        {isAdmin ? "Administración autorizará esta salida al guardarla." : "La salida quedará pendiente de autorización administrativa."}
      </p>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Link href="/admin/salidas" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.86rem] font-semibold text-admin-ink-soft">
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
