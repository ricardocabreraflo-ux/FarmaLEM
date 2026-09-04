import type { MonthlyFinancials } from "@/lib/financials";
import type { HistoricalIncomeStatement } from "@/lib/historical-financials";
import type { FixedExpenseCategory } from "@/lib/finance-movements";

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

interface GastoRow {
  label: string;
  value: (idx: number) => number | null;
}

export function AnnualComparisonTable({
  months,
  financialsByMonth,
  historicalByMonth,
  categoryTotalsByMonth,
}: {
  months: string[];
  financialsByMonth: MonthlyFinancials[];
  historicalByMonth: Map<string, HistoricalIncomeStatement>;
  /** Gastos fijos/variables capturados en Gastos fijos y variables (para meses sin captura manual en el histórico). */
  categoryTotalsByMonth?: Map<string, Partial<Record<FixedExpenseCategory, number>>>;
}) {
  const hist = (idx: number): HistoricalIncomeStatement | undefined => historicalByMonth.get(months[idx]);
  const fin = (idx: number): MonthlyFinancials => financialsByMonth[idx];
  const cat = (idx: number, key: FixedExpenseCategory): number | null => categoryTotalsByMonth?.get(months[idx])?.[key] ?? null;

  const gastoRows: GastoRow[] = [
    { label: "Renta", value: (i) => hist(i)?.gasto_renta ?? cat(i, "renta") },
    { label: "Luz y Agua", value: (i) => hist(i)?.gasto_luz_agua ?? cat(i, "luzAgua") },
    { label: "Bonos", value: (i) => hist(i)?.gasto_bonos ?? fin(i).bonuses },
    { label: "Sueldos", value: (i) => hist(i)?.gasto_sueldos ?? fin(i).salaries },
    { label: "Varios", value: (i) => hist(i)?.gasto_varios ?? cat(i, "varios") },
    { label: "Papelería", value: (i) => hist(i)?.gasto_papeleria ?? cat(i, "papeleria") },
    { label: "Sistema", value: (i) => hist(i)?.gasto_sistema ?? cat(i, "sistema") },
    { label: "Internet", value: (i) => hist(i)?.gasto_internet ?? cat(i, "internet") },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-admin-border bg-admin-surface">
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
  );
}
