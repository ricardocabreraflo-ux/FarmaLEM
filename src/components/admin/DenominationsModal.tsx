"use client";

import { useState } from "react";

interface Denomination {
  label: string;
  value: number;
}

const BILLS: Denomination[] = [
  { label: "$1000", value: 1000 },
  { label: "$500", value: 500 },
  { label: "$200", value: 200 },
  { label: "$100", value: 100 },
  { label: "$50", value: 50 },
  { label: "$20", value: 20 },
];

const COINS: Denomination[] = [
  { label: "$20", value: 20 },
  { label: "$10", value: 10 },
  { label: "$5", value: 5 },
  { label: "$2", value: 2 },
  { label: "$1", value: 1 },
  { label: "$0.50", value: 0.5 },
];

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export function DenominationsModal({ show, onConfirm, onClose }: { show: boolean; onConfirm: (total: number) => void; onClose: () => void }) {
  // El estado vive mientras el componente esté montado, así que aunque se
  // oculte (show=false) no se pierde el conteo si vuelven a abrirlo para
  // corregir un solo campo — no hace falta capturar todo de nuevo.
  const [counts, setCounts] = useState<Record<string, string>>({});

  if (!show) return null;

  function key(group: "billete" | "moneda", value: number) {
    return `${group}-${value}`;
  }

  function total() {
    let sum = 0;
    for (const d of BILLS) sum += (Number(counts[key("billete", d.value)]) || 0) * d.value;
    for (const d of COINS) sum += (Number(counts[key("moneda", d.value)]) || 0) * d.value;
    return sum;
  }

  const grandTotal = total();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Desglose de efectivo por denominación"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl bg-admin-surface shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-admin-border px-5 py-4">
          <h2 className="font-display text-lg text-admin-ink">Contar efectivo</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid h-8 w-8 place-items-center rounded-lg text-admin-ink-soft hover:bg-admin-bg">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <p className="text-[0.82rem] text-admin-ink-soft">Captura cuántos billetes y monedas de cada denominación vienen en el sobre.</p>

          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <h3 className="text-[0.85rem] font-bold text-admin-ink">Billetes</h3>
              <div className="mt-2 flex flex-col gap-2">
                {BILLS.map((d) => (
                  <DenomRow key={key("billete", d.value)} label={d.label} value={counts[key("billete", d.value)] ?? ""} onChange={(v) => setCounts((prev) => ({ ...prev, [key("billete", d.value)]: v }))} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-[0.85rem] font-bold text-admin-ink">Monedas</h3>
              <div className="mt-2 flex flex-col gap-2">
                {COINS.map((d) => (
                  <DenomRow key={key("moneda", d.value)} label={d.label} value={counts[key("moneda", d.value)] ?? ""} onChange={(v) => setCounts((prev) => ({ ...prev, [key("moneda", d.value)]: v }))} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-admin-border bg-admin-bg px-5 py-4">
          <div>
            <span className="text-[0.78rem] text-admin-ink-soft">Total contado</span>
            <p className="font-display text-xl text-admin-ink">{fmtMoney(grandTotal)}</p>
          </div>
          <div className="flex gap-2.5">
            <button type="button" onClick={onClose} className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink-soft">
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm(grandTotal)}
              className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Usar este total
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DenomRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-[0.85rem] text-admin-ink">
      {label}
      <input
        type="number"
        min="0"
        step="1"
        placeholder="0"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-20 rounded-lg border border-admin-border bg-admin-bg px-3 py-1.5 text-right text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
      />
    </label>
  );
}
