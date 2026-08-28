"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { saveBonusWeekForm, computeWeekAction, type BonusFormState } from "@/app/admin/bonos/actions";
import type { BonusWeek } from "@/lib/bonuses";
import type { Profile } from "@/lib/profiles";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

export function BonusWeekForm({ month, employees, week }: { month: string; employees: Profile[]; week?: BonusWeek }) {
  const [state, formAction, pending] = useActionState<BonusFormState | undefined, FormData>(saveBonusWeekForm, undefined);
  const [employeeId, setEmployeeId] = useState(week?.employee_id ?? employees[0]?.id ?? "");
  const [startDate, setStartDate] = useState(week?.start_date ?? "");
  const [endDate, setEndDate] = useState(week?.end_date ?? "");
  const [sales, setSales] = useState(week?.sales ?? 0);
  const [absent, setAbsent] = useState(week?.absent ?? false);
  const [computing, startCompute] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const shift = employees.find((e) => e.id === employeeId)?.shift ?? "";

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      {week && <input type="hidden" name="id" value={week.id} />}
      <input type="hidden" name="month" value={month} />
      <input type="hidden" name="shift" value={shift} />
      <input type="hidden" name="sales" value={sales} />
      <input type="hidden" name="absent" value={String(absent)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Semana
          <select name="week" defaultValue={week?.week ?? 1} className={inputClass}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                Semana {n}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink sm:col-span-2">
          Empleado
          <select name="employeeId" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className={inputClass}>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name} &middot; {e.shift}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Inicio de semana
          <input name="startDate" type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Fin de semana
          <input name="endDate" type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink sm:col-span-2">
          Ventas de la semana
          <input
            type="number"
            min="0"
            step="0.01"
            value={sales}
            onChange={(e) => setSales(Number(e.target.value))}
            className={inputClass}
          />
        </label>
      </div>

      <p className="rounded-lg bg-admin-primary-soft px-4 py-3 text-[0.85rem] text-admin-primary-deep">
        {message ?? "Calcula desde los cortes o captura la venta semanal a mano."}
      </p>

      <div>
        <button
          type="button"
          disabled={computing || !startDate || !endDate}
          onClick={() => {
            startCompute(async () => {
              const result = await computeWeekAction(employeeId, startDate, endDate);
              setSales(result.sales);
              setAbsent(result.absent);
              setMessage(
                result.absent
                  ? `Ventas $${result.sales.toFixed(2)} · Falta registrada: bono semanal $0.`
                  : `Ventas $${result.sales.toFixed(2)} calculadas desde los cortes aprobados.`
              );
            });
          }}
          className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink disabled:opacity-60"
        >
          {computing ? "Calculando…" : "Calcular desde registros"}
        </button>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Link href={`/admin/bonos?mes=${month}`} className="rounded-full border border-admin-border px-5 py-2.5 text-[0.86rem] font-semibold text-admin-ink-soft">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-admin-primary px-6 py-2.5 text-[0.86rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar semana"}
        </button>
      </div>
    </form>
  );
}
