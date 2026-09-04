import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { mexicoCityToday } from "@/lib/dates";
import { getProfileById } from "@/lib/profiles";
import { listFinanceMovementsForMonth, listFixedExpenseCategoryTotals } from "@/lib/finance-movements";
import { getMonthlyFinancials } from "@/lib/financials";
import { listHistoricalIncomeStatements } from "@/lib/historical-financials";
import { AdminShell } from "@/components/admin/AdminShell";
import { MonthPicker } from "@/components/admin/MonthPicker";
import { AnnualComparisonTable } from "@/components/admin/AnnualComparisonTable";

export const metadata: Metadata = { title: "Estado de resultados" };
export const dynamic = "force-dynamic";

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export default async function FinanzasPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireAdminSession();
  const { mes } = await searchParams;
  const month = mes || mexicoCityToday().slice(0, 7);
  const year = month.slice(0, 4);
  const yearMonths = MONTH_NAMES.map((_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);

  const [profile, movements, financials, yearFinancialsByMonth, yearHistoricalByMonth, yearCategoryTotalsByMonth] = await Promise.all([
    getProfileById(session.uid),
    listFinanceMovementsForMonth(month),
    getMonthlyFinancials(month),
    Promise.all(yearMonths.map((m) => getMonthlyFinancials(m))),
    listHistoricalIncomeStatements(yearMonths),
    listFixedExpenseCategoryTotals(yearMonths),
  ]);
  const {
    sales,
    otherIncome,
    purchaseCosts,
    manualCosts,
    gross,
    cashExpenses,
    manualFixedExpenses,
    manualVariableExpenses,
    salaries,
    bonuses,
    extraBonusesTotal,
    operating,
    shrinkage,
    netBeforeShrinkage,
    net,
  } = financials;

  return (
    <AdminShell activeHref="/admin/finanzas" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Estado de resultados</h1>
        <Link
          href={`/admin/finanzas/nuevo?mes=${month}`}
          className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          + Movimiento financiero
        </Link>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Resumen mensual alimentado por cortes, mercancía, asistencia, bonos y gastos.</p>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/admin/finanzas/historico" className="inline-block text-[0.82rem] font-semibold text-admin-primary hover:underline">
          Estados de resultados de meses anteriores (enero–mayo 2026) &rarr;
        </Link>
        <Link href="/admin/finanzas/anual" className="inline-block text-[0.82rem] font-semibold text-admin-primary hover:underline">
          Comparativo anual (los 12 meses juntos) &rarr;
        </Link>
      </div>

      <MonthPicker month={month} basePath="/admin/finanzas" />

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Ingresos</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{fmtMoney(sales + otherIncome)}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Utilidad bruta</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{fmtMoney(gross)}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Gastos operativos</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{fmtMoney(operating)}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Resultado neto</span>
          <p className={`mt-1 font-display text-lg ${net >= 0 ? "text-admin-ink" : "text-admin-bad-text"}`}>{fmtMoney(net)}</p>
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
          <h2 className="border-b border-admin-border px-5 py-3 font-display text-base text-admin-ink">Estado de resultados &middot; {monthLabel(month)}</h2>
          <table className="w-full text-left text-[0.84rem]">
            <tbody>
              <Row label="Ventas de cortes aprobados" value={sales} />
              <Row label="Otros ingresos" value={otherIncome} />
              <Row label="Ingresos totales" value={sales + otherIncome} bold />
              <Row label="(−) Mercancía recibida" value={purchaseCosts} />
              <Row label="(−) Otros costos de venta" value={manualCosts} />
              <Row label="Utilidad bruta" value={gross} bold />
              <Row label="(−) Sueldos calculados" value={salaries} />
              <Row label="(−) Bonos semanales" value={bonuses} />
              <Row label="(−) Bonos extraordinarios" value={extraBonusesTotal} />
              <Row label="(−) Gastos desde caja" value={cashExpenses} />
              <Row label="(−) Gastos fijos" value={manualFixedExpenses} />
              <Row label="(−) Gastos variables" value={manualVariableExpenses} />
              <Row label="Resultado neto antes de merma" value={netBeforeShrinkage} bold />
              <Row label="(−) Pérdidas por merma" value={shrinkage} />
              <Row label="Resultado neto" value={net} bold last />
            </tbody>
          </table>
        </section>

        <section className="overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
          <h2 className="border-b border-admin-border px-5 py-3 font-display text-base text-admin-ink">Movimientos manuales</h2>
          {movements.length === 0 ? (
            <p className="px-5 py-8 text-center text-admin-ink-soft">Sin movimientos manuales</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[0.84rem]">
                <thead>
                  <tr className="border-b border-admin-border text-admin-ink-soft">
                    <th className="px-4 py-2.5 font-medium">Fecha</th>
                    <th className="px-4 py-2.5 font-medium">Tipo</th>
                    <th className="px-4 py-2.5 font-medium">Concepto</th>
                    <th className="px-4 py-2.5 text-right font-medium">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className="border-b border-admin-border last:border-0">
                      <td className="px-4 py-2.5 text-admin-ink-soft">{new Date(`${m.movement_date}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}</td>
                      <td className="px-4 py-2.5 text-admin-ink-soft">{m.type}</td>
                      <td className="px-4 py-2.5 text-admin-ink">{m.concept}</td>
                      <td className="px-4 py-2.5 text-right font-data tabular-nums text-admin-ink">{fmtMoney(m.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <p className="mt-5 text-[0.8rem] text-admin-ink-soft">
        Los pagos a proveedores son movimientos de efectivo; el costo se toma de Recepción de mercancía para evitar duplicarlo.
      </p>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg text-admin-ink">Comparativo anual {year}</h2>
          <Link href={`/admin/finanzas/anual?anio=${year}`} className="text-[0.82rem] font-semibold text-admin-primary hover:underline">
            Ver en página aparte para imprimir &rarr;
          </Link>
        </div>
        <p className="mt-1 text-[0.8rem] text-admin-ink-soft">
          Los meses ya capturados y aprobados en el histórico usan esos números; los demás se calculan desde cortes, asistencia y gastos del panel.
        </p>
        <div className="mt-3">
          <AnnualComparisonTable
            months={yearMonths}
            financialsByMonth={yearFinancialsByMonth}
            historicalByMonth={yearHistoricalByMonth}
            categoryTotalsByMonth={yearCategoryTotalsByMonth}
          />
        </div>
      </section>
    </AdminShell>
  );
}

function Row({ label, value, bold, last }: { label: string; value: number; bold?: boolean; last?: boolean }) {
  return (
    <tr className={last ? "" : "border-b border-admin-border"}>
      <td className={`px-4 py-2 ${bold ? "font-bold text-admin-ink" : "text-admin-ink-soft"}`}>{label}</td>
      <td className={`px-4 py-2 text-right font-data tabular-nums ${bold ? "font-bold text-admin-ink" : "text-admin-ink"}`}>{fmtMoney(value)}</td>
    </tr>
  );
}
