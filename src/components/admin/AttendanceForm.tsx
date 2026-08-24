"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { upsertAttendanceForm, type AttendanceFormState } from "@/app/admin/asistencia/actions";
import type { Profile } from "@/lib/profiles";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

const DEFAULT_RATE = 242.86;

export function AttendanceForm({ employees, month }: { employees: Profile[]; month: string }) {
  const [state, formAction, pending] = useActionState<AttendanceFormState | undefined, FormData>(upsertAttendanceForm, undefined);
  const rateByEmployee = Object.fromEntries(employees.map((e) => [e.id, (e.daily_rate ?? DEFAULT_RATE).toFixed(2)]));
  const [rate, setRate] = useState(employees[0] ? rateByEmployee[employees[0].id] : DEFAULT_RATE.toFixed(2));

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="month" value={month} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Fecha
          <input name="workDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Empleado
          <select
            name="employeeId"
            className={inputClass}
            onChange={(e) => setRate(rateByEmployee[e.target.value] ?? DEFAULT_RATE.toFixed(2))}
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Turno trabajado
          <select name="shift" className={inputClass}>
            <option>Matutino</option>
            <option>Vespertino</option>
            <option>Fin de semana matutino</option>
            <option>Fin de semana vespertino</option>
          </select>
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Estado
          <select name="status" className={inputClass}>
            <option>Asistió</option>
            <option>Cubrió turno</option>
            <option>Falta</option>
            <option>Descanso</option>
            <option>Cerrado</option>
            <option>Día festivo</option>
          </select>
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink sm:col-span-2">
          Pago por turno
          <input name="rate" type="number" min="0" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink sm:col-span-2">
          Cambio o turno cubierto (opcional)
          <textarea name="note" placeholder="Ej. Cubrió el turno vespertino de Itzel" className={`${inputClass} min-h-[80px]`} />
        </label>
      </div>

      <p className="rounded-lg bg-admin-primary-soft px-4 py-3 text-[0.85rem] text-admin-primary-deep">
        Asistió y Cubrió turno generan sueldo. Falta y Cerrado (cierre no planeado) quitan el bono de esa semana. Descanso y Día festivo (cierre planeado) no
        generan pago pero tampoco quitan el bono.
      </p>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Link href={`/admin/asistencia?mes=${month}`} className="rounded-full border border-admin-border px-5 py-2.5 text-[0.86rem] font-semibold text-admin-ink-soft">
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
