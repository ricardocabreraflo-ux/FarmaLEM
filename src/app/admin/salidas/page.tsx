import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { listWithdrawalsForMonth, type WithdrawalType } from "@/lib/withdrawals";
import { AdminShell } from "@/components/admin/AdminShell";
import { WithdrawalsList } from "@/components/admin/WithdrawalsList";

export const metadata: Metadata = { title: "Salidas de efectivo" };
export const dynamic = "force-dynamic";

const TYPES: WithdrawalType[] = ["Nómina", "Gasto", "Proveedor", "Otro"];

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export default async function SalidasPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireSession();
  const isAdmin = session.role === "admin";
  const { mes } = await searchParams;
  const month = mes || new Date().toISOString().slice(0, 7);

  const [profile, withdrawals] = await Promise.all([getProfileById(session.uid), listWithdrawalsForMonth(month, isAdmin ? undefined : session.uid)]);

  const totalGeneral = withdrawals.reduce((s, w) => s + w.amount, 0);
  const totalByType = TYPES.map((type) => ({ type, total: withdrawals.filter((w) => w.type === type).reduce((s, w) => s + w.amount, 0) }));

  return (
    <AdminShell activeHref="/admin/salidas" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Salidas de efectivo</h1>
        <Link
          href="/admin/salidas/nuevo"
          className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          + Registrar salida
        </Link>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Nómina, gastos, proveedores y otros retiros.</p>

      <form method="get" className="mt-4 flex items-end gap-3">
        <label className="block max-w-[220px] flex-1 text-[0.85rem] font-semibold text-admin-ink">
          Mes
          <input type="month" name="mes" defaultValue={month} className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary" />
        </label>
        <button type="submit" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink">
          Ver
        </button>
      </form>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <p className="text-[0.78rem] text-admin-ink-soft">Total del mes</p>
          <p className="mt-1 font-data text-lg font-bold tabular-nums text-admin-ink">{fmtMoney(totalGeneral)}</p>
        </div>
        {totalByType.map(({ type, total }) => (
          <div key={type} className="rounded-2xl border border-admin-border bg-admin-surface p-4">
            <p className="text-[0.78rem] text-admin-ink-soft">{type}</p>
            <p className="mt-1 font-data text-lg font-bold tabular-nums text-admin-ink">{fmtMoney(total)}</p>
          </div>
        ))}
      </section>

      <div className="mt-6">
        <WithdrawalsList withdrawals={withdrawals} isAdmin={isAdmin} />
      </div>
    </AdminShell>
  );
}
