import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listSuppliers } from "@/lib/suppliers";
import { AdminShell } from "@/components/admin/AdminShell";
import { WithdrawalForm } from "@/components/admin/WithdrawalForm";

export const metadata: Metadata = { title: "Registrar salida" };
export const dynamic = "force-dynamic";

export default async function NewWithdrawalPage() {
  const session = await requireAdminSession();
  const [profile, suppliers, employees] = await Promise.all([getProfileById(session.uid), listSuppliers(true), listProfiles()]);

  return (
    <AdminShell activeHref="/admin/salidas" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Registrar salida</h1>
      <WithdrawalForm isAdmin={session.role === "admin"} suppliers={suppliers} employees={employees.filter((e) => e.role === "employee")} />
    </AdminShell>
  );
}
