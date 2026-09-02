import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { mexicoCityToday } from "@/lib/dates";
import { listProfiles } from "@/lib/profiles";
import { listCutsForMonth } from "@/lib/cuts";
import { listWithdrawalsForMonth } from "@/lib/withdrawals";
import { PrintButton } from "@/components/admin/PrintButton";
import { MonthPicker } from "@/components/admin/MonthPicker";

export const metadata: Metadata = { title: "Reporte mensual de cortes" };
export const dynamic = "force-dynamic";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { weekday: "short", day: "2-digit", month: "short" });
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export default async function ReporteCortesPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await requireAdminSession();
  const { mes } = await searchParams;
  const month = mes || mexicoCityToday().slice(0, 7);

  const [employees, cuts, withdrawals] = await Promise.all([listProfiles(), listCutsForMonth(month), listWithdrawalsForMonth(month)]);
  const nameById = new Map(employees.map((e) => [e.id, e.full_name]));

  const payrollByKey = new Map<string, number>();
  for (const w of withdrawals) {
    if (w.type !== "Nómina") continue;
    const key = `${w.withdrawal_date}-${w.shift}`;
    payrollByKey.set(key, (payrollByKey.get(key) ?? 0) + w.amount);
  }

  const totalVentas = cuts.reduce((s, c) => s + c.total, 0);
  const totalEfectivo = cuts.reduce((s, c) => s + c.cash, 0);
  const totalTarjeta = cuts.reduce((s, c) => s + c.card, 0);
  const totalNomina = withdrawals.filter((w) => w.type === "Nómina").reduce((s, w) => s + w.amount, 0);
  const totalSalidas = withdrawals.reduce((s, w) => s + w.amount, 0);

  return (
    <main className="mx-auto max-w-[960px] bg-white px-6 py-10 text-slate-900">
      <style>{`@media print { .print\\:hidden { display: none !important; } @page { size: landscape; } body { background: #fff; } }`}</style>

      <Link href={`/admin/cortes?mes=${month}`} className="text-[0.85rem] font-semibold text-emerald-700 print:hidden">
        &larr; Volver a Cortes
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-xl text-slate-900 capitalize">FarmaLEM &middot; Reporte de cortes &middot; {monthLabel(month)}</h1>
        <PrintButton />
      </div>

      <MonthPicker month={month} basePath="/admin/cortes/reporte" className="mt-4 flex items-end gap-3 print:hidden" />

      <section className="mt-6">
        <h2 className="font-display text-base text-slate-900">Cortes</h2>
        <table className="mt-2 w-full border-collapse text-[0.82rem]">
          <thead>
            <tr className="border-b-2 border-slate-300 text-left text-slate-500">
              <th className="py-2 pr-3 font-medium">Fecha</th>
              <th className="py-2 pr-3 font-medium">Turno</th>
              <th className="py-2 pr-3 font-medium">Empleado</th>
              <th className="py-2 pr-3 text-right font-medium">Venta</th>
              <th className="py-2 pr-3 text-right font-medium">Efectivo</th>
              <th className="py-2 pr-3 text-right font-medium">Tarjeta</th>
              <th className="py-2 text-right font-medium">Nómina</th>
            </tr>
          </thead>
          <tbody>
            {cuts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-4 text-slate-500">
                  Sin cortes ese mes.
                </td>
              </tr>
            ) : (
              cuts.map((c) => {
                const nomina = payrollByKey.get(`${c.cut_date}-${c.shift}`) ?? 0;
                return (
                  <tr key={c.id} className="border-b border-slate-200">
                    <td className="py-1.5 pr-3 text-slate-500 capitalize">{fmtDate(c.cut_date)}</td>
                    <td className="py-1.5 pr-3 text-slate-500">{c.shift}</td>
                    <td className="py-1.5 pr-3 font-semibold text-slate-900">{nameById.get(c.employee_id) ?? "Desconocido"}</td>
                    <td className="py-1.5 pr-3 text-right font-data tabular-nums text-slate-900">{fmtMoney(c.total)}</td>
                    <td className="py-1.5 pr-3 text-right font-data tabular-nums text-slate-600">{fmtMoney(c.cash)}</td>
                    <td className="py-1.5 pr-3 text-right font-data tabular-nums text-slate-600">{fmtMoney(c.card)}</td>
                    <td className="py-1.5 text-right font-data tabular-nums text-slate-600">{nomina > 0 ? fmtMoney(nomina) : "—"}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 font-bold text-slate-900">
              <td className="py-2 pr-3" colSpan={3}>
                Total del mes
              </td>
              <td className="py-2 pr-3 text-right font-data tabular-nums">{fmtMoney(totalVentas)}</td>
              <td className="py-2 pr-3 text-right font-data tabular-nums">{fmtMoney(totalEfectivo)}</td>
              <td className="py-2 pr-3 text-right font-data tabular-nums">{fmtMoney(totalTarjeta)}</td>
              <td className="py-2 text-right font-data tabular-nums">{fmtMoney(totalNomina)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-base text-slate-900">Salidas de efectivo</h2>
        <table className="mt-2 w-full border-collapse text-[0.82rem]">
          <thead>
            <tr className="border-b-2 border-slate-300 text-left text-slate-500">
              <th className="py-2 pr-3 font-medium">Fecha</th>
              <th className="py-2 pr-3 font-medium">Turno</th>
              <th className="py-2 pr-3 font-medium">Tipo</th>
              <th className="py-2 pr-3 font-medium">Concepto</th>
              <th className="py-2 text-right font-medium">Monto</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-slate-500">
                  Sin salidas ese mes.
                </td>
              </tr>
            ) : (
              withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-slate-200">
                  <td className="py-1.5 pr-3 text-slate-500 capitalize">{fmtDate(w.withdrawal_date)}</td>
                  <td className="py-1.5 pr-3 text-slate-500">{w.shift}</td>
                  <td className="py-1.5 pr-3 text-slate-500">{w.type}</td>
                  <td className="py-1.5 pr-3 text-slate-900">{w.concept}</td>
                  <td className="py-1.5 text-right font-data tabular-nums text-slate-900">{fmtMoney(w.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 font-bold text-slate-900">
              <td className="py-2 pr-3" colSpan={4}>
                Total del mes
              </td>
              <td className="py-2 text-right font-data tabular-nums">{fmtMoney(totalSalidas)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-300 bg-slate-50 p-5 text-[0.9rem]">
        <div className="flex justify-between py-1">
          <span className="text-slate-600">Venta total del mes</span>
          <span className="font-data font-bold tabular-nums text-slate-900">{fmtMoney(totalVentas)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-slate-600">Salidas de efectivo del mes</span>
          <span className="font-data font-bold tabular-nums text-slate-900">-{fmtMoney(totalSalidas)}</span>
        </div>
      </section>
    </main>
  );
}
