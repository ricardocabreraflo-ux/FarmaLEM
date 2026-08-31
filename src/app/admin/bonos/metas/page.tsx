import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { listBonusTiers } from "@/lib/bonuses";
import { AdminShell } from "@/components/admin/AdminShell";
import { BonusTiersForm } from "@/components/admin/BonusTiersForm";

export const metadata: Metadata = { title: "Configurar metas" };
export const dynamic = "force-dynamic";

export default async function BonusTiersPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireAdminSession();
  const { mes } = await searchParams;
  const month = mes || new Date().toISOString().slice(0, 7);

  const [profile, tiers] = await Promise.all([getProfileById(session.uid), listBonusTiers(month)]);

  return (
    <AdminShell activeHref="/admin/bonos" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Configurar pirámide de metas</h1>
        <Link
          href={`/admin/bonos/metas/reporte?mes=${month}`}
          target="_blank"
          className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink"
        >
          Imprimir pirámide
        </Link>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Mes: {month}</p>
      <BonusTiersForm month={month} tiers={tiers} />
    </AdminShell>
  );
}
