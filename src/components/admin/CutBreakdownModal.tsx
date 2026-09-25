"use client";

import { BILLS, COINS, denomKey } from "@/components/admin/DenominationsModal";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export function CutBreakdownModal({ breakdown, cashDelivered, onClose }: { breakdown: Record<string, number>; cashDelivered: number; onClose: () => void }) {
  const billRows = BILLS.map((d) => ({ ...d, count: breakdown[denomKey("billete", d.value)] ?? 0 })).filter((r) => r.count > 0);
  const coinRows = COINS.map((d) => ({ ...d, count: breakdown[denomKey("moneda", d.value)] ?? 0 })).filter((r) => r.count > 0);
  const total = [...billRows, ...coinRows].reduce((sum, r) => sum + r.count * r.value, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Desglose de efectivo por denominación"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl bg-admin-surface shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-admin-border px-5 py-4">
          <h2 className="font-display text-lg text-admin-ink">Desglose de efectivo</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid h-8 w-8 place-items-center rounded-lg text-admin-ink-soft hover:bg-admin-bg">
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <p className="text-[0.82rem] text-admin-ink-soft">Lo que se contó al capturar este corte.</p>

          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <h3 className="text-[0.85rem] font-bold text-admin-ink">Billetes</h3>
              {billRows.length === 0 ? (
                <p className="mt-2 text-[0.82rem] text-admin-ink-soft">Ninguno</p>
              ) : (
                <div className="mt-2 flex flex-col gap-1.5">
                  {billRows.map((r) => (
                    <DenomLine key={r.label} label={r.label} count={r.count} subtotal={r.count * r.value} />
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-[0.85rem] font-bold text-admin-ink">Monedas</h3>
              {coinRows.length === 0 ? (
                <p className="mt-2 text-[0.82rem] text-admin-ink-soft">Ninguna</p>
              ) : (
                <div className="mt-2 flex flex-col gap-1.5">
                  {coinRows.map((r) => (
                    <DenomLine key={r.label} label={r.label} count={r.count} subtotal={r.count * r.value} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-admin-border bg-admin-bg px-5 py-4">
          <div>
            <span className="text-[0.78rem] text-admin-ink-soft">Total del desglose</span>
            <p className="font-display text-xl text-admin-ink">{fmtMoney(total)}</p>
            {Math.abs(total - cashDelivered) >= 0.005 && (
              <p className="mt-0.5 text-[0.8rem] font-semibold text-admin-bad-text">No coincide con el efectivo entregado ({fmtMoney(cashDelivered)})</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink-soft">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function DenomLine({ label, count, subtotal }: { label: string; count: number; subtotal: number }) {
  return (
    <div className="flex items-center justify-between text-[0.85rem] text-admin-ink">
      <span>
        {label} <span className="text-admin-ink-soft">× {count}</span>
      </span>
      <span className="font-data tabular-nums text-admin-ink-soft">{fmtMoney(subtotal)}</span>
    </div>
  );
}
