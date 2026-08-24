"use client";

import { useState, useTransition } from "react";
import type { Withdrawal } from "@/lib/withdrawals";
import { authorizeWithdrawalAction } from "@/app/admin/salidas/actions";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export function WithdrawalsList({ withdrawals, isAdmin, employeeNameById = {} }: { withdrawals: Withdrawal[]; isAdmin: boolean; employeeNameById?: Record<string, string> }) {
  if (withdrawals.length === 0) {
    return <p className="rounded-2xl border border-admin-border bg-admin-surface p-8 text-center text-admin-ink-soft">Sin salidas registradas.</p>;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[0.86rem]">
          <thead>
            <tr className="border-b border-admin-border text-admin-ink-soft">
              <th className="px-5 py-3 font-medium">Fecha</th>
              <th className="px-5 py-3 font-medium">Turno</th>
              <th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Empleada</th>
              <th className="px-5 py-3 font-medium">Concepto</th>
              <th className="px-5 py-3 font-medium">Factura</th>
              <th className="px-5 py-3 text-right font-medium">Cantidad</th>
              <th className="px-5 py-3 font-medium">Autorización</th>
              {isAdmin && <th className="px-5 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w) => (
              <Row key={w.id} w={w} isAdmin={isAdmin} employeeName={w.employee_id ? (employeeNameById[w.employee_id] ?? "—") : "—"} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Row({ w, isAdmin, employeeName }: { w: Withdrawal; isAdmin: boolean; employeeName: string }) {
  const [pending, startTransition] = useTransition();
  const [authorized, setAuthorized] = useState(Boolean(w.authorized_by));

  return (
    <tr className="border-b border-admin-border last:border-0">
      <td className="px-5 py-3 text-admin-ink-soft">{fmtDate(w.withdrawal_date)}</td>
      <td className="px-5 py-3 text-admin-ink-soft">{w.shift}</td>
      <td className="px-5 py-3 text-admin-ink-soft">{w.type}</td>
      <td className="px-5 py-3 text-admin-ink-soft">{employeeName}</td>
      <td className="px-5 py-3 text-admin-ink">{w.concept}</td>
      <td className="px-5 py-3 text-admin-ink-soft">{w.invoice || "—"}</td>
      <td className="px-5 py-3 text-right font-data tabular-nums text-admin-ink">{fmtMoney(w.amount)}</td>
      <td className="px-5 py-3">
        <span className={`rounded-full px-2.5 py-1 text-[0.76rem] font-semibold ${authorized ? "bg-admin-ok-bg text-admin-ok-text" : "bg-admin-pending-bg text-admin-pending-text"}`}>
          {authorized ? "Autorizada" : "Pendiente"}
        </span>
      </td>
      {isAdmin && (
        <td className="px-5 py-3 text-right">
          {!authorized && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setAuthorized(true);
                startTransition(async () => {
                  await authorizeWithdrawalAction(w.id);
                });
              }}
              className="rounded-full border border-admin-border px-3.5 py-1.5 text-[0.8rem] font-semibold text-admin-ink disabled:opacity-60"
            >
              Autorizar
            </button>
          )}
        </td>
      )}
    </tr>
  );
}
