"use client";

import { useState, useTransition } from "react";
import { togglePayrollAction } from "@/app/admin/sueldos/actions";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export interface PayrollRow {
  employeeId: string;
  name: string;
  daysWorked: number;
  misses: number;
  salary: number;
  bonus: number;
  total: number;
  paid: boolean;
}

export function PayrollList({ rows, month }: { rows: PayrollRow[]; month: string }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[0.86rem]">
          <thead>
            <tr className="border-b border-admin-border text-admin-ink-soft">
              <th className="px-5 py-3 font-medium">Empleado</th>
              <th className="px-5 py-3 text-right font-medium">Turnos pagados</th>
              <th className="px-5 py-3 text-right font-medium">Faltas</th>
              <th className="px-5 py-3 text-right font-medium">Sueldo</th>
              <th className="px-5 py-3 text-right font-medium">Bonos</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <PayrollRowItem key={row.employeeId} row={row} month={month} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PayrollRowItem({ row, month }: { row: PayrollRow; month: string }) {
  const [pending, startTransition] = useTransition();
  const [paid, setPaid] = useState(row.paid);

  return (
    <tr className="border-b border-admin-border last:border-0">
      <td className="px-5 py-3 font-semibold text-admin-ink">{row.name}</td>
      <td className="px-5 py-3 text-right text-admin-ink-soft">{row.daysWorked}</td>
      <td className="px-5 py-3 text-right text-admin-ink-soft">{row.misses}</td>
      <td className="px-5 py-3 text-right font-data tabular-nums text-admin-ink">{fmtMoney(row.salary)}</td>
      <td className="px-5 py-3 text-right font-data tabular-nums text-admin-ink">{fmtMoney(row.bonus)}</td>
      <td className="px-5 py-3 text-right font-data tabular-nums font-bold text-admin-ink">{fmtMoney(row.total)}</td>
      <td className="px-5 py-3">
        <span className={`rounded-full px-2.5 py-1 text-[0.76rem] font-semibold ${paid ? "bg-admin-ok-bg text-admin-ok-text" : "bg-admin-pending-bg text-admin-pending-text"}`}>
          {paid ? "Pagado" : "Pendiente"}
        </span>
      </td>
      <td className="px-5 py-3 text-right">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setPaid((p) => !p);
            startTransition(async () => {
              await togglePayrollAction(row.employeeId, month, paid);
            });
          }}
          className="font-semibold text-admin-primary hover:underline disabled:opacity-60"
        >
          {paid ? "Reabrir" : "Marcar pagado"}
        </button>
      </td>
    </tr>
  );
}
