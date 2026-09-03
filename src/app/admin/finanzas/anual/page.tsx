import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { mexicoCityToday } from "@/lib/dates";
import { getProfileById } from "@/lib/profiles";
import { getMonthlyFinancials, type MonthlyFinancials } from "@/lib/financials";
import { listHistoricalIncomeStatements, type HistoricalIncomeStatement } from "@/lib/historical-financials";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Comparativo anual" };
export const dynamic = "force-dynamic";

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

interface GastoRow {
  label: string;
  value: (idx: number) => number | null;
}

export default async function AnnualComparisonPage({ searchParams }: { searchParams: Promise<{ anio?: string }> }) {
  const session = await requireAdminSession();
  const { anio } = await searchParams;
  const year = anio || mexicoCityToday().slice(0, 4);
  const months = MONTH_NAMES.map((_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);

  const [profile, financialsByMonth, historicalByMonth] = await Promise.all([
    getProfileById(session.uid),
    Promise.all(months.map((m) => getMonthlyFinancials(m))),
    listHistoricalIncomeStatements(months),
  ]);

  const hist = (idx: number): HistoricalIncomeStatement | undefined => historicalByMonth.get(months[idx]);
  const fin = (idx: number): MonthlyFinancials => financialsByMonth[idx];

  const gastoRows: GastoRow[] = [
    { label: "Renta", value: (i) => hist(i)?.gasto_renta ?? null },
    { label: "Luz y Agua", value: (i) => hist(i)?.gasto_luz_agua ?? null },
    { label: "Bonos", value: (i) => hist(i)?.gasto_bonos ?? fin(i).bonuses },
    { label: "Sueldos", value: (i) => hist(i)?.gasto_sueldos ?? fin(i).salaries },
    { label: "Varios", value: (i) => hist(i)?.gasto_varios ?? null },
    { label: "Papelería", value: (i) => hist(i)?.gasto_papeleria ?? null },
    { label: "Sistema", value: (i) => hist(i)?.gasto_sistema ?? null },
    { label: "Internet", value: (i) => hist(i)?.gasto_internet ?? null },
  ];

  return (
    <AdminShell activeHref="/admin/finanzas" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <Link href="/admin/finanzas" className="text-[0.85rem] font-semibold text-admin-primary hover:underline">
        &larr; Volver a Estado de resultados
      </Link>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Comparativo anual {year}</h1>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">
        Los meses ya capturados y aprobados en el histórico usan esos números; los demás se calculan desde cortes, asistencia y gastos del panel. El
        desglose por categoría (Renta, Luz y Agua, etc.) solo existe para los meses capturados a mano en el histórico — para los demás se ve &ldquo;—&rdquo;
        aunque el total de Gastos sí es el real.
      </p>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block text-[0.82rem] font-semibold text-admin-ink">
          Año
          <input
            type="number"
            name="anio"
            defaultValue={year}
            className="mt-1 block w-28 rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
          />
        </label>
        <button type="submit" className="rounded-full border border-admin-border px-4 py-2 text-[0.82rem] font-semibold text-admin-ink">
          Ver
        </button>
      </form>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-admin-border bg-admin-surface">
        <table className="w-full min-w-[1100px] border-collapse text-[0.8rem]">
          <thead>
            <tr className="border-b border-admin-border bg-admin-bg">
              <th className="px-3 py-2.5 text-left font-medium text-admin-ink-soft">Concepto</th>
              {MONTH_NAMES.map((name) => (
                <th key={name} className="px-3 py-2.5 text-right font-display text-[0.8rem] font-bold text-admin-ink">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-admin-border">
              <td className="px-3 py-2 font-bold text-admin-ink">VENTAS</td>
              {months.map((m, i) => (
                <td key={m} className="px-3 py-2 text-right font-data tabular-nums text-admin-ink">
                  {fmtMoney(fin(i).sales)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-admin-border">
              <td className="px-3 py-2 font-bold text-admin-ink">COSTOS</td>
              {months.map((m, i) => (
                <td key={m} className="px-3 py-2 text-right font-data tabular-nums text-admin-ink">
                  {fmtMoney(fin(i).cogs)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-admin-border bg-admin-bg/60">
              <td className="px-3 py-2 font-bold text-admin-ink">UTILIDAD BRUTA</td>
              {months.map((m, i) => (
                <td key={m} className="px-3 py-2 text-right font-data font-bold tabular-nums text-admin-ink">
                  {fmtMoney(fin(i).gross)}
                </td>
              ))}
            </tr>
            <tr className="border-b border-admin-border bg-admin-bg/60">
              <td className="px-3 py-2 font-bold text-admin-ink">GASTOS</td>
              {months.map((m, i) => (
                <td key={m} className="px-3 py-2 text-right font-data font-bold tabular-nums text-admin-ink">
                  {fmtMoney(fin(i).operating)}
                </td>
              ))}
            </tr>
            <tr className="border-b-2 border-admin-border bg-admin-bg/60">
              <td className="px-3 py-2 font-bold text-admin-ink">UTILIDAD NETA O PÉRDIDA</td>
              {months.map((m, i) => {
                const value = fin(i).net;
                return (
                  <td key={m} className={`px-3 py-2 text-right font-data font-bold tabular-nums ${value < 0 ? "text-admin-bad-text" : "text-admin-ink"}`}>
                    {fmtMoney(value)}
                  </td>
                );
              })}
            </tr>

            <tr>
              <td className="px-3 py-2" colSpan={13}></td>
            </tr>

            {gastoRows.map((row) => (
              <tr key={row.label} className="border-b border-admin-border">
                <td className="px-3 py-2 text-admin-ink-soft">{row.label}</td>
                {months.map((m, i) => {
                  const value = row.value(i);
                  return (
                    <td key={m} className="px-3 py-2 text-right font-data tabular-nums text-admin-ink">
                      {value === null ? "—" : fmtMoney(value)}
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr className="border-b-2 border-admin-border bg-admin-bg/60">
              <td className="px-3 py-2 font-bold text-admin-ink">Total</td>
              {months.map((m, i) => (
                <td key={m} className="px-3 py-2 text-right font-data font-bold tabular-nums text-admin-ink">
                  {fmtMoney(fin(i).operating)}
                </td>
              ))}
            </tr>

            <tr>
              <td className="px-3 py-2" colSpan={13}></td>
            </tr>

            <tr>
              <td className="px-3 py-2 font-bold text-admin-ink">PÉRDIDAS MERMA</td>
              {months.map((m, i) => (
                <td key={m} className="px-3 py-2 text-right font-data tabular-nums text-admin-ink">
                  {fmtMoney(fin(i).shrinkage)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
