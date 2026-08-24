import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { listProfiles } from "@/lib/profiles";
import { listCutsForMonth } from "@/lib/cuts";
import { listWithdrawalsForMonth } from "@/lib/withdrawals";
import { PrintButton } from "@/components/admin/PrintButton";

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
  const month = mes || new Date().toISOString().slice(0, 7);

  const [employees, cutsDesc, withdrawals] = await Promise.all([listProfiles(), listCutsForMonth(month), listWithdrawalsForMonth(month)]);
  const nameById = new Map(employees.map((e) => [e.id, e.full_name]));
  const cuts = [...cutsDesc].sort((a, b) => a.cut_date.localeCompare(b.cut_date));

  const totalVentas = cuts.reduce((s, c) => s + c.total, 0);
  const totalEfectivo = cuts.reduce((s, c) => s + c.cash, 0);
  const totalTarjeta = cuts.reduce((s, c) => s + c.card, 0);
  const totalSalidas = withdrawals.reduce((s, w) => s + w.amount, 0);

  return (
    <main className="mx-auto max-w-[900px] px-6 py-10">
      <style>{`@media print { .print\\:hidden { display: none !important; } @page { size: landscape; } }`}</style>

      <Link href={`/admin/cortes?mes=${month}`} className="text-[0.85rem] font-semibold text-admin-primary print:hidden">
        &larr; Volver a Cortes
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-xl text-admin-ink capitalize">FarmaLEM &middot; Reporte de cortes &middot; {monthLabel(month)}</h1>
        <PrintButton />
      </div>

      <form method="get" className="mt-4 flex items-end gap-3 print:hidden">
        <label className="block max-w-[220px] flex-1 text-[0.85rem] font-semibold text-admin-ink">
          Mes
          <input type="month" name="mes" defaultValue={month} className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary" />
        </label>
        <button type="submit" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink">
          Ver
        </button>
      </form>

      <section className="mt-6">
        <h2 className="font-display text-base text-admin-ink">Cortes</h2>
        <table className="mt-2 w-full border-collapse text-[0.82rem]">
          <thead>
            <tr className="border-b-2 border-admin-border text-left text-admin-ink-soft">
              <th className="py-2 pr-3 font-medium">Fecha</th>
              <th className="py-2 pr-3 font-medium">Turno</th>
              <th className="py-2 pr-3 font-medium">Empleado</th>
              <th className="py-2 pr-3 text-right font-medium">Venta</th>
              <th className="py-2 pr-3 text-right font-medium">Efectivo</th>
              <th className="py-2 text-right font-medium">Tarjeta</th>
            </tr>
          </thead>
          <tbody>
            {cuts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-4 text-admin-ink-soft">
                  Sin cortes ese mes.
                </td>
              </tr>
            ) : (
              cuts.map((c) => (
                <tr key={c.id} className="border-b border-admin-border">
                  <td className="py-1.5 pr-3 text-admin-ink-soft capitalize">{fmtDate(c.cut_date)}</td>
                  <td className="py-1.5 pr-3 text-admin-ink-soft">{c.shift}</td>
                  <td className="py-1.5 pr-3 font-semibold text-admin-ink">{nameById.get(c.employee_id) ?? "Desconocido"}</td>
                  <td className="py-1.5 pr-3 text-right font-data tabular-nums text-admin-ink">{fmtMoney(c.total)}</td>
                  <td className="py-1.5 pr-3 text-right font-data tabular-nums text-admin-ink-soft">{fmtMoney(c.cash)}</td>
                  <td className="py-1.5 text-right font-data tabular-nums text-admin-ink-soft">{fmtMoney(c.card)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-admin-border font-bold text-admin-ink">
              <td className="py-2 pr-3" colSpan={3}>
                Total del mes
              </td>
              <td className="py-2 pr-3 text-right font-data tabular-nums">{fmtMoney(totalVentas)}</td>
              <td className="py-2 pr-3 text-right font-data tabular-nums">{fmtMoney(totalEfectivo)}</td>
              <td className="py-2 text-right font-data tabular-nums">{fmtMoney(totalTarjeta)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-base text-admin-ink">Salidas de efectivo</h2>
        <table className="mt-2 w-full border-collapse text-[0.82rem]">
          <thead>
            <tr className="border-b-2 border-admin-border text-left text-admin-ink-soft">
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
                <td colSpan={5} className="py-4 text-admin-ink-soft">
                  Sin salidas ese mes.
                </td>
              </tr>
            ) : (
              withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-admin-border">
                  <td className="py-1.5 pr-3 text-admin-ink-soft capitalize">{fmtDate(w.withdrawal_date)}</td>
                  <td className="py-1.5 pr-3 text-admin-ink-soft">{w.shift}</td>
                  <td className="py-1.5 pr-3 text-admin-ink-soft">{w.type}</td>
                  <td className="py-1.5 pr-3 text-admin-ink">{w.concept}</td>
                  <td className="py-1.5 text-right font-data tabular-nums text-admin-ink">{fmtMoney(w.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-admin-border font-bold text-admin-ink">
              <td className="py-2 pr-3" colSpan={4}>
                Total del mes
              </td>
              <td className="py-2 text-right font-data tabular-nums">{fmtMoney(totalSalidas)}</td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="mt-8 rounded-2xl border border-admin-border bg-admin-bg p-5 text-[0.9rem]">
        <div className="flex justify-between py-1">
          <span className="text-admin-ink-soft">Venta total del mes</span>
          <span className="font-data font-bold tabular-nums text-admin-ink">{fmtMoney(totalVentas)}</span>
        </div>
        <div className="flex justify-between py-1">
          <span className="text-admin-ink-soft">Salidas de efectivo del mes</span>
          <span className="font-data font-bold tabular-nums text-admin-ink">-{fmtMoney(totalSalidas)}</span>
        </div>
      </section>
    </main>
  );
}
