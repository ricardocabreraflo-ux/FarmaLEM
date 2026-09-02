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
      {suppliers.length === 0 ? (
        <p className="mt-4 rounded-lg bg-admin-pending-bg px-4 py-3 text-[0.85rem] text-admin-pending-text">
          Da de alta un proveedor primero en Mercancía → Proveedores.
        </p>
      ) : (
        <ReceiptCaptureFlow suppliers={suppliers} />
      )}
    </AdminShell>
  );
}
