import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listHistoricalIncomeStatements } from "@/lib/historical-financials";
import { monthlySales } from "@/lib/sales-report";
import { AdminShell } from "@/components/admin/AdminShell";
import { HistoricalIncomeStatementGrid } from "@/components/admin/HistoricalIncomeStatementGrid";

export const metadata: Metadata = { title: "Estados de resultados históricos" };
export const dynamic = "force-dynamic";

function monthsBetween(from: string, to: string): string[] {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  const months: string[] = [];
  let y = fy;
  let m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    months.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return months;
}

export default async function HistoricalFinancialsPage({ searchParams }: { searchParams: Promise<{ desde?: string; hasta?: string }> }) {
  const session = await requireAdminSession();
  const { desde, hasta } = await searchParams;
  const from = desde || "2026-01";
  const to = hasta || "2026-05";
  const months = monthsBetween(from, to);

  const [profile, employees, statements, sales] = await Promise.all([
    getProfileById(session.uid),
    listProfiles(),
    listHistoricalIncomeStatements(months),
    monthlySales(),
  ]);
  const employeeNames = Object.fromEntries(employees.map((e) => [e.id, e.full_name]));
  const salesByMonth = Object.fromEntries(sales.map((s) => [s.month, s.total]));

  return (
    <AdminShell activeHref="/admin/finanzas" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <Link href="/admin/finanzas" className="text-[0.85rem] font-semibold text-admin-primary hover:underline">
        &larr; Volver a Estado de resultados
      </Link>
      <h1 className="mt-2 font-display text-2xl text-admin-ink">Estados de resultados históricos</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">
        Captura a mano los meses de antes del panel (como el Excel viejo). Guarda mientras lo revisas; cuando le des &ldquo;Aprobar&rdquo;, ese mes queda
        fijo y ya no se puede editar.
      </p>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
        <label className="block text-[0.82rem] font-semibold text-admin-ink">
          Desde
          <input
            type="month"
            name="desde"
            defaultValue={from}
            className="mt-1 block rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
          />
        </label>
        <label className="block text-[0.82rem] font-semibold text-admin-ink">
          Hasta
          <input
            type="month"
            name="hasta"
            defaultValue={to}
            className="mt-1 block rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
          />
        </label>
        <button type="submit" className="rounded-full border border-admin-border px-4 py-2 text-[0.82rem] font-semibold text-admin-ink">
          Ver
        </button>
      </form>

      <div className="mt-5">
        <HistoricalIncomeStatementGrid
          months={months}
          initialStatements={months.map((m) => statements.get(m) ?? null)}
          employeeNames={employeeNames}
          salesByMonth={salesByMonth}
        />
      </div>
    </AdminShell>
  );
}
