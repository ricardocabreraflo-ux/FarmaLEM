import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { listSuppliers } from "@/lib/suppliers";
import { AdminShell } from "@/components/admin/AdminShell";

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

      <section className="mt-6 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        <table className="w-full text-left text-[0.86rem]">
          <thead>
            <tr className="border-b border-admin-border text-admin-ink-soft">
              <th className="px-5 py-3 font-medium">Proveedor</th>
              <th className="px-5 py-3 font-medium">Contacto</th>
              <th className="px-5 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 && (
              <tr>
                <td colSpan={3} className="px-5 py-8 text-center text-admin-ink-soft">
                  Sin proveedores capturados.
                </td>
              </tr>
            )}
            {suppliers.map((s) => (
              <tr key={s.id} className="border-b border-admin-border last:border-0">
                <td className="px-5 py-3 font-semibold text-admin-ink">{s.name}</td>
                <td className="px-5 py-3 text-admin-ink-soft">{s.contact || "—"}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.76rem] font-semibold ${
                      s.active ? "bg-admin-ok-bg text-admin-ok-text" : "bg-admin-bad-bg text-admin-bad-text"
                    }`}
                  >
                    {s.active ? "Activo" : "Inactivo"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AdminShell>
  );
}
