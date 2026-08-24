import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Configuración" };
export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const session = await requireAdminSession();
  const profile = await getProfileById(session.uid);

  return (
    <AdminShell activeHref="/admin/configuracion" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Configuración</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Aquí se irán agregando las opciones del panel conforme se vayan definiendo.</p>

      <section className="mt-6 rounded-2xl border border-admin-border bg-admin-surface p-8 text-center">
        <p className="text-admin-ink-soft">Todavía no hay nada que configurar aquí.</p>
      </section>
    </AdminShell>
  );
}
