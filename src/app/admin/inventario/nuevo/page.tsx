import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { getInventorySummary } from "@/lib/inventory";
import { AdminShell } from "@/components/admin/AdminShell";
import { StockExitForm } from "@/components/admin/StockExitForm";

export const metadata: Metadata = { title: "Registrar salida de inventario" };
export const dynamic = "force-dynamic";

export default async function NuevaSalidaPage() {
  const session = await requireAdminSession();
  const [profile, products] = await Promise.all([getProfileById(session.uid), getInventorySummary()]);

  return (
    <AdminShell activeHref="/admin/inventario" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Registrar salida de inventario</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Registra piezas vendidas o dadas de baja para un producto ya capturado en Recepción de mercancía.</p>
      <StockExitForm products={products} />
    </AdminShell>
  );
}
