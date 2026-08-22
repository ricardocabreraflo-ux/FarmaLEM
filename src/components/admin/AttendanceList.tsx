"use client";

import { useState, useTransition } from "react";
import type { AttendanceRow } from "@/lib/attendance";
import { deleteAttendanceAction } from "@/app/admin/asistencia/actions";

const PAID = new Set(["Asistió", "Cubrió turno"]);

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

interface Row extends AttendanceRow {
  employeeName: string;
}

export function AttendanceList({ rows }: { rows: Row[] }) {
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
              <th className="px-5 py-3 text-right font-medium">Pago del turno</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <AttendanceItem key={row.id} row={row} onRemoved={() => setItems((prev) => prev.filter((r) => r.id !== row.id))} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function AttendanceItem({ row, onRemoved }: { row: Row; onRemoved: () => void }) {
  const [pending, startTransition] = useTransition();
  const paid = PAID.has(row.status);

  return (
    <tr className="border-b border-admin-border last:border-0">
      <td className="px-5 py-3 text-admin-ink-soft">{fmtDate(row.work_date)}</td>
      <td className="px-5 py-3 font-semibold text-admin-ink">{row.employeeName}</td>
      <td className="px-5 py-3 text-admin-ink-soft">{row.shift}</td>
      <td className="px-5 py-3">
        <span className={`rounded-full px-2.5 py-1 text-[0.76rem] font-semibold ${paid ? "bg-admin-ok-bg text-admin-ok-text" : row.status === "Falta" ? "bg-admin-bad-bg text-admin-bad-text" : "bg-admin-pending-bg text-admin-pending-text"}`}>
          {row.status}
        </span>
      </td>
      <td className="px-5 py-3 text-right font-data tabular-nums text-admin-ink">{paid ? fmtMoney(row.rate) : "—"}</td>
      <td className="px-5 py-3 text-right">
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
      </td>
    </tr>
  );
}
