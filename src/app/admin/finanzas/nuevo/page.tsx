import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { mexicoCityToday } from "@/lib/dates";
import { getProfileById } from "@/lib/profiles";
import { AdminShell } from "@/components/admin/AdminShell";
import { FinanceMovementForm } from "@/components/admin/FinanceMovementForm";

export const metadata: Metadata = { title: "Movimiento financiero" };
export const dynamic = "force-dynamic";

export default async function NewFinanceMovementPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireAdminSession();
  const { mes } = await searchParams;
  const month = mes || mexicoCityToday().slice(0, 7);
  const profile = await getProfileById(session.uid);

  return (
    <AdminShell activeHref="/admin/finanzas" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Movimiento financiero</h1>
      <FinanceMovementForm month={month} />
    </AdminShell>
  );
}
