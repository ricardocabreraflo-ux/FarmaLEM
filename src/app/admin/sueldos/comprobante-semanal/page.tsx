import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { listProfiles } from "@/lib/profiles";
import { listAttendanceForRange } from "@/lib/attendance";
import { listBonusWeeksStarting, listBonusTiers, earnedBonus } from "@/lib/bonuses";
import { mexicoCityToday } from "@/lib/time-clock";
import { addDays, mondayOf } from "@/lib/dates";
import { PrintButton } from "@/components/admin/PrintButton";

export const metadata: Metadata = { title: "Comprobante de pago semanal" };
export const dynamic = "force-dynamic";

const PAID_STATUSES = new Set(["Asistió", "Cubrió turno"]);

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function dayLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-MX", { weekday: "short", day: "2-digit", month: "short" });
}

function rangeLabel(monday: string, sunday: string) {
  const start = new Date(`${monday}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
  const end = new Date(`${sunday}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  return `${start} al ${end}`;
}

export default async function ComprobanteSemanalPage({ searchParams }: { searchParams: Promise<{ inicio?: string }> }) {
  await requireAdminSession();
  const { inicio } = await searchParams;
  const monday = mondayOf(inicio || mexicoCityToday());
  const sunday = addDays(monday, 6);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const [employees, attendance, weeks] = await Promise.all([listProfiles(), listAttendanceForRange(monday, sunday), listBonusWeeksStarting(monday)]);
  const activeEmployees = employees
    .filter((e) => e.role === "employee" && e.active)
    .sort((a, b) => (a.shift === "Matutino" ? -1 : b.shift === "Matutino" ? 1 : 0));

  const months = Array.from(new Set(weeks.map((w) => w.month)));
  const tiersByMonth = new Map(await Promise.all(months.map(async (m) => [m, await listBonusTiers(m)] as const)));

  return (
    <main className="mx-auto max-w-[760px] bg-white px-6 py-10 text-slate-900">
      <style>{`@media print { .print\\:hidden { display: none !important; } body { background: #fff; } }`}</style>

      <Link href="/admin/sueldos" className="text-[0.85rem] font-semibold text-emerald-700 print:hidden">
        &larr; Volver a Sueldos
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-xl text-slate-900">FarmaLEM &middot; Pago semanal &middot; {rangeLabel(monday, sunday)}</h1>
        <PrintButton />
      </div>

      <div className="mt-4 flex items-center gap-3 print:hidden">
        <Link href={`/admin/sueldos/comprobante-semanal?inicio=${addDays(monday, -7)}`} className="rounded-full border border-slate-300 px-4 py-2 text-[0.82rem] font-semibold text-slate-700">
          &larr; Semana anterior
        </Link>
        <Link href="/admin/sueldos/comprobante-semanal" className="rounded-full border border-slate-300 px-4 py-2 text-[0.82rem] font-semibold text-slate-700">
          Semana actual
        </Link>
        <Link href={`/admin/sueldos/comprobante-semanal?inicio=${addDays(monday, 7)}`} className="rounded-full border border-slate-300 px-4 py-2 text-[0.82rem] font-semibold text-slate-700">
          Semana siguiente &rarr;
        </Link>
      </div>

      {activeEmployees.length === 0 ? (
        <p className="mt-8 text-slate-500">No hay empleados activos.</p>
      ) : (
        activeEmployees.map((e) => {
          const empDays = days.map((d) => attendance.find((a) => a.employee_id === e.id && a.work_date === d) ?? null);
          const salary = empDays.reduce((sum, a) => sum + (a && PAID_STATUSES.has(a.status) ? a.rate : 0), 0);
          const empWeek = weeks.find((w) => w.employee_id === e.id) ?? null;
          const tiers = empWeek ? (tiersByMonth.get(empWeek.month) ?? []) : [];
          const bonus = empWeek ? earnedBonus(empWeek, tiers) : 0;

          return (
            <section key={e.id} className="mt-8 border-t-2 border-emerald-700 pt-4 [break-inside:avoid]">
              <h3 className="font-display text-base text-slate-900">
                {e.full_name} &middot; {e.shift}
              </h3>
              <table className="mt-3 w-full text-left text-[0.86rem]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 font-medium">Día</th>
                    <th className="py-2 font-medium">Estado</th>
                    <th className="py-2 text-right font-medium">Pago</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((d, i) => {
                    const a = empDays[i];
                    const paid = a ? PAID_STATUSES.has(a.status) : false;
                    return (
                      <tr key={d} className="border-b border-slate-200">
                        <td className="py-1.5 capitalize text-slate-900">{dayLabel(d)}</td>
                        <td className="py-1.5 text-slate-600">{a?.status ?? "—"}</td>
                        <td className="py-1.5 text-right font-data tabular-nums text-slate-900">{paid ? fmtMoney(a!.rate) : "—"}</td>
                      </tr>
                    );
                  })}
                  <tr className="border-b border-slate-200">
                    <td colSpan={2} className="py-2 font-semibold text-slate-900">
                      Sueldo de la semana
                    </td>
                    <td className="py-2 text-right font-data tabular-nums font-semibold text-slate-900">{fmtMoney(salary)}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td colSpan={2} className="py-2 text-slate-900">
                      {empWeek ? `Bono semanal (${fmtMoney(empWeek.sales)} en ventas${empWeek.absent ? " · con falta" : ""})` : "Bono semanal (sin bono capturado)"}
                    </td>
                    <td className="py-2 text-right font-data tabular-nums text-slate-900">{fmtMoney(bonus)}</td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="py-2 font-bold text-slate-900">
                      Total a cobrar
                    </td>
                    <td className="py-2 text-right font-data tabular-nums font-bold text-slate-900">{fmtMoney(salary + bonus)}</td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-14 flex justify-between gap-8">
                <span className="w-2/5 border-t border-slate-400 pt-1.5 text-center text-[0.8rem] text-slate-500">Firma de empleada</span>
                <span className="w-2/5 border-t border-slate-400 pt-1.5 text-center text-[0.8rem] text-slate-500">Firma de Administración</span>
              </div>
            </section>
          );
        })
      )}
    </main>
  );
}
