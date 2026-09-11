"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { findByBarcodeAction, completeReceiptLineAction } from "@/app/admin/compras/actions";
import type { PurchaseReceiptLine } from "@/lib/purchase-receipts";

const inputClass =
  "w-full rounded-lg border border-admin-border bg-admin-input-bg px-2.5 py-1.5 text-[0.84rem] text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-admin-primary";

function money(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function fmtDate(v: string | null) {
  if (!v) return "—";
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

interface Draft {
  barcode: string;
  description: string;
  salePrice: string;
  packFactor: string;
}

function draftFor(line: PurchaseReceiptLine): Draft {
  return {
    barcode: line.barcode,
    description: line.description,
    salePrice: line.sale_price != null ? String(line.sale_price) : "",
    packFactor: String(line.pack_factor || 1),
  };
}

export function PendingReceiptLinesEditor({ lines }: { lines: PurchaseReceiptLine[] }) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => Object.fromEntries(lines.map((l) => [l.id, draftFor(l)])));
  const [pending, startTransition] = useTransition();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function update(id: string, patch: Partial<Draft>) {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
  }

  async function onBarcodeBlur(id: string) {
    const barcode = drafts[id]?.barcode.trim();
    if (!barcode) return;
    try {
      const known = await findByBarcodeAction(barcode);
      if (known) update(id, { barcode: known.barcode, description: known.description, salePrice: String(known.salePrice) });
    } catch (err) {
      setErrors((e) => ({ ...e, [id]: (err as Error).message }));
    }
  }

  function completar(line: PurchaseReceiptLine) {
    const draft = drafts[line.id];
    setErrors((e) => ({ ...e, [line.id]: "" }));
    const salePrice = Number(draft.salePrice);
    const packFactor = Number(draft.packFactor || 1);
    if (!draft.barcode.trim() || !draft.description.trim() || !(salePrice >= 0)) {
      setErrors((e) => ({ ...e, [line.id]: "Falta código de barras, descripción o precio de venta." }));
      return;
    }
    setSavingId(line.id);
    startTransition(async () => {
      const res = await completeReceiptLineAction(line.id, { barcode: draft.barcode.trim(), description: draft.description.trim(), salePrice, packFactor });
      setSavingId(null);
      if (!res.ok) {
        setErrors((e) => ({ ...e, [line.id]: res.error ?? "No se pudo completar el renglón." }));
        return;
      }
      router.refresh();
    });
  }

  if (lines.length === 0) return null;

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-admin-pending-text/40 bg-admin-surface">
      <div className="border-b border-admin-border bg-admin-pending-bg px-5 py-3">
        <h2 className="font-display text-base text-admin-pending-text">Renglones por completar ({lines.length})</h2>
        <p className="mt-0.5 text-[0.8rem] text-admin-ink-soft">
          Ligalos a un producto (código de barras existente) o da de alta uno nuevo (descripción + precio de venta) para que cuenten como recibidos.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[0.84rem]">
          <thead>
            <tr className="border-b border-admin-border text-admin-ink-soft">
              <th className="px-4 py-2.5 font-medium">Ticket</th>
              <th className="px-4 py-2.5 text-right font-medium">Cant.</th>
              <th className="px-4 py-2.5 text-right font-medium">Precio</th>
              <th className="px-4 py-2.5 font-medium">Lote / caducidad</th>
              <th className="px-4 py-2.5 font-medium">Código de barras</th>
              <th className="px-4 py-2.5 font-medium">Descripción</th>
              <th className="px-4 py-2.5 font-medium">Precio venta</th>
              <th className="px-4 py-2.5 font-medium">Factor</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => {
              const d = drafts[l.id];
              return (
                <tr key={l.id} className="border-b border-admin-border align-top last:border-0">
                  <td className="px-4 py-2.5 text-admin-ink-soft">
                    <span className="block font-semibold text-admin-ink">{l.ticket_description ?? "—"}</span>
                    <span className="block text-[0.72rem]">clave {l.supplier_code ?? "—"}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-admin-ink">{l.quantity}</td>
                  <td className="px-4 py-2.5 text-right font-data tabular-nums text-admin-ink-soft">{money(l.unit_price)}</td>
                  <td className="px-4 py-2.5 text-admin-ink-soft">
                    {l.lot ?? "—"}
                    <br />
                    {fmtDate(l.expires_on)}
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      className={inputClass}
                      value={d.barcode}
                      onChange={(e) => update(l.id, { barcode: e.target.value })}
                      onBlur={() => onBarcodeBlur(l.id)}
                      placeholder="Escanear/escribir"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input className={inputClass} value={d.description} onChange={(e) => update(l.id, { description: e.target.value })} />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      className={inputClass}
                      type="number"
                      min="0"
                      step="0.01"
                      value={d.salePrice}
                      onChange={(e) => update(l.id, { salePrice: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      className={`${inputClass} w-16`}
                      type="number"
                      min="1"
                      step="1"
                      value={d.packFactor}
                      onChange={(e) => update(l.id, { packFactor: e.target.value })}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      type="button"
                      disabled={pending && savingId === l.id}
                      onClick={() => completar(l)}
                      className="rounded-full bg-admin-primary px-4 py-1.5 text-[0.8rem] font-semibold whitespace-nowrap text-white disabled:opacity-60"
                    >
                      {pending && savingId === l.id ? "…" : "Completar"}
                    </button>
                    {errors[l.id] && <p className="mt-1 max-w-[10rem] text-[0.7rem] text-admin-bad-text">{errors[l.id]}</p>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
