"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Cut } from "@/lib/cuts";
import { isCutDateLocked } from "@/lib/cuts-lock";
import type { Profile } from "@/lib/profiles";
import { approveCutAction, bulkSetCutCashCollectedAction } from "@/app/admin/cortes/actions";
import { EditCutModal } from "@/components/admin/EditCutModal";
import { CutNoteModal } from "@/components/admin/CutNoteModal";
import { CutCashCollectedCheckbox } from "@/components/admin/CutCashCollectedCheckbox";

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
  const router = useRouter();
  const [editingCut, setEditingCut] = useState<Row | null>(null);
  const [notingCut, setNotingCut] = useState<Row | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPending, startBulkTransition] = useTransition();

  if (cuts.length === 0) {
    return <p className="rounded-2xl border border-admin-border bg-admin-surface p-8 text-center text-admin-ink-soft">Sin cortes registrados.</p>;
  }

  const allSelected = cuts.length > 0 && cuts.every((c) => selected.has(c.id));

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(cuts.map((c) => c.id)) : new Set());
  }

  function runBulk(value: boolean) {
    startBulkTransition(async () => {
      const res = await bulkSetCutCashCollectedAction([...selected], value);
      if (res.ok) {
        setSelected(new Set());
        router.refresh();
      }
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
      {isAdmin && selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-admin-border bg-admin-primary-soft px-5 py-3">
          <span className="text-[0.84rem] font-semibold text-admin-primary-deep">{selected.size} seleccionado{selected.size === 1 ? "" : "s"}</span>
          <button
            type="button"
            disabled={bulkPending}
            onClick={() => runBulk(true)}
            className="rounded-full bg-admin-primary px-4 py-1.5 text-[0.8rem] font-semibold text-white disabled:opacity-60"
          >
            {bulkPending ? "Marcando…" : "Marcar recogido"}
          </button>
          <button
            type="button"
            disabled={bulkPending}
            onClick={() => runBulk(false)}
            className="rounded-full border border-admin-border px-4 py-1.5 text-[0.8rem] font-semibold text-admin-ink disabled:opacity-60"
          >
            Quitar marca
          </button>
          <button type="button" disabled={bulkPending} onClick={() => setSelected(new Set())} className="text-[0.8rem] text-admin-ink-soft hover:underline">
            Cancelar selección
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-[0.86rem]">
          <thead>
            <tr className="border-b border-admin-border text-admin-ink-soft">
              {isAdmin && (
                <th className="px-5 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="h-4 w-4 accent-admin-primary"
                    aria-label="Seleccionar todos"
                  />
                </th>
              )}
              <th className="px-5 py-3 font-medium">Fecha</th>
              <th className="px-5 py-3 font-medium">Turno</th>
              <th className="px-5 py-3 font-medium">Empleado</th>
              <th className="px-5 py-3 text-right font-medium">Total</th>
              <th className="px-5 py-3 text-right font-medium">Efectivo</th>
              <th className="px-5 py-3 text-right font-medium">Tarjeta</th>
              <th className="px-5 py-3 text-right font-medium">Efectivo entregado</th>
              <th className="px-5 py-3 font-medium">Estado</th>
              {isAdmin && <th className="px-5 py-3 font-medium">Nota</th>}
              {isAdmin && <th className="px-5 py-3 text-center font-medium">Recogido</th>}
              <th className="px-5 py-3"></th>
              {isAdmin && <th className="px-5 py-3"></th>}
              {isAdmin && <th className="px-5 py-3"></th>}
            </tr>
          </thead>
          <tbody>
            {cuts.map((cut) => (
              <CutRow
                key={cut.id}
                cut={cut}
                isAdmin={isAdmin}
                selected={selected.has(cut.id)}
                onToggleSelect={(checked) => toggleOne(cut.id, checked)}
                onEdit={() => setEditingCut(cut)}
                onNote={() => setNotingCut(cut)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {editingCut && <EditCutModal cut={editingCut} employees={employees} onClose={() => setEditingCut(null)} />}
      {notingCut && <CutNoteModal cutId={notingCut.id} initialNotes={notingCut.notes} onClose={() => setNotingCut(null)} />}
    </section>
  );
}

function CutRow({
  cut,
  isAdmin,
  selected,
  onToggleSelect,
  onEdit,
  onNote,
}: {
  cut: Row;
  isAdmin: boolean;
  selected: boolean;
  onToggleSelect: (checked: boolean) => void;
  onEdit: () => void;
  onNote: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(cut.status);

  return (
    <tr className={`border-b border-admin-border last:border-0 ${selected ? "bg-admin-primary-soft/40" : ""}`}>
      {isAdmin && (
        <td className="px-5 py-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onToggleSelect(e.target.checked)}
            className="h-4 w-4 accent-admin-primary"
            aria-label={`Seleccionar corte del ${fmtDate(cut.cut_date)}`}
          />
        </td>
      )}
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
      {isAdmin && (
        <td className="px-5 py-3 max-w-[180px]">
          <button type="button" onClick={onNote} className="text-left text-[0.82rem] font-semibold text-admin-primary hover:underline">
            {cut.notes ? <span className="line-clamp-2 whitespace-normal font-normal text-admin-ink-soft">{cut.notes}</span> : "+ Nota"}
          </button>
        </td>
      )}
      {isAdmin && (
        <td className="px-5 py-3 text-center">
          <CutCashCollectedCheckbox cutId={cut.id} initialValue={cut.cash_collected} />
        </td>
      )}
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
