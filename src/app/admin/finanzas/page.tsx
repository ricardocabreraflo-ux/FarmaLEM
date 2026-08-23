import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listCuts } from "@/lib/cuts";
import { listWithdrawals } from "@/lib/withdrawals";
import { listPurchases } from "@/lib/purchases";
import { listFinanceMovementsForMonth } from "@/lib/finance-movements";
import { listAttendanceForMonth } from "@/lib/attendance";
import { listBonusWeeks, listBonusTiers, earnedBonus } from "@/lib/bonuses";
import { listExtraBonuses } from "@/lib/extra-bonuses";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Estado de resultados" };
export const dynamic = "force-dynamic";

const PAID_ATTENDANCE = new Set(["Asistió", "Cubrió turno"]);

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
  const month = mes || new Date().toISOString().slice(0, 7);

  const [profile, employees, allCuts, allWithdrawals, allPurchases, movements, attendance, weeks, tiers, extraBonuses] = await Promise.all([
    getProfileById(session.uid),
    listProfiles(),
    listCuts(),
    listWithdrawals(),
    listPurchases(),
    listFinanceMovementsForMonth(month),
    listAttendanceForMonth(month),
    listBonusWeeks(month),
    listBonusTiers(month),
    listExtraBonuses(),
  ]);
  const monthExtraBonuses = extraBonuses.filter((b) => b.month === month);

  const approvedCuts = allCuts.filter((c) => c.status === "Aprobado" && c.cut_date.startsWith(month));
  const authorizedWithdrawals = allWithdrawals.filter((w) => w.authorized_by && w.withdrawal_date.startsWith(month));
  const monthPurchases = allPurchases.filter((p) => p.purchase_date.startsWith(month));
  const activeEmployees = employees.filter((e) => e.role === "employee" && e.active);

  const sales = approvedCuts.reduce((sum, c) => sum + c.total, 0);
  const otherIncome = movements.filter((m) => m.type === "Ingreso").reduce((sum, m) => sum + m.amount, 0);
  const purchaseCosts = monthPurchases.reduce((sum, p) => sum + p.quantity * p.cost, 0);
  const manualCosts = movements.filter((m) => m.type === "Costo de venta").reduce((sum, m) => sum + m.amount, 0);
  const cogs = purchaseCosts + manualCosts;
  const cashExpenses = authorizedWithdrawals.filter((w) => w.type === "Gasto" || w.type === "Otro").reduce((sum, w) => sum + w.amount, 0);
  const manualExpenses = movements.filter((m) => m.type === "Gasto operativo").reduce((sum, m) => sum + m.amount, 0);
  const salaries = activeEmployees.reduce(
    (sum, e) => sum + attendance.filter((a) => a.employee_id === e.id && PAID_ATTENDANCE.has(a.status)).reduce((s, a) => s + a.rate, 0),
    0
  );
  const bonuses = weeks.reduce((sum, w) => sum + earnedBonus(w, tiers), 0);
  const extraBonusesTotal = monthExtraBonuses.reduce((sum, b) => sum + b.amount, 0);
  const shrinkage = movements.filter((m) => m.type === "Merma").reduce((sum, m) => sum + m.amount, 0);

  const gross = sales + otherIncome - cogs;
  const operating = cashExpenses + manualExpenses + salaries + bonuses + extraBonusesTotal;
  const netBeforeShrinkage = gross - operating;
  const net = netBeforeShrinkage - shrinkage;

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

      <form method="get" className="mt-4 flex items-end gap-3">
        <label className="block max-w-[220px] flex-1 text-[0.85rem] font-semibold text-admin-ink">
          Mes
          <input type="month" name="mes" defaultValue={month} className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary" />
        </label>
        <button type="submit" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink">
          Ver
        </button>
      </form>

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
              <Row label="(−) Otros gastos operativos" value={manualExpenses} />
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
