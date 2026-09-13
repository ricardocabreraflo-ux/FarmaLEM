import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { listSuppliers } from "@/lib/suppliers";
import { AdminShell } from "@/components/admin/AdminShell";
import { ReceiptCaptureFlow } from "@/components/admin/ReceiptCaptureFlow";

export const metadata: Metadata = { title: "Nueva recepción" };
export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  const session = await requireAdminSession();
  const [profile, suppliers] = await Promise.all([getProfileById(session.uid), listSuppliers(true)]);

  return (
    <AdminShell activeHref="/admin/compras" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Nueva recepción de mercancía</h1>
      <ReceiptCaptureFlow suppliers={suppliers} />
    </AdminShell>
  );
}
