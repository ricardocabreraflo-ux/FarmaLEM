"use client";

import { useMemo, useState } from "react";

export interface CatalogRow {
  barcode: string;
  description: string;
  department: string | null;
  category: string | null;
  unit: string | null;
  salePrice: number | null;
  salePriceNet: number | null;
  cost: number | null;
}

function money(n: number | null) {
  return n == null ? "—" : n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

const SHOWN = 300;

export function ProductCatalogTable({ rows }: { rows: CatalogRow[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((r) => r.description.toLowerCase().includes(term) || r.barcode.includes(term) || (r.category ?? "").toLowerCase().includes(term));
  }, [rows, q]);

  const shown = filtered.slice(0, SHOWN);

  return (
    <div className="mt-4">
      <label className="block max-w-sm text-[0.85rem] font-semibold text-admin-ink">
        Buscar
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Clave, descripción o categoría…"
          className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
        />
      </label>
      <p className="mt-2 text-[0.78rem] text-admin-ink-soft">
        {filtered.length} resultado(s){filtered.length > SHOWN ? ` — mostrando los primeros ${SHOWN}, afina tu búsqueda para ver el resto` : ""}
      </p>

      <div className="mt-3 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.84rem]">
            <thead>
              <tr className="border-b border-admin-border text-admin-ink-soft">
                <th className="px-4 py-2.5 font-medium">Clave</th>
                <th className="px-4 py-2.5 font-medium">Descripción</th>
                <th className="px-4 py-2.5 font-medium">Departamento</th>
                <th className="px-4 py-2.5 font-medium">Categoría</th>
                <th className="px-4 py-2.5 text-right font-medium">Precio</th>
                <th className="px-4 py-2.5 text-right font-medium">Precio neto</th>
                <th className="px-4 py-2.5 text-right font-medium">Costo</th>
                <th className="px-4 py-2.5 text-right font-medium">Margen</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-admin-ink-soft">
                    Sin resultados.
                  </td>
                </tr>
              )}
              {shown.map((r) => {
                const refPrice = r.salePriceNet ?? r.salePrice;
                const margin = r.cost != null && refPrice != null ? refPrice - r.cost : null;
                const marginPct = margin != null && refPrice ? (margin / refPrice) * 100 : null;
                return (
                  <tr key={r.barcode} className="border-b border-admin-border text-admin-ink-soft last:border-0">
                    <td className="px-4 py-2 font-data tabular-nums">{r.barcode}</td>
                    <td className="px-4 py-2 font-semibold text-admin-ink">{r.description}</td>
                    <td className="px-4 py-2">{r.department ?? "—"}</td>
                    <td className="px-4 py-2">{r.category ?? "—"}</td>
                    <td className="px-4 py-2 text-right font-data tabular-nums">{money(r.salePrice)}</td>
                    <td className="px-4 py-2 text-right font-data tabular-nums">{money(r.salePriceNet)}</td>
                    <td className="px-4 py-2 text-right font-data tabular-nums">{money(r.cost)}</td>
                    <td className={`px-4 py-2 text-right font-data tabular-nums ${margin == null ? "" : margin >= 0 ? "text-admin-ok-text" : "text-admin-bad-text"}`}>
                      {margin == null ? "—" : `${money(margin)} (${marginPct!.toFixed(0)}%)`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
