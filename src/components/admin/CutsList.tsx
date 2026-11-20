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
import { CutBreakdownModal } from "@/components/admin/CutBreakdownModal";

const iconBase = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconCheck({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="8,12.5 10.5,15 16,9" />
    </svg>
  );
}

function IconEdit({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      <line x1="14.5" y1="5.5" x2="18.5" y2="9.5" />
    </svg>
  );
}

function IconBreakdown({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function IconNote({ className }: { className?: string }) {
  return (
    <svg {...iconBase} className={className}>
      <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <polyline points="15,3 15,8 20,8" />
      <line x1="8" y1="13" x2="15" y2="13" />
      <line x1="8" y1="16.5" x2="13" y2="16.5" />
    </svg>
  );
}

const iconButtonClass = "grid h-8 w-8 shrink-0 place-items-center rounded-full text-admin-ink-soft transition-colors hover:bg-admin-primary-soft hover:text-admin-primary-deep disabled:opacity-60";

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

export function CutsList({ cuts, isAdmin, canReview, employees }: { cuts: Row[]; isAdmin: boolean; canReview: boolean; employees: Profile[] }) {
  const router = useRouter();
  const [editingCut, setEditingCut] = useState<Row | null>(null);
  const [notingCut, setNotingCut] = useState<Row | null>(null);
  const [viewingBreakdown, setViewingBreakdown] = useState<Row | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPending, startBulkTransition] = useTransition();

  if (cuts.length === 0) {
    return <p className="rounded-2xl border border-admin-border bg-admin-surface p-8 text-center text-admin-ink-soft">Sin cortes registrados.</p>;
  }

  const allSelected = cuts.length > 0 && cuts.every((c) => selected.has(c.id));
  const selectedCashTotal = cuts.filter((c) => selected.has(c.id)).reduce((sum, c) => sum + c.cash, 0);

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
          <span className="rounded-full bg-admin-surface px-3 py-1 text-[0.8rem] font-semibold text-admin-ink">
            Efectivo: {fmtMoney(selectedCashTotal)}
          </span>
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
            <tr className="sticky top-16 z-10 border-b border-admin-border bg-admin-surface text-admin-ink-soft [&>th]:bg-admin-surface">
              {isAdmin && (
                <th className="px-2 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                    className="h-4 w-4 accent-admin-primary"
                    aria-label="Seleccionar todos"
                  />
                </th>
              )}
              <th className="px-3 py-2.5 font-medium">Fecha</th>
              <th className="px-3 py-2.5 font-medium">Turno</th>
              <th className="px-3 py-2.5 font-medium">Empleado</th>
              <th className="px-3 py-2.5 text-right font-medium">Total</th>
              <th className="px-3 py-2.5 text-right font-medium">Efectivo</th>
              <th className="px-3 py-2.5 text-right font-medium">Tarjeta</th>
              <th className="px-3 py-2.5 text-right font-medium">Efectivo entregado</th>
              <th className="px-3 py-2.5 font-medium">Estado</th>
              {canReview && <th className="sticky right-0 z-20 border-l border-admin-border px-2 py-2.5"></th>}
              {isAdmin && <th className="px-2 py-2.5 font-medium">Nota</th>}
              {isAdmin && <th className="px-2 py-2.5 text-center font-medium">Recogido</th>}
              <th className="px-2 py-2.5"></th>
              <th className="px-2 py-2.5"></th>
              {canReview && <th className="px-2 py-2.5"></th>}
            </tr>
          </thead>
          <tbody>
            {cuts.map((cut) => (
              <CutRow
                key={cut.id}
                cut={cut}
                isAdmin={isAdmin}
                canReview={canReview}
                selected={selected.has(cut.id)}
                onToggleSelect={(checked) => toggleOne(cut.id, checked)}
                onEdit={() => setEditingCut(cut)}
                onNote={() => setNotingCut(cut)}
                onViewBreakdown={() => setViewingBreakdown(cut)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {editingCut && <EditCutModal cut={editingCut} employees={employees} onClose={() => setEditingCut(null)} />}
      {notingCut && <CutNoteModal cutId={notingCut.id} initialNotes={notingCut.notes} onClose={() => setNotingCut(null)} />}
      {viewingBreakdown && viewingBreakdown.cash_breakdown && (
        <CutBreakdownModal breakdown={viewingBreakdown.cash_breakdown} cashDelivered={viewingBreakdown.cash_delivered} onClose={() => setViewingBreakdown(null)} />
      )}
    </section>
  );
}

function CutRow({
  cut,
  isAdmin,
  canReview,
  selected,
  onToggleSelect,
  onEdit,
  onNote,
  onViewBreakdown,
}: {
  cut: Row;
  isAdmin: boolean;
  canReview: boolean;
  selected: boolean;
  onToggleSelect: (checked: boolean) => void;
  onEdit: () => void;
  onNote: () => void;
  onViewBreakdown: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(cut.status);

  return (
    <tr className={`border-b border-admin-border last:border-0 ${selected ? "bg-admin-primary-soft/40" : ""}`}>
      {isAdmin && (
        <td className="px-2 py-2.5">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onToggleSelect(e.target.checked)}
            className="h-4 w-4 accent-admin-primary"
            aria-label={`Seleccionar corte del ${fmtDate(cut.cut_date)}`}
          />
        </td>
      )}
      <td className="px-3 py-2.5 text-admin-ink-soft">{fmtDate(cut.cut_date)}</td>
      <td className="px-3 py-2.5 text-admin-ink-soft">{cut.shift}</td>
      <td className="px-3 py-2.5 font-semibold text-admin-ink">{cut.employeeName}</td>
      <td className="px-3 py-2.5 text-right font-data tabular-nums text-admin-ink">{fmtMoney(cut.total)}</td>
      <td className="px-3 py-2.5 text-right font-data tabular-nums text-admin-ink-soft">{fmtMoney(cut.cash)}</td>
      <td className="px-3 py-2.5 text-right font-data tabular-nums text-admin-ink-soft">{fmtMoney(cut.card)}</td>
      <td className="px-3 py-2.5 text-right font-data tabular-nums text-admin-ink-soft">{fmtMoney(cut.cash_delivered)}</td>
      <td className="px-3 py-2.5">
        <span className={`rounded-full px-2.5 py-1 text-[0.76rem] font-semibold ${STATUS_STYLE[status]}`}>{status}</span>
      </td>
      {canReview && (
        <td className={`sticky right-0 border-l border-admin-border px-2 py-2.5 ${selected ? "bg-admin-primary-soft/40" : "bg-admin-surface"}`}>
          {status !== "Aprobado" && (
            <button
              type="button"
              disabled={pending}
              title="Aprobar"
              aria-label="Aprobar"
              onClick={() => {
                setStatus("Aprobado");
                startTransition(async () => {
                  await approveCutAction(cut.id);
                });
              }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-admin-primary text-white transition-transform duration-150 ease-out active:scale-[0.94] disabled:opacity-60"
            >
              <IconCheck className="h-[18px] w-[18px]" />
            </button>
          )}
        </td>
      )}
      {isAdmin && (
        <td className="px-2 py-2.5">
          <button
            type="button"
            onClick={onNote}
            title={cut.notes ? cut.notes : "Agregar nota"}
            aria-label={cut.notes ? "Ver nota" : "Agregar nota"}
            className={`${iconButtonClass} ${cut.notes ? "bg-admin-primary-soft text-admin-primary-deep" : ""}`}
          >
            <IconNote className="h-[18px] w-[18px]" />
          </button>
        </td>
      )}
      {isAdmin && (
        <td className="px-2 py-2.5 text-center">
          <CutCashCollectedCheckbox cutId={cut.id} initialValue={cut.cash_collected} />
        </td>
      )}
      <td className="px-2 py-2.5">
        {cut.photoUrl && (
          <a href={cut.photoUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-admin-primary hover:underline">
            Ver foto
          </a>
        )}
      </td>
      <td className="px-2 py-2.5">
        {cut.cash_breakdown && Object.keys(cut.cash_breakdown).length > 0 && (
          <button type="button" onClick={onViewBreakdown} title="Ver desglose" aria-label="Ver desglose" className={iconButtonClass}>
            <IconBreakdown className="h-[18px] w-[18px]" />
          </button>
        )}
      </td>
      {canReview && (
        <td className="px-2 py-2.5 text-right">
          {isCutDateLocked(cut.cut_date) ? (
            <span className="text-[0.78rem] font-semibold text-admin-ink-soft" title="Junio 2026 y antes ya quedó cerrado.">
              Cerrado
            </span>
          ) : (
            <button type="button" onClick={onEdit} title="Editar" aria-label="Editar" className={iconButtonClass}>
              <IconEdit className="h-[18px] w-[18px]" />
            </button>
          )}
        </td>
      )}
    </tr>
  );
}
