import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { AdminShell } from "@/components/admin/AdminShell";
import { BreakevenSimulator } from "@/components/admin/BreakevenSimulator";

export const metadata: Metadata = { title: "Simulador de escenarios" };
export const dynamic = "force-dynamic";

export default async function SimuladorPage() {
  const session = await requireAdminSession();
  const profile = await getProfileById(session.uid);

  return (
    <AdminShell activeHref="/admin/punto-equilibrio/simulador" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Simulador de escenarios</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">
        Prueba distintas mezclas de ventas por categoría y márgenes para ver cómo cambia tu punto de equilibrio. Los valores son manuales, no vienen de tus
        ventas reales.
      </p>
      <BreakevenSimulator />
    </AdminShell>
  );
}
