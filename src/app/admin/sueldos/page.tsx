import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listAttendanceForMonth } from "@/lib/attendance";
import { listBonusWeeks, listBonusTiers, earnedBonus } from "@/lib/bonuses";
import { listPayrollStatus } from "@/lib/payroll";
import { AdminShell } from "@/components/admin/AdminShell";
import { PayrollList, type PayrollRow } from "@/components/admin/PayrollList";

export const metadata: Metadata = { title: "Sueldos y salarios" };
export const dynamic = "force-dynamic";

const PAID_STATUSES = new Set(["Asistió", "Cubrió turno"]);

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export default async function SueldosPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireAdminSession();
  const { mes } = await searchParams;
  const month = mes || new Date().toISOString().slice(0, 7);

  const [profile, employees, attendance, weeks, tiers, payroll] = await Promise.all([
    getProfileById(session.uid),
    listProfiles(),
    listAttendanceForMonth(month),
    listBonusWeeks(month),
    listBonusTiers(month),
    listPayrollStatus(month),
  ]);

  const activeEmployees = employees.filter((e) => e.role === "employee" && e.active);
  const paidByEmployee = new Map(payroll.map((p) => [p.employee_id, p.status === "Pagado"]));

  const rows: PayrollRow[] = activeEmployees.map((e) => {
    const list = attendance.filter((a) => a.employee_id === e.id);
    const daysWorked = list.filter((a) => PAID_STATUSES.has(a.status)).length;
    const misses = list.filter((a) => a.status === "Falta").length;
    const salary = list.filter((a) => PAID_STATUSES.has(a.status)).reduce((sum, a) => sum + a.rate, 0);
    const bonus = weeks.filter((w) => w.employee_id === e.id).reduce((sum, w) => sum + earnedBonus(w, tiers), 0);
    return { employeeId: e.id, name: e.full_name, daysWorked, misses, salary, bonus, total: salary + bonus, paid: paidByEmployee.get(e.id) ?? false };
  });

  const totalSalaries = rows.reduce((sum, r) => sum + r.salary, 0);
  const totalBonuses = rows.reduce((sum, r) => sum + r.bonus, 0);
  const totalToPay = rows.reduce((sum, r) => sum + r.total, 0);

  return (
    <AdminShell activeHref="/admin/sueldos" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Sueldos y salarios</h1>
        <Link href={`/admin/sueldos/comprobante?mes=${month}`} className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink">
          Comprobante mensual
        </Link>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Calculado desde turnos pagados y bonos semanales.</p>

      <form method="get" className="mt-4 flex items-end gap-3">
        <label className="block max-w-[220px] flex-1 text-[0.85rem] font-semibold text-admin-ink">
          Mes
          <input type="month" name="mes" defaultValue={month} className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary" />
        </label>
        <button type="submit" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink">
          Ver
        </button>
      </form>

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Sueldos</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{fmtMoney(totalSalaries)}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Bonos</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{fmtMoney(totalBonuses)}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Total a pagar</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{fmtMoney(totalToPay)}</p>
        </div>
      </section>

      <div className="mt-6">
        <PayrollList rows={rows} month={month} />
      </div>
    </AdminShell>
  );
}
