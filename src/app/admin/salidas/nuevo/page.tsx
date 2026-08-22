import type { Metadata } from "next";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { AdminShell } from "@/components/admin/AdminShell";
import { WithdrawalForm } from "@/components/admin/WithdrawalForm";

export const metadata: Metadata = { title: "Registrar salida" };
export const dynamic = "force-dynamic";

export default async function NewWithdrawalPage() {
  const session = await requireSession();
  const profile = await getProfileById(session.uid);

  return (
    <AdminShell activeHref="/admin/salidas" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Registrar salida</h1>
      <WithdrawalForm isAdmin={session.role === "admin"} />
    </AdminShell>
  );
}
