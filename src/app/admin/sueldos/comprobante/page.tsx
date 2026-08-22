import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { listProfiles } from "@/lib/profiles";
import { listAttendanceForMonth } from "@/lib/attendance";
import { listBonusWeeks, listBonusTiers, earnedBonus, targetForWeek } from "@/lib/bonuses";
import { PrintButton } from "@/components/admin/PrintButton";

export const metadata: Metadata = { title: "Comprobante de sueldo y bono" };
export const dynamic = "force-dynamic";

const PAID_STATUSES = new Set(["Asistió", "Cubrió turno"]);

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export default async function ComprobantePage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await requireAdminSession();
  const { mes } = await searchParams;
  const month = mes || new Date().toISOString().slice(0, 7);

  const [employees, attendance, weeks, tiers] = await Promise.all([
    listProfiles(),
    listAttendanceForMonth(month),
    listBonusWeeks(month),
    listBonusTiers(month),
  ]);
  const activeEmployees = employees.filter((e) => e.role === "employee" && e.active);

  return (
    <main className="mx-auto max-w-[760px] px-6 py-10">
      <style>{`@media print { .print\\:hidden { display: none !important; } }`}</style>

      <Link href={`/admin/sueldos?mes=${month}`} className="text-[0.85rem] font-semibold text-admin-primary print:hidden">
        &larr; Volver a Sueldos
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-xl text-admin-ink">FarmaLEM &middot; Pago de sueldo y bono</h1>
        <PrintButton />
      </div>
      <p className="mt-1 font-semibold text-admin-ink">{monthLabel(month)}</p>

      {activeEmployees.map((e) => {
        const salary = attendance.filter((a) => a.employee_id === e.id && PAID_STATUSES.has(a.status)).reduce((sum, a) => sum + a.rate, 0);
        const empWeeks = weeks.filter((w) => w.employee_id === e.id);
        const bonus = empWeeks.reduce((sum, w) => sum + earnedBonus(w, tiers), 0);

        return (
          <section key={e.id} className="mt-8 border-t-2 border-admin-primary pt-4 [break-inside:avoid]">
            <h3 className="font-display text-base text-admin-ink">
              {e.full_name} &middot; {e.shift}
            </h3>
            <table className="mt-3 w-full text-left text-[0.86rem]">
              <thead>
                <tr className="border-b border-admin-border text-admin-ink-soft">
                  <th className="py-2 font-medium">Semana</th>
                  <th className="py-2 text-right font-medium">Ventas</th>
                  <th className="py-2 text-right font-medium">Meta alcanzada</th>
                  <th className="py-2 text-right font-medium">Bono</th>
                </tr>
              </thead>
              <tbody>
                {empWeeks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-3 text-admin-ink-soft">
                      Sin bonos registrados
                    </td>
                  </tr>
                ) : (
                  empWeeks.map((w) => {
                    const b = earnedBonus(w, tiers);
                    return (
                      <tr key={w.id} className="border-b border-admin-border">
                        <td className="py-2 text-admin-ink">
                          Semana {w.week}
                          {w.absent ? " · Falta" : ""}
                        </td>
                        <td className="py-2 text-right font-data tabular-nums text-admin-ink">{fmtMoney(w.sales)}</td>
                        <td className="py-2 text-right font-data tabular-nums text-admin-ink-soft">{b > 0 ? fmtMoney(targetForWeek(w, tiers)) : "—"}</td>
                        <td className="py-2 text-right font-data tabular-nums text-admin-ink">{fmtMoney(b)}</td>
                      </tr>
                    );
                  })
                )}
                <tr className="border-b border-admin-border">
                  <td colSpan={3} className="py-2 font-semibold text-admin-ink">
                    Sueldo
                  </td>
                  <td className="py-2 text-right font-data tabular-nums font-semibold text-admin-ink">{fmtMoney(salary)}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-2 font-bold text-admin-ink">
                    Total sueldo + bono
                  </td>
                  <td className="py-2 text-right font-data tabular-nums font-bold text-admin-ink">{fmtMoney(salary + bonus)}</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-14 flex justify-between gap-8">
              <span className="w-2/5 border-t border-admin-ink-soft pt-1.5 text-center text-[0.8rem] text-admin-ink-soft">Firma de empleada</span>
              <span className="w-2/5 border-t border-admin-ink-soft pt-1.5 text-center text-[0.8rem] text-admin-ink-soft">Firma de Administración</span>
            </div>
          </section>
        );
      })}
    </main>
  );
}
