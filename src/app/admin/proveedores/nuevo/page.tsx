import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { AdminShell } from "@/components/admin/AdminShell";
import { SupplierForm } from "@/components/admin/SupplierForm";

export const metadata: Metadata = { title: "Nuevo proveedor" };
export const dynamic = "force-dynamic";

export default async function NewSupplierPage() {
  const session = await requireAdminSession();
  const profile = await getProfileById(session.uid);

  return (
    <AdminShell activeHref="/admin/proveedores" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Nuevo proveedor</h1>
      <SupplierForm />
    </AdminShell>
  );
}
