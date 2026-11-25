import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { monthlySales, yearlySalesGrid, salesByWeekday } from "@/lib/sales-report";
import { AdminShell } from "@/components/admin/AdminShell";
import { YearOverYearChart } from "@/components/admin/YearOverYearChart";

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
  const [profile, months, grid, weekdaySales] = await Promise.all([
    getProfileById(session.uid),
    monthlySales(),
    yearlySalesGrid(),
    salesByWeekday(),
  ]);

  const weekdaysWithData = weekdaySales.filter((w) => w.days > 0);
  const bestWeekday = weekdaysWithData.length > 0 ? weekdaysWithData.reduce((a, b) => (b.average > a.average ? b : a)) : null;
  const worstWeekday = weekdaysWithData.length > 0 ? weekdaysWithData.reduce((a, b) => (b.average < a.average ? b : a)) : null;
  const maxWeekdayAvg = Math.max(...weekdaySales.map((w) => w.average), 1);

  return (
    <AdminShell activeHref="/admin/ventas" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Comparativa de ventas</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Calculada desde los cortes de caja aprobados. Se va llenando sola conforme se acumulan meses.</p>

      <section className="mt-6 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        <h2 className="border-b border-admin-border px-5 py-3 font-display text-base text-admin-ink">Ventas por día de la semana</h2>
        {weekdaysWithData.length === 0 ? (
          <p className="px-5 py-8 text-center text-admin-ink-soft">Todavía no hay cortes aprobados para comparar.</p>
        ) : (
          <div className="p-5">
            <p className="text-[0.84rem] text-admin-ink-soft">
              Promedio de venta por fecha capturada, según el día de la semana en que cayó — así se compara parejo aunque un día haya caído más
              veces que otro en lo que llevas subido.
            </p>

            {bestWeekday && worstWeekday && bestWeekday.weekday !== worstWeekday.weekday && (
              <p className="mt-3 rounded-xl bg-admin-primary-soft px-4 py-3 text-[0.84rem] text-admin-primary-deep">
                <b>{bestWeekday.weekday}</b> es el día que más vende en promedio ({fmtMoney(bestWeekday.average)}) — <b>{worstWeekday.weekday}</b>{" "}
                es el que menos ({fmtMoney(worstWeekday.average)}), buen candidato para reforzar con promociones.
              </p>
            )}

            <div className="mt-5 grid grid-cols-7 items-end gap-2 sm:gap-3">
              {weekdaySales.map((w) => {
                const heightPct = w.average > 0 ? Math.max(4, Math.round((w.average / maxWeekdayAvg) * 100)) : 0;
                const isBest = bestWeekday && w.weekday === bestWeekday.weekday;
                return (
                  <div key={w.weekday} className="flex h-40 flex-col items-center justify-end gap-1">
                    <span className="text-[0.66rem] font-semibold whitespace-nowrap text-admin-ink-soft">{w.average > 0 ? fmtMoney(w.average) : ""}</span>
                    <div
                      className={`w-full rounded-t-md ${w.average > 0 ? (isBest ? "bg-admin-primary" : "bg-admin-primary/45") : "border border-dashed border-admin-border"}`}
                      style={{ height: w.average > 0 ? `${heightPct}%` : "3px" }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="mt-1.5 grid grid-cols-7 gap-2 sm:gap-3">
              {weekdaySales.map((w) => (
                <span key={w.weekday} className="text-center text-[0.72rem] font-bold text-admin-ink-soft">
                  {w.weekday.slice(0, 3)}
                </span>
              ))}
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-left text-[0.84rem]">
                <thead>
                  <tr className="border-b border-admin-border text-admin-ink-soft">
                    <th className="py-2 font-medium">Día</th>
                    <th className="py-2 text-right font-medium">Promedio por fecha</th>
                    <th className="py-2 text-right font-medium">Total acumulado</th>
                    <th className="py-2 text-right font-medium">Fechas capturadas</th>
                  </tr>
                </thead>
                <tbody>
                  {weekdaySales.map((w) => (
                    <tr key={w.weekday} className="border-b border-admin-border last:border-0">
                      <td className="py-2 font-semibold text-admin-ink">
                        {w.weekday}
                        {bestWeekday && w.weekday === bestWeekday.weekday && (
                          <span className="ml-2 rounded-full bg-admin-ok-bg px-2 py-0.5 text-[0.68rem] font-bold text-admin-ok-text">Mejor día</span>
                        )}
                        {worstWeekday && w.weekday === worstWeekday.weekday && worstWeekday.weekday !== bestWeekday?.weekday && (
                          <span className="ml-2 rounded-full bg-admin-pending-bg px-2 py-0.5 text-[0.68rem] font-bold text-admin-pending-text">
                            Menos ventas
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right font-data tabular-nums text-admin-ink">{w.days > 0 ? fmtMoney(w.average) : "—"}</td>
                      <td className="py-2 text-right font-data tabular-nums text-admin-ink-soft">{fmtMoney(w.total)}</td>
                      <td className="py-2 text-right font-data tabular-nums text-admin-ink-soft">{w.days}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {grid.years.length > 0 && (
        <div className="mt-6">
          <YearOverYearChart years={grid.years} rows={grid.rows} />
        </div>
      )}

      <section className="mt-5 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        <h2 className="border-b border-admin-border px-5 py-3 font-display text-base text-admin-ink">Año contra año</h2>
        {grid.years.length === 0 ? (
          <p className="px-5 py-8 text-center text-admin-ink-soft">Todavía no hay cortes aprobados para comparar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-left text-[0.9rem]">
              <thead>
                <tr className="text-admin-ink-soft">
                  <th className="sticky left-0 border-b border-admin-border bg-admin-surface px-5 py-3.5 font-medium">Mes</th>
                  {grid.years.map((y) => (
                    <th key={y} className="min-w-[110px] border-b border-l border-admin-border px-4 py-3.5 text-right font-medium">
                      {y}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.rows.map((row, i) => {
                  const rowMax = Math.max(...grid.years.map((y) => row.byYear[y] ?? 0), 0);
                  return (
                    <tr key={row.monthName} className={i % 2 === 1 ? "bg-admin-bg/40" : undefined}>
                      <td className="sticky left-0 border-b border-admin-border bg-inherit px-5 py-3.5 font-semibold text-admin-ink">{row.monthName}</td>
                      {grid.years.map((y) => {
                        const value = row.byYear[y];
                        const intensity = rowMax > 0 && value !== undefined ? value / rowMax : 0;
                        const isBest = value !== undefined && rowMax > 0 && value === rowMax;
                        return (
                          <td
                            key={y}
                            className={`border-b border-l border-admin-border px-4 py-3.5 text-right font-data tabular-nums ${
                              isBest ? "font-bold text-admin-ink" : "text-admin-ink-soft"
                            }`}
                            style={value !== undefined ? { backgroundColor: `color-mix(in srgb, var(--admin-primary) ${(intensity * 16).toFixed(0)}%, transparent)` } : undefined}
                          >
                            {value !== undefined ? fmtMoney(value) : "—"}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="sticky left-0 border-t-2 border-admin-border bg-admin-surface px-5 py-3.5 font-bold text-admin-ink">Total anual</td>
                  {grid.years.map((y) => (
                    <td key={y} className="border-t-2 border-l border-admin-border px-4 py-3.5 text-right font-data font-bold tabular-nums text-admin-ink">
                      {fmtMoney(grid.totalsByYear[y] ?? 0)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      <section className="mt-5 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
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
    </AdminShell>
  );
}

function diffColor(n: number | null) {
  if (n === null) return "text-admin-ink-soft";
  return n >= 0 ? "text-admin-ok-text" : "text-admin-bad-text";
}
