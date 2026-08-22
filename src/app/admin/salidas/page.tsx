import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { listWithdrawals } from "@/lib/withdrawals";
import { AdminShell } from "@/components/admin/AdminShell";
import { WithdrawalsList } from "@/components/admin/WithdrawalsList";

export const metadata: Metadata = { title: "Salidas de efectivo" };
export const dynamic = "force-dynamic";

export default async function SalidasPage() {
  const session = await requireSession();
  const isAdmin = session.role === "admin";

  const [profile, withdrawals] = await Promise.all([getProfileById(session.uid), listWithdrawals(isAdmin ? undefined : session.uid)]);

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

      <div className="mt-6">
        <WithdrawalsList withdrawals={withdrawals} isAdmin={isAdmin} />
      </div>
    </AdminShell>
  );
}
