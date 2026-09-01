"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { saveShiftAssignment, saveWeekLabel } from "@/app/admin/asistencia/calendario/actions";
import type { CalendarWeek } from "@/lib/calendar-weeks";
import type { ShiftAssignment } from "@/lib/shift-schedule";
import type { Profile } from "@/lib/profiles";

const SHIFTS: Array<"Matutino" | "Vespertino"> = ["Matutino", "Vespertino"];
const WEEKDAY_LABELS = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"];
const WEEK_LABEL_OPTIONS = ["S-1", "S-2", "S-3", "S-4", "S-5", "S-6"];

function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0]?.toUpperCase() ?? fullName;
}

interface EditingCell {
  date: string;
  shift: "Matutino" | "Vespertino";
}

export function ShiftScheduleGrid({
  weeks,
  assignments,
  employees,
  weekLabels = {},
}: {
  weeks: CalendarWeek[];
  assignments: ShiftAssignment[];
  employees: Profile[];
  weekLabels?: Record<string, string>;
}) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  const byKey = new Map<string, ShiftAssignment>();
  for (const a of assignments) byKey.set(`${a.work_date}-${a.shift}`, a);
  const nameById = new Map(employees.map((e) => [e.id, e.full_name]));

  return (
    <div className="overflow-x-auto rounded-2xl border border-admin-border bg-admin-surface">
      <table className="w-full min-w-[760px] border-collapse text-[0.8rem] print:min-w-0 print:text-[0.62rem]">
        <thead>
          <tr className="border-b border-admin-border bg-admin-bg text-admin-ink-soft">
            <th className="w-10 px-2 py-2 text-left font-medium print:py-0.5"></th>
            {WEEKDAY_LABELS.map((label) => (
              <th key={label} className="px-2 py-2 text-left font-medium print:py-0.5">
                {label}
              </th>
            ))}
            <th className="w-14 px-2 py-2 text-left font-medium print:hidden"></th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <Fragment key={week.label}>
              {SHIFTS.map((shift, shiftIdx) => (
                <tr key={`${week.label}-${shift}`} className={`border-b border-admin-border ${shiftIdx === 0 ? "border-t-2 border-t-admin-border" : ""}`}>
                  {shiftIdx === 0 && (
                    <td rowSpan={2} className="border-r border-admin-border px-2 py-2 align-top text-[0.72rem] font-bold text-admin-ink-soft print:py-0.5 print:text-[0.6rem]">
                      {week.days[0].dayNum}
                    </td>
                  )}
                  {week.days.map((day) => {
                    const assignment = byKey.get(`${day.date}-${shift}`);
                    const name = assignment?.employee_id ? nameById.get(assignment.employee_id) : null;
                    const isVacant = assignment !== undefined && !assignment.employee_id;
                    return (
                      <td key={day.date} className={`px-1.5 py-1.5 align-top print:px-0.5 print:py-0.5 ${day.inMonth ? "" : "opacity-40"}`}>
                        <button
                          type="button"
                          onClick={() => setEditingCell({ date: day.date, shift })}
                          className={`flex w-full flex-col items-start rounded-lg px-2 py-1.5 text-left leading-tight transition-colors print:px-1 print:py-0.5 print:leading-none ${
                            name ? "bg-admin-primary-soft text-admin-primary-deep" : isVacant ? "bg-admin-bad-bg text-admin-bad-text" : "text-admin-ink-soft hover:bg-admin-bg"
                          }`}
                        >
                          <span className="text-[0.68rem] font-semibold opacity-70 print:text-[0.52rem]">{shift === "Matutino" ? "M" : "V"}</span>
                          <span className="font-bold">{name ? firstName(name) : isVacant ? "VACANTE" : "—"}</span>
                          {assignment?.is_double_shift && <span className="text-[0.65rem] font-bold text-admin-bad-text print:text-[0.5rem]">DOBLE</span>}
                        </button>
                      </td>
                    );
                  })}
                  {shiftIdx === 0 && (
                    <td rowSpan={2} className="border-l border-admin-border px-1.5 py-2 align-middle print:hidden">
                      <WeekLabelSelect weekStart={week.days[0].date} value={weekLabels[week.days[0].date] ?? ""} />
                    </td>
                  )}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>

      {editingCell && (
        <ShiftCellModal
          date={editingCell.date}
          shift={editingCell.shift}
          employees={employees}
          current={byKey.get(`${editingCell.date}-${editingCell.shift}`) ?? null}
          onClose={() => setEditingCell(null)}
        />
      )}
    </div>
  );
}

function WeekLabelSelect({ weekStart, value }: { weekStart: string; value: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleChange(next: string) {
    setSaving(true);
    try {
      await saveWeekLabel(weekStart, next);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      value={value}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value)}
      className="w-14 rounded-lg border border-admin-border bg-admin-bg px-1.5 py-1 text-[0.75rem] font-bold text-admin-primary-deep outline-none focus-visible:outline-2 focus-visible:outline-admin-primary disabled:opacity-60"
    >
      <option value=""></option>
      {WEEK_LABEL_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

function ShiftCellModal({
  date,
  shift,
  employees,
  current,
  onClose,
}: {
  date: string;
  shift: "Matutino" | "Vespertino";
  employees: Profile[];
  current: ShiftAssignment | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState(current?.employee_id ?? "");
  const [isDouble, setIsDouble] = useState(current?.is_double_shift ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "2-digit", month: "long" });

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await saveShiftAssignment(date, shift, employeeId, isDouble);
      router.refresh();
      onClose();
    } catch {
      setError("No se pudo guardar la asignación.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="w-full max-w-[420px] rounded-2xl bg-admin-surface p-5 shadow-lg">
        <h2 className="font-display text-lg text-admin-ink capitalize">{dateLabel}</h2>
        <p className="mt-0.5 text-[0.85rem] text-admin-ink-soft">Turno {shift}</p>

        <label className="mt-4 block text-[0.85rem] font-semibold text-admin-ink">
          Empleado
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
          >
            <option value="">Vacante</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 flex items-center gap-2.5 text-[0.85rem] font-semibold text-admin-ink">
          <input type="checkbox" checked={isDouble} onChange={(e) => setIsDouble(e.target.checked)} className="h-4 w-4 accent-admin-primary" />
          Turno doble (rota fin de semana, paga 2x la tarifa diaria)
        </label>

        {error && <p className="mt-3 text-[0.82rem] font-semibold text-admin-bad-text">{error}</p>}

        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink-soft">
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
