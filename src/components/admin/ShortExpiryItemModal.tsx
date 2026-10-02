"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateShortExpiryItemAction,
  deleteShortExpiryItemAction,
  logShortExpirySaleAction,
  deleteShortExpirySaleAction,
} from "@/app/admin/caducidad-corta/actions";
import type { ShortExpiryItem, ShortExpiryShift } from "@/lib/short-expiry";

const inputClass =
  "rounded-lg border border-admin-border bg-admin-input-bg px-3 py-2 text-[0.85rem] text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary";

const DISCOUNTS = ["10", "20", "30", "40", "50"];

function fmtDateTime(v: string) {
  return new Date(v).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function ShortExpiryItemModal({
  item,
  isAdmin,
  monthOpen,
  nameById,
  onClose,
}: {
  item: ShortExpiryItem;
  isAdmin: boolean;
  monthOpen: boolean;
  nameById: Map<string, string>;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [shelf, setShelf] = useState(item.shelf);
  const [physicalPieces, setPhysicalPieces] = useState(String(item.physical_pieces));
  const [discountPct, setDiscountPct] = useState(item.discount_pct != null ? String(item.discount_pct) : "");
  const [twoForOne, setTwoForOne] = useState(item.two_for_one);
  const [notes, setNotes] = useState(item.notes ?? "");

  const [saleShift, setSaleShift] = useState<ShortExpiryShift>("Matutino");
  const [saleQty, setSaleQty] = useState("1");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  function refresh() {
    router.refresh();
  }

  function onSaveEdit() {
    setError(null);
    startTransition(async () => {
      const res = await updateShortExpiryItemAction({
        id: item.id,
        shelf,
        physicalPieces: Number(physicalPieces) || 0,
        discountPct,
        twoForOne,
        notes,
      });
      if (!res.ok) {
        setError(res.error ?? "No se pudo guardar.");
        return;
      }
      refresh();
    });
  }

  function onAddSale() {
    setError(null);
    startTransition(async () => {
      const res = await logShortExpirySaleAction(item.id, saleShift, Number(saleQty) || 0);
      if (!res.ok) {
        setError(res.error ?? "No se pudo registrar la venta.");
        return;
      }
      setSaleQty("1");
      refresh();
    });
  }

  function onDeleteSale(id: string) {
    setError(null);
    startTransition(async () => {
      const res = await deleteShortExpirySaleAction(id);
      if (!res.ok) setError(res.error ?? "No se pudo borrar la venta.");
      else refresh();
    });
  }

  function onDeleteItem() {
    setError(null);
    startTransition(async () => {
      const res = await deleteShortExpiryItemAction(item.id);
      if (!res.ok) {
        setError(res.error ?? "No se pudo borrar.");
        return;
      }
      onClose();
      refresh();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Gestionar ${item.description}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-admin-surface shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-admin-border px-5 py-4">
          <div>
            <h2 className="font-display text-lg text-admin-ink">{item.description}</h2>
            <p className="text-[0.78rem] text-admin-ink-soft">{item.barcode || "Sin código de barras"}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid h-8 w-8 place-items-center rounded-lg text-admin-ink-soft hover:bg-admin-bg">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          {!monthOpen && <p className="rounded-lg bg-admin-pending-bg/50 px-3 py-2 text-[0.8rem] text-admin-ink-soft">Este mes ya está cerrado — solo lectura.</p>}

          <div className={`mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 ${!monthOpen ? "pointer-events-none opacity-60" : ""}`}>
            <label className="block text-[0.78rem] text-admin-ink-soft">
              Anaquel / mueble
              <input value={shelf} onChange={(e) => setShelf(e.target.value)} className={`${inputClass} mt-1 w-full`} disabled={!monthOpen} />
            </label>
            <label className="block text-[0.78rem] text-admin-ink-soft">
              Piezas físicas
              <input
                type="number"
                min="1"
                value={physicalPieces}
                onChange={(e) => setPhysicalPieces(e.target.value)}
                className={`${inputClass} mt-1 w-full`}
                disabled={!monthOpen}
              />
            </label>
            <label className="block text-[0.78rem] text-admin-ink-soft">
              % Descuento
              <select value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} className={`${inputClass} mt-1 w-full`} disabled={!monthOpen}>
                <option value="">Sin descuento</option>
                {DISCOUNTS.map((d) => (
                  <option key={d} value={d}>
                    {d}%
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 self-end pb-2 text-[0.85rem] text-admin-ink">
              <input type="checkbox" checked={twoForOne} onChange={(e) => setTwoForOne(e.target.checked)} disabled={!monthOpen} className="h-4 w-4 accent-admin-primary" />
              2x1
            </label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas" className={`${inputClass} sm:col-span-2`} disabled={!monthOpen} />
          </div>
          {monthOpen && (
            <button type="button" disabled={pending} onClick={onSaveEdit} className="mt-3 rounded-full border border-admin-border px-4 py-2 text-[0.82rem] font-semibold text-admin-ink disabled:opacity-60">
              Guardar cambios
            </button>
          )}

          <hr className="my-4 border-admin-border" />

          <h3 className="text-[0.85rem] font-bold text-admin-ink">Ventas registradas</h3>
          <p className="text-[0.78rem] text-admin-ink-soft">
            Piezas físicas: {item.physical_pieces} · Vendidas: {item.sold} · Restantes: {item.remaining}
          </p>
          <div className="mt-2 flex flex-col gap-1.5">
            {item.sales.length === 0 && <p className="text-[0.82rem] text-admin-ink-soft">Sin ventas todavía.</p>}
            {item.sales.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-[0.82rem] text-admin-ink">
                <span>
                  {s.shift} · {s.quantity} pza(s) · {nameById.get(s.logged_by) ?? "—"} · {fmtDateTime(s.logged_at)}
                </span>
                {monthOpen && (
                  <button type="button" disabled={pending} onClick={() => onDeleteSale(s.id)} className="text-[0.78rem] font-semibold text-admin-bad-text hover:underline disabled:opacity-60">
                    Quitar
                  </button>
                )}
              </div>
            ))}
          </div>
          {monthOpen && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select value={saleShift} onChange={(e) => setSaleShift(e.target.value as ShortExpiryShift)} className={inputClass}>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
              </select>
              <input type="number" min="1" value={saleQty} onChange={(e) => setSaleQty(e.target.value)} className={`${inputClass} w-24`} />
              <button type="button" disabled={pending} onClick={onAddSale} className="rounded-full bg-admin-primary px-4 py-2 text-[0.82rem] font-semibold text-white disabled:opacity-60">
                Registrar venta
              </button>
            </div>
          )}

          {error && <p className="mt-3 text-[0.8rem] text-admin-bad-text">{error}</p>}
        </div>

        {isAdmin && monthOpen && (
          <div className="flex items-center justify-end gap-3 border-t border-admin-border bg-admin-bg px-5 py-3">
            {confirmingDelete ? (
              <>
                <span className="text-[0.78rem] text-admin-ink-soft">¿Borrar este producto?</span>
                <button type="button" disabled={pending} onClick={onDeleteItem} className="text-[0.82rem] font-semibold text-admin-bad-text hover:underline disabled:opacity-60">
                  {pending ? "Borrando…" : "Sí, borrar"}
                </button>
                <button type="button" disabled={pending} onClick={() => setConfirmingDelete(false)} className="text-[0.82rem] text-admin-ink-soft hover:underline disabled:opacity-60">
                  Cancelar
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmingDelete(true)} className="text-[0.82rem] font-semibold text-admin-bad-text hover:underline">
                Borrar producto
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
