import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { mexicoCityToday } from "@/lib/dates";
import { getProfileById } from "@/lib/profiles";
import { getMonthlyFinancials } from "@/lib/financials";
import { listHistoricalIncomeStatements } from "@/lib/historical-financials";
import { listFixedExpenseCategoryTotals } from "@/lib/finance-movements";
import { AdminShell } from "@/components/admin/AdminShell";
import { AnnualComparisonTable } from "@/components/admin/AnnualComparisonTable";

export const metadata: Metadata = { title: "Comparativo anual" };
export const dynamic = "force-dynamic";

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default async function AnnualComparisonPage({ searchParams }: { searchParams: Promise<{ anio?: string }> }) {
  const session = await requireAdminSession();
  const { anio } = await searchParams;
  const year = anio || mexicoCityToday().slice(0, 4);
  const months = MONTH_NAMES.map((_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);

  const [profile, financialsByMonth, historicalByMonth, categoryTotalsByMonth] = await Promise.all([
    getProfileById(session.uid),
    Promise.all(months.map((m) => getMonthlyFinancials(m))),
    listHistoricalIncomeStatements(months),
    listFixedExpenseCategoryTotals(months),
  ]);

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
        desglose por categoría (Renta, Luz y Agua, etc.) toma el histórico cuando existe, o lo capturado en Gastos fijos y variables — si una categoría no
        se ha registrado en ninguno de los dos, se ve &ldquo;—&rdquo; aunque el total de Gastos sí sea el real.
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

      <div className="mt-5">
        <AnnualComparisonTable
          months={months}
          financialsByMonth={financialsByMonth}
          historicalByMonth={historicalByMonth}
          categoryTotalsByMonth={categoryTotalsByMonth}
        />
      </div>
    </AdminShell>
  );
}
