"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmScheduledAttendance } from "@/app/admin/asistencia/actions";
import type { ShiftAssignment } from "@/lib/shift-schedule";
import type { AttendanceRow, AttendanceStatus } from "@/lib/attendance";
import type { Profile } from "@/lib/profiles";

const STATUSES: AttendanceStatus[] = ["Asistió", "Cubrió turno", "Falta", "Descanso"];

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export function ScheduledShiftsList({
  workDate,
  assignments,
  employees,
  existing,
}: {
  workDate: string;
  assignments: ShiftAssignment[];
  employees: Profile[];
  existing: AttendanceRow[];
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const employeeById = new Map(employees.map((e) => [e.id, e]));
  const covered = assignments.filter((a): a is ShiftAssignment & { employee_id: string } => a.employee_id !== null);
  const vacantCount = assignments.length - covered.length;

  if (assignments.length === 0) {
    return <p className="rounded-lg bg-admin-bg px-4 py-3 text-[0.85rem] text-admin-ink-soft">No hay turnos programados para este día en el calendario.</p>;
  }

  async function confirm(assignment: ShiftAssignment & { employee_id: string }, status: AttendanceStatus) {
    const key = `${assignment.shift}-${status}`;
    setPendingKey(key);
    const employee = employeeById.get(assignment.employee_id);
    const paid = status === "Asistió" || status === "Cubrió turno";
    const rate = paid ? (employee?.daily_rate ?? 0) * (assignment.is_double_shift ? 2 : 1) : 0;
    try {
      await confirmScheduledAttendance(workDate, assignment.employee_id, assignment.shift, status, rate);
      router.refresh();
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {vacantCount > 0 && (
        <p className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] font-semibold text-admin-bad-text">
          {vacantCount === 1 ? "Hay un turno vacante" : `Hay ${vacantCount} turnos vacantes`} este día — asígnalo en el Calendario de turnos.
        </p>
      )}
      {covered.map((assignment) => {
        const employee = employeeById.get(assignment.employee_id);
        const confirmed = existing.find((a) => a.employee_id === assignment.employee_id && a.shift === assignment.shift);
        return (
          <div key={assignment.id} className="rounded-2xl border border-admin-border bg-admin-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-bold text-admin-ink">
                  {employee?.full_name ?? "—"} <span className="font-normal text-admin-ink-soft">· {assignment.shift}</span>
                </p>
                {assignment.is_double_shift && (
                  <span className="mt-0.5 inline-block rounded-full bg-admin-bad-bg px-2.5 py-0.5 text-[0.72rem] font-bold text-admin-bad-text">
                    Turno doble · {fmtMoney((employee?.daily_rate ?? 0) * 2)}
                  </span>
                )}
              </div>
              {confirmed && (
                <span className="rounded-full bg-admin-ok-bg px-3 py-1 text-[0.78rem] font-semibold text-admin-ok-text">Ya registrado: {confirmed.status}</span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {STATUSES.map((status) => {
                const key = `${assignment.shift}-${status}`;
                const isConfirmedAsThis = confirmed?.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={pendingKey !== null}
                    onClick={() => confirm(assignment, status)}
                    className={`rounded-full border px-3.5 py-1.5 text-[0.8rem] font-semibold transition-colors disabled:opacity-60 ${
                      isConfirmedAsThis
                        ? "border-admin-primary bg-admin-primary-soft text-admin-primary-deep"
                        : "border-admin-border text-admin-ink-soft hover:bg-admin-bg"
                    }`}
                  >
                    {pendingKey === key ? "Guardando…" : status}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
