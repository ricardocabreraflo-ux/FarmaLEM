"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createCutForm, type CutFormState } from "@/app/admin/cortes/actions";
import type { Profile } from "@/lib/profiles";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

export function CutForm({
  employees,
  defaultShift,
  canChooseShift,
}: {
  employees: Profile[];
  defaultShift: string;
  canChooseShift: boolean;
}) {
  const [state, formAction, pending] = useActionState<CutFormState | undefined, FormData>(createCutForm, undefined);
  const [total, setTotal] = useState("");
  const [card, setCard] = useState("");
  const [cashDelivered, setCashDelivered] = useState("");

  const totalNum = Number(total || 0);
  const cardNum = Number(card || 0);
  const cash = Math.max(totalNum - cardNum, 0);
  const cardExceedsTotal = cardNum > totalNum;

  const cashDeliveredNum = Number(cashDelivered || 0);
  const hasDeliveredValue = cashDelivered !== "";
  const deliveredDiff = cashDeliveredNum - cash;
  const deliveredMatches = Math.abs(deliveredDiff) < 0.005;

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Fecha
          <input name="cutDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
        </label>

        {employees.length > 0 && (
          <label className="block text-[0.85rem] font-semibold text-admin-ink">
            Empleado
            <select name="employeeId" className={inputClass}>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Turno
          {canChooseShift ? (
            <select name="shift" defaultValue={defaultShift} className={inputClass}>
              <option>Matutino</option>
              <option>Vespertino</option>
            </select>
          ) : (
            <>
              <input type="hidden" name="shift" value={defaultShift} />
              <div className={`${inputClass} bg-admin-primary-soft font-semibold text-admin-primary-deep`}>{defaultShift} (tu turno)</div>
            </>
          )}
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
          <input name="cash" type="number" readOnly value={cash.toFixed(2)} className={`${inputClass} bg-admin-bg/60 text-admin-ink-soft`} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Efectivo entregado <span className="font-normal text-admin-ink-soft">(cuenta física)</span>
          <input
            name="cashDelivered"
            type="number"
            min="0"
            step="0.01"
            required
            value={cashDelivered}
            onChange={(e) => setCashDelivered(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink sm:col-span-2">
          Foto del corte (opcional)
          <input name="photo" type="file" accept="image/*" className={`${inputClass} py-2`} />
        </label>
      </div>

      <p
        className={`rounded-lg px-4 py-3 text-[0.85rem] ${
          cardExceedsTotal || (hasDeliveredValue && !deliveredMatches) ? "bg-admin-bad-bg text-admin-bad-text" : "bg-admin-primary-soft text-admin-primary-deep"
        }`}
      >
        {cardExceedsTotal
          ? "La tarjeta/transferencia no puede ser mayor a la venta total."
          : !hasDeliveredValue
            ? "Captura el efectivo entregado para comprobar el corte."
            : deliveredMatches
              ? "✓ El efectivo entregado coincide con lo esperado."
              : deliveredDiff < 0
                ? `Faltan ${Math.abs(deliveredDiff).toFixed(2)} en el efectivo entregado.`
                : `Sobran ${deliveredDiff.toFixed(2)} en el efectivo entregado.`}
      </p>

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
          {pending ? "Guardando…" : "Guardar corte"}
        </button>
      </div>
    </form>
  );
}
