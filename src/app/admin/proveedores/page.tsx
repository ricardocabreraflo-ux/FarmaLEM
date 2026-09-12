import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { listSuppliers } from "@/lib/suppliers";
import { AdminShell } from "@/components/admin/AdminShell";
import { SuppliersList } from "@/components/admin/SuppliersList";

export const metadata: Metadata = { title: "Proveedores" };
export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const session = await requireAdminSession();
  const [profile, suppliers] = await Promise.all([getProfileById(session.uid), listSuppliers()]);

  return (
    <AdminShell activeHref="/admin/proveedores" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Proveedores</h1>
        <Link
          href="/admin/proveedores/nuevo"
          className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          + Nuevo proveedor
        </Link>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Catálogo reutilizable para pagos y nuevas secciones.</p>

      <SuppliersList suppliers={suppliers} />
    </AdminShell>
  );
}
