import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { listPurchases } from "@/lib/purchases";
import { listSuppliers } from "@/lib/suppliers";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Recepción de mercancía" };
export const dynamic = "force-dynamic";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ComprasPage() {
  const session = await requireAdminSession();
  const [profile, purchases, suppliers] = await Promise.all([getProfileById(session.uid), listPurchases(), listSuppliers()]);
  const nameById = new Map(suppliers.map((s) => [s.id, s.name]));

  const totalPieces = purchases.reduce((sum, p) => sum + p.quantity, 0);
  const totalCost = purchases.reduce((sum, p) => sum + p.quantity * p.cost, 0);

  return (
    <AdminShell activeHref="/admin/compras" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Recepción de mercancía</h1>
        <div className="flex gap-2">
          <a href="/admin/compras/export" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink">
            Exportar CSV
          </a>
          <Link
            href="/admin/compras/nuevo"
            className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            + Producto
          </Link>
        </div>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Captura productos y exporta un archivo para preparar la carga al punto de venta.</p>

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Productos capturados</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{purchases.length}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Piezas</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{totalPieces}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Costo total</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{fmtMoney(totalCost)}</p>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.86rem]">
            <thead>
              <tr className="border-b border-admin-border text-admin-ink-soft">
                <th className="px-5 py-3 font-medium">Fecha</th>
                <th className="px-5 py-3 font-medium">Código de barras</th>
                <th className="px-5 py-3 font-medium">Descripción</th>
                <th className="px-5 py-3 text-right font-medium">Piezas</th>
                <th className="px-5 py-3 text-right font-medium">Costo</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
                <th className="px-5 py-3 text-right font-medium">Precio</th>
                <th className="px-5 py-3 font-medium">Proveedor</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-admin-ink-soft">
                    Sin productos capturados
                  </td>
                </tr>
              )}
              {purchases.map((p) => (
                <tr key={p.id} className="border-b border-admin-border last:border-0">
                  <td className="px-5 py-3 text-admin-ink-soft">{fmtDate(p.purchase_date)}</td>
                  <td className="px-5 py-3 text-admin-ink-soft">{p.barcode}</td>
                  <td className="px-5 py-3 font-semibold text-admin-ink">{p.description}</td>
                  <td className="px-5 py-3 text-right text-admin-ink">{p.quantity}</td>
                  <td className="px-5 py-3 text-right font-data tabular-nums text-admin-ink-soft">{fmtMoney(p.cost)}</td>
                  <td className="px-5 py-3 text-right font-data tabular-nums text-admin-ink">{fmtMoney(p.quantity * p.cost)}</td>
                  <td className="px-5 py-3 text-right font-data tabular-nums text-admin-ink-soft">{fmtMoney(p.price)}</td>
                  <td className="px-5 py-3 text-admin-ink-soft">{p.supplier_id ? nameById.get(p.supplier_id) ?? "—" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
