"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { updateCutForm, type CutFormState } from "@/app/admin/cortes/actions";
import type { Cut, CutStatus } from "@/lib/cuts";
import type { Profile } from "@/lib/profiles";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

const STATUSES: CutStatus[] = ["Por revisar", "Aprobado", "Rechazado"];

export function EditCutForm({ cut, employees }: { cut: Cut; employees: Profile[] }) {
  const [state, formAction, pending] = useActionState<CutFormState | undefined, FormData>(updateCutForm, undefined);
  const [total, setTotal] = useState(String(cut.total));
  const [card, setCard] = useState(String(cut.card));

  const totalNum = Number(total || 0);
  const cardNum = Number(card || 0);
  const cash = Math.max(totalNum - cardNum, 0);
  const cardExceedsTotal = cardNum > totalNum;

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="id" value={cut.id} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Fecha
          <input name="cutDate" type="date" required defaultValue={cut.cut_date} className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Empleado
          <select name="employeeId" defaultValue={cut.employee_id} className={inputClass}>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Turno
          <select name="shift" defaultValue={cut.shift} className={inputClass}>
            <option>Matutino</option>
            <option>Vespertino</option>
          </select>
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Estado
          <select name="status" defaultValue={cut.status} className={inputClass}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Venta total
          <input name="total" type="number" min="0" step="0.01" required value={total} onChange={(e) => setTotal(e.target.value)} className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Tarjeta / transferencia
          <input name="card" type="number" min="0" step="0.01" value={card} onChange={(e) => setCard(e.target.value)} className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Efectivo <span className="font-normal text-admin-ink-soft">(venta total − tarjeta)</span>
          <input type="number" readOnly value={cash.toFixed(2)} className={`${inputClass} bg-admin-bg/60 text-admin-ink-soft`} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Efectivo entregado <span className="font-normal text-admin-ink-soft">(cuenta física)</span>
          <input name="cashDelivered" type="number" min="0" step="0.01" required defaultValue={cut.cash_delivered} className={inputClass} />
        </label>
      </div>

      {cardExceedsTotal && (
        <p className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">La tarjeta/transferencia no puede ser mayor a la venta total.</p>
      )}

      {state?.error && (
        <p role="alert" className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Link href="/admin/cortes" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.86rem] font-semibold text-admin-ink-soft">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending || cardExceedsTotal}
          className="rounded-full bg-admin-primary px-6 py-2.5 text-[0.86rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
