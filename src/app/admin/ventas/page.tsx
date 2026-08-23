import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { monthlySales, yearlySalesGrid } from "@/lib/sales-report";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Comparativa de ventas" };
export const dynamic = "force-dynamic";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

function fmtPct(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" }).format(n);
}

export default async function VentasPage() {
  const session = await requireAdminSession();
  const [profile, months, grid] = await Promise.all([getProfileById(session.uid), monthlySales(), yearlySalesGrid()]);

  return (
    <AdminShell activeHref="/admin/ventas" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Comparativa de ventas</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Calculada desde los cortes de caja aprobados. Se va llenando sola conforme se acumulan meses.</p>

      <section className="mt-6 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        <h2 className="border-b border-admin-border px-5 py-3 font-display text-base text-admin-ink">Mes a mes</h2>
        {months.length === 0 ? (
          <p className="px-5 py-8 text-center text-admin-ink-soft">Todavía no hay cortes aprobados para comparar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.86rem]">
              <thead>
                <tr className="border-b border-admin-border text-admin-ink-soft">
                  <th className="px-5 py-3 font-medium">Mes</th>
                  <th className="px-5 py-3 text-right font-medium">Ventas</th>
                  <th className="px-5 py-3 text-right font-medium">Variación</th>
                  <th className="px-5 py-3 text-right font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m) => (
                  <tr key={m.month} className="border-b border-admin-border last:border-0">
                    <td className="px-5 py-3 font-semibold text-admin-ink">{m.label}</td>
                    <td className="px-5 py-3 text-right font-data tabular-nums text-admin-ink">{fmtMoney(m.total)}</td>
                    <td className={`px-5 py-3 text-right font-data tabular-nums ${diffColor(m.diff)}`}>{m.diff === null ? "—" : fmtMoney(m.diff)}</td>
                    <td className={`px-5 py-3 text-right font-data tabular-nums ${diffColor(m.pctChange)}`}>{m.pctChange === null ? "—" : fmtPct(m.pctChange)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        <h2 className="border-b border-admin-border px-5 py-3 font-display text-base text-admin-ink">Año contra año</h2>
        {grid.years.length === 0 ? (
          <p className="px-5 py-8 text-center text-admin-ink-soft">Todavía no hay cortes aprobados para comparar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.86rem]">
              <thead>
                <tr className="border-b border-admin-border text-admin-ink-soft">
                  <th className="px-5 py-3 font-medium">Mes</th>
                  {grid.years.map((y) => (
                    <th key={y} className="px-5 py-3 text-right font-medium">
                      {y}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.rows.map((row) => (
                  <tr key={row.monthName} className="border-b border-admin-border last:border-0">
                    <td className="px-5 py-3 font-semibold text-admin-ink">{row.monthName}</td>
                    {grid.years.map((y) => (
                      <td key={y} className="px-5 py-3 text-right font-data tabular-nums text-admin-ink-soft">
                        {row.byYear[y] !== undefined ? fmtMoney(row.byYear[y]) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="px-5 py-3 font-bold text-admin-ink">Total anual</td>
                  {grid.years.map((y) => (
                    <td key={y} className="px-5 py-3 text-right font-data font-bold tabular-nums text-admin-ink">
                      {fmtMoney(grid.totalsByYear[y] ?? 0)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}

function diffColor(n: number | null) {
  if (n === null) return "text-admin-ink-soft";
  return n >= 0 ? "text-admin-ok-text" : "text-admin-bad-text";
}
