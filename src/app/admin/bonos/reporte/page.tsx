import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { mexicoCityToday } from "@/lib/dates";
import { listProfiles } from "@/lib/profiles";
import { listBonusTiers, listBonusWeeks, earnedBonus, targetForWeek } from "@/lib/bonuses";
import { PrintButton } from "@/components/admin/PrintButton";
import { MonthPicker } from "@/components/admin/MonthPicker";

export const metadata: Metadata = { title: "Reporte de bonos semanales" };
export const dynamic = "force-dynamic";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export default async function ReporteBonosPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await requireAdminSession();
  const { mes } = await searchParams;
  const month = mes || mexicoCityToday().slice(0, 7);

  const [employees, weeksDesc, tiers] = await Promise.all([listProfiles(), listBonusWeeks(month), listBonusTiers(month)]);
  const nameById = new Map(employees.map((e) => [e.id, e.full_name]));
  const weeks = [...weeksDesc].sort((a, b) => a.week - b.week || a.employee_id.localeCompare(b.employee_id));

  const totalEarned = weeks.reduce((s, w) => s + earnedBonus(w, tiers), 0);

  return (
    <main className="mx-auto max-w-[900px] bg-white px-6 py-10 text-slate-900">
      <style>{`@media print { .print\\:hidden { display: none !important; } body { background: #fff; } }`}</style>

      <Link href={`/admin/bonos?mes=${month}`} className="text-[0.85rem] font-semibold text-emerald-700 print:hidden">
        &larr; Volver a Bonos semanales
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-xl text-slate-900 capitalize">FarmaLEM &middot; Bonos semanales &middot; {monthLabel(month)}</h1>
        <PrintButton />
      </div>

      <MonthPicker month={month} basePath="/admin/bonos/reporte" className="mt-4 flex items-end gap-3 print:hidden" />

      <table className="mt-6 w-full border-collapse text-[0.85rem]">
        <thead>
          <tr className="border-b-2 border-slate-300 text-left text-slate-500">
            <th className="py-2 pr-3 font-medium">Semana</th>
            <th className="py-2 pr-3 font-medium">Empleado</th>
            <th className="py-2 pr-3 text-right font-medium">Ventas</th>
            <th className="py-2 pr-3 text-right font-medium">Meta</th>
            <th className="py-2 text-right font-medium">Bono</th>
          </tr>
        </thead>
        <tbody>
          {weeks.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-4 text-slate-500">
                Sin semanas calculadas ese mes.
              </td>
            </tr>
          ) : (
            weeks.map((w) => {
              const bonus = earnedBonus(w, tiers);
              return (
                <tr key={w.id} className="border-b border-slate-200">
                  <td className="py-1.5 pr-3 text-slate-500">Semana {w.week}</td>
                  <td className="py-1.5 pr-3 font-semibold text-slate-900">{nameById.get(w.employee_id) ?? "Desconocido"}</td>
                  <td className="py-1.5 pr-3 text-right font-data tabular-nums text-slate-900">{fmtMoney(w.sales)}</td>
                  <td className="py-1.5 pr-3 text-right font-data tabular-nums text-slate-600">{bonus > 0 ? fmtMoney(targetForWeek(w, tiers)) : "—"}</td>
                  <td className="py-1.5 text-right font-data tabular-nums text-slate-900">{fmtMoney(bonus)}</td>
                </tr>
              );
            })
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300 font-bold text-slate-900">
            <td className="py-2 pr-3" colSpan={4}>
              Total del mes
            </td>
            <td className="py-2 text-right font-data tabular-nums">{fmtMoney(totalEarned)}</td>
          </tr>
        </tfoot>
      </table>

      <section className="mt-10">
        <h2 className="font-display text-base text-slate-900">Firmas de recibido</h2>
        <p className="mt-1 text-[0.82rem] text-slate-500">Solo semanas donde sí hubo bono.</p>
        <div className="mt-4 flex flex-col gap-10">
          {weeks
            .filter((w) => earnedBonus(w, tiers) > 0)
            .map((w) => (
              <div key={w.id} className="flex items-end justify-between gap-8 [break-inside:avoid]">
                <div className="text-[0.85rem] text-slate-700">
                  Semana {w.week} &middot; {nameById.get(w.employee_id) ?? "Desconocido"} &middot; {fmtMoney(earnedBonus(w, tiers))}
                </div>
                <span className="w-2/5 border-t border-slate-400 pt-1.5 text-center text-[0.78rem] text-slate-500">Firma</span>
              </div>
            ))}
          {weeks.filter((w) => earnedBonus(w, tiers) > 0).length === 0 && <p className="text-[0.85rem] text-slate-500">Ninguna semana alcanzó bono este mes.</p>}
        </div>
      </section>
    </main>
  );
}
