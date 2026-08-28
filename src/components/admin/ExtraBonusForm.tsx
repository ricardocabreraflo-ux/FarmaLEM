"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveExtraBonusForm, type ExtraBonusFormState } from "@/app/admin/bonos-extra/actions";
import type { ExtraBonus } from "@/lib/extra-bonuses";
import type { Profile } from "@/lib/profiles";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

export function ExtraBonusForm({ employees, bonus }: { employees: Profile[]; bonus?: ExtraBonus }) {
  const [state, formAction, pending] = useActionState<ExtraBonusFormState | undefined, FormData>(saveExtraBonusForm, undefined);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      {bonus && <input type="hidden" name="id" value={bonus.id} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Mes
          <input name="month" type="month" required defaultValue={bonus?.month ?? new Date().toISOString().slice(0, 7)} className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Empleado
          <select name="employeeId" defaultValue={bonus?.employee_id} className={inputClass}>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink sm:col-span-2">
          Concepto
          <select name="concept" defaultValue={bonus?.concept ?? "Puntualidad"} className={inputClass}>
            <option>Puntualidad</option>
            <option>Desempeño</option>
            <option>Meta de ventas</option>
            <option>Otro</option>
          </select>
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Cantidad
          <input name="amount" type="number" min="0" step="0.01" required defaultValue={bonus?.amount} className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Estado
          <select name="status" defaultValue={bonus?.status ?? "Pendiente"} className={inputClass}>
            <option>Pendiente</option>
            <option>Pagado</option>
          </select>
        </label>
      </div>

      <p className="rounded-lg bg-admin-primary-soft px-4 py-3 text-[0.85rem] text-admin-primary-deep">
        Estos bonos son independientes de la pirámide de metas semanales.
      </p>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Link href="/admin/bonos-extra" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.86rem] font-semibold text-admin-ink-soft">
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
