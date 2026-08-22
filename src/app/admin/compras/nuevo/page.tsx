import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { listSuppliers } from "@/lib/suppliers";
import { AdminShell } from "@/components/admin/AdminShell";
import { PurchaseForm } from "@/components/admin/PurchaseForm";

export const metadata: Metadata = { title: "Recibir producto" };
export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  const session = await requireAdminSession();
  const [profile, suppliers] = await Promise.all([getProfileById(session.uid), listSuppliers(true)]);

  return (
    <AdminShell activeHref="/admin/compras" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Recibir producto</h1>
      <PurchaseForm suppliers={suppliers} />
    </AdminShell>
  );
}
