"use client";

import { useState, useTransition } from "react";
import type { Cut } from "@/lib/cuts";
import { isCutDateLocked } from "@/lib/cuts-lock";
import type { Profile } from "@/lib/profiles";
import { approveCutAction } from "@/app/admin/cortes/actions";
import { EditCutModal } from "@/components/admin/EditCutModal";

const STATUS_STYLE: Record<Cut["status"], string> = {
  "Por revisar": "bg-admin-pending-bg text-admin-pending-text",
  Aprobado: "bg-admin-ok-bg text-admin-ok-text",
  Rechazado: "bg-admin-bad-bg text-admin-bad-text",
};

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

interface Row extends Cut {
  employeeName: string;
  photoUrl: string | null;
}

export function CutsList({ cuts, isAdmin, employees }: { cuts: Row[]; isAdmin: boolean; employees: Profile[] }) {
  const [editingCut, setEditingCut] = useState<Row | null>(null);

  if (cuts.length === 0) {
    return <p className="rounded-2xl border border-admin-border bg-admin-surface p-8 text-center text-admin-ink-soft">Sin cortes registrados.</p>;
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[0.86rem]">
          <thead>
            <tr className="border-b border-admin-border text-admin-ink-soft">
              <th className="px-5 py-3 font-medium">Fecha</th>
              <th className="px-5 py-3 font-medium">Turno</th>
              <th className="px-5 py-3 font-medium">Empleado</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
              <th className="px-5 py-3 text-right font-medium">Efectivo</th>
              <th className="px-5 py-3 text-right font-medium">Tarjeta</th>
              <th className="px-5 py-3 text-right font-medium">Efectivo entregado</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              <th className="px-5 py-3"></th>
              {isAdmin && <th className="px-5 py-3"></th>}
              {isAdmin && <th className="px-5 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {cuts.map((cut) => (
              <CutRow key={cut.id} cut={cut} isAdmin={isAdmin} onEdit={() => setEditingCut(cut)} />
            ))}
          </tbody>
        </table>
      </div>

      {editingCut && <EditCutModal cut={editingCut} employees={employees} onClose={() => setEditingCut(null)} />}
    </section>
  );
}

function CutRow({ cut, isAdmin, onEdit }: { cut: Row; isAdmin: boolean; onEdit: () => void }) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(cut.status);

  return (
    <tr className="border-b border-admin-border last:border-0">
      <td className="px-5 py-3 text-admin-ink-soft">{fmtDate(cut.cut_date)}</td>
      <td className="px-5 py-3 text-admin-ink-soft">{cut.shift}</td>
      <td className="px-5 py-3 font-semibold text-admin-ink">{cut.employeeName}</td>
      <td className="px-5 py-3 text-right font-data tabular-nums text-admin-ink">{fmtMoney(cut.total)}</td>
      <td className="px-5 py-3 text-right font-data tabular-nums text-admin-ink-soft">{fmtMoney(cut.cash)}</td>
      <td className="px-5 py-3 text-right font-data tabular-nums text-admin-ink-soft">{fmtMoney(cut.card)}</td>
      <td className="px-5 py-3 text-right font-data tabular-nums text-admin-ink-soft">{fmtMoney(cut.cash_delivered)}</td>
      <td className="px-5 py-3">
        <span className={`rounded-full px-2.5 py-1 text-[0.76rem] font-semibold ${STATUS_STYLE[status]}`}>{status}</span>
      </td>
      <td className="px-5 py-3">
        {cut.photoUrl && (
          <a href={cut.photoUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-admin-primary hover:underline">
            Ver foto
          </a>
        )}
      </td>
      {isAdmin && (
        <td className="px-5 py-3 text-right">
          {status !== "Aprobado" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setStatus("Aprobado");
                startTransition(async () => {
                  await approveCutAction(cut.id);
                });
              }}
              className="rounded-full border border-admin-border px-3.5 py-1.5 text-[0.8rem] font-semibold text-admin-ink disabled:opacity-60"
            >
              Aprobar
            </button>
          )}
        </td>
      )}
      {isAdmin && (
        <td className="px-5 py-3 text-right">
          {isCutDateLocked(cut.cut_date) ? (
            <span className="text-[0.78rem] font-semibold text-admin-ink-soft" title="Junio 2026 y antes ya quedó cerrado.">
              Cerrado
            </span>
          ) : (
            <button type="button" onClick={onEdit} className="font-semibold text-admin-primary hover:underline">
              Editar
            </button>
          )}
        </td>
      )}
    </tr>
  );
}
