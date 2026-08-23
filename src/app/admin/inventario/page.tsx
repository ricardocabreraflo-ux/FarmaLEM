import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { getInventorySummary } from "@/lib/inventory";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Inventario" };
export const dynamic = "force-dynamic";

export default async function InventarioPage() {
  const session = await requireAdminSession();
  const [profile, rows] = await Promise.all([getProfileById(session.uid), getInventorySummary()]);

  const totalReceived = rows.reduce((sum, r) => sum + r.received, 0);
  const totalSold = rows.reduce((sum, r) => sum + r.sold, 0);
  const totalAvailable = rows.reduce((sum, r) => sum + r.available, 0);

  return (
    <AdminShell activeHref="/admin/inventario" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Inventario</h1>
        <Link
          href="/admin/inventario/nuevo"
          className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          + Registrar salida
        </Link>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Piezas disponibles = recibidas en Recepción de mercancía − salidas registradas.</p>

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Piezas recibidas</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{totalReceived}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Piezas vendidas</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{totalSold}</p>
        </div>
        <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
          <span className="text-[0.78rem] text-admin-ink-soft">Piezas disponibles</span>
          <p className="mt-1 font-display text-lg text-admin-ink">{totalAvailable}</p>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.86rem]">
            <thead>
              <tr className="border-b border-admin-border text-admin-ink-soft">
                <th className="px-5 py-3 font-medium">Clave corta</th>
                <th className="px-5 py-3 font-medium">Código de barras</th>
                <th className="px-5 py-3 font-medium">Descripción</th>
                <th className="px-5 py-3 text-right font-medium">Recibidas</th>
                <th className="px-5 py-3 text-right font-medium">Vendidas</th>
                <th className="px-5 py-3 text-right font-medium">Disponibles</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-admin-ink-soft">
                    Sin productos capturados
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.barcode} className="border-b border-admin-border last:border-0">
                  <td className="px-5 py-3 text-admin-ink-soft">{r.shortCode ?? "—"}</td>
                  <td className="px-5 py-3 text-admin-ink-soft">{r.barcode}</td>
                  <td className="px-5 py-3 font-semibold text-admin-ink">{r.description}</td>
                  <td className="px-5 py-3 text-right text-admin-ink">{r.received}</td>
                  <td className="px-5 py-3 text-right text-admin-ink">{r.sold}</td>
                  <td className={`px-5 py-3 text-right font-semibold ${r.available <= 0 ? "text-admin-bad-text" : "text-admin-ink"}`}>{r.available}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
