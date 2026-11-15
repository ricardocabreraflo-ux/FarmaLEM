"use client";

import { useState, useTransition } from "react";
import type { AttendanceRow } from "@/lib/attendance";
import type { Profile } from "@/lib/profiles";
import { deleteAttendanceAction, reassignAttendanceAction } from "@/app/admin/asistencia/actions";

const PAID = new Set(["Asistió", "Cubrió turno"]);
const DEFAULT_RATE = 242.86;

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

interface Row extends AttendanceRow {
  employeeName: string;
}

export function AttendanceList({ rows, isAdmin = true, employees = [] }: { rows: Row[]; isAdmin?: boolean; employees?: Profile[] }) {
  const [items, setItems] = useState(rows);

  if (items.length === 0) {
    return <p className="rounded-2xl border border-admin-border bg-admin-surface p-8 text-center text-admin-ink-soft">Sin asistencia registrada en este mes.</p>;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[0.86rem]">
          <thead>
            <tr className="border-b border-admin-border text-admin-ink-soft">
              <th className="px-5 py-3 font-medium">Fecha</th>
              <th className="px-5 py-3 font-medium">Empleado</th>
              <th className="px-5 py-3 font-medium">Turno</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              {isAdmin && <th className="px-5 py-3 text-right font-medium">Pago del turno</th>}
              {isAdmin && <th className="px-5 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <AttendanceItem
                key={row.id}
                row={row}
                isAdmin={isAdmin}
                employees={employees}
                onRemoved={() => setItems((prev) => prev.filter((r) => r.id !== row.id))}
                onReassigned={(employeeId, employeeName, rate) =>
                  setItems((prev) => prev.map((r) => (r.id === row.id ? { ...r, employee_id: employeeId, employeeName, rate } : r)))
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AttendanceItem({
  row,
  isAdmin,
  employees,
  onRemoved,
  onReassigned,
}: {
  row: Row;
  isAdmin: boolean;
  employees: Profile[];
  onRemoved: () => void;
  onReassigned: (employeeId: string, employeeName: string, rate: number) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [reassigning, setReassigning] = useState(false);
  const [employeeId, setEmployeeId] = useState(row.employee_id);
  const [error, setError] = useState<string | null>(null);
  const paid = PAID.has(row.status);

  function saveReassign() {
    setError(null);
    const chosen = employees.find((e) => e.id === employeeId);
    const rate = chosen?.daily_rate ?? DEFAULT_RATE;
    startTransition(async () => {
      const result = await reassignAttendanceAction(row.id, employeeId, rate);
      if (result.error) {
        setError(result.error);
        return;
      }
      onReassigned(employeeId, chosen?.full_name ?? row.employeeName, rate);
      setReassigning(false);
    });
  }

  return (
    <tr className="border-b border-admin-border last:border-0">
      <td className="px-5 py-3 text-admin-ink-soft">{fmtDate(row.work_date)}</td>
      <td className="px-5 py-3 font-semibold text-admin-ink">
        {reassigning ? (
          <div className="flex flex-col gap-1.5">
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="rounded-lg border border-admin-border bg-admin-input-bg px-2.5 py-1.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name}
                </option>
              ))}
            </select>
            {error && <span className="text-[0.76rem] font-semibold text-admin-bad-text">{error}</span>}
          </div>
        ) : (
          row.employeeName
        )}
      </td>
      <td className="px-5 py-3 text-admin-ink-soft">{row.shift}</td>
      <td className="px-5 py-3">
        <span className={`rounded-full px-2.5 py-1 text-[0.76rem] font-semibold ${paid ? "bg-admin-ok-bg text-admin-ok-text" : row.status === "Falta" ? "bg-admin-bad-bg text-admin-bad-text" : "bg-admin-pending-bg text-admin-pending-text"}`}>
          {row.status}
        </span>
      </td>
      {isAdmin && <td className="px-5 py-3 text-right font-data tabular-nums text-admin-ink">{paid ? fmtMoney(row.rate) : "—"}</td>}
      {isAdmin && (
        <td className="px-5 py-3 text-right whitespace-nowrap">
          {reassigning ? (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={pending}
                onClick={saveReassign}
                className="font-semibold text-admin-primary disabled:opacity-60"
              >
                {pending ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setReassigning(false);
                  setEmployeeId(row.employee_id);
                  setError(null);
                }}
                className="font-semibold text-admin-ink-soft disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReassigning(true)}
                title="Si ya llegaron a un acuerdo para cambiar el turno entre ellas"
                className="font-semibold text-admin-ink-soft hover:text-admin-primary"
              >
                Cambiar
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  onRemoved();
                  startTransition(async () => {
                    await deleteAttendanceAction(row.id);
                  });
                }}
                className="font-semibold text-admin-ink-soft hover:text-admin-bad-text disabled:opacity-60"
              >
                Quitar
              </button>
            </div>
          )}
        </td>
      )}
    </tr>
  );
}
