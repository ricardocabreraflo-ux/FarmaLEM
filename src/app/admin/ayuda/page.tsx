import type { Metadata } from "next";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { listTutorials } from "@/lib/tutorials";
import { getLeafVisibilityByRole } from "@/lib/panel-modules";
import { listRoles } from "@/lib/roles";
import { AdminShell } from "@/components/admin/AdminShell";
import { TutorialList, type TutorialRoleAccess } from "@/components/admin/TutorialList";

export const metadata: Metadata = { title: "Ayuda" };
export const dynamic = "force-dynamic";

export default async function AyudaPage() {
  const session = await requireSession();
  const isAdmin = session.role === "admin";
  const [profile, tutorials] = await Promise.all([getProfileById(session.uid), listTutorials(isAdmin)]);

  let roleAccess: Record<string, TutorialRoleAccess> = {};
  if (isAdmin) {
    const [roles, visibilityByLeaf] = await Promise.all([listRoles(), getLeafVisibilityByRole()]);
    const vendedorId = roles.find((r) => r.name === "VENDEDOR")?.id ?? null;
    const vendedorPlusId = roles.find((r) => r.name === "VENDEDOR PLUS")?.id ?? null;
    roleAccess = Object.fromEntries(
      tutorials.map((t) => {
        if (!t.moduleKey) return [t.slug, { vendedor: null, vendedorPlus: null }];
        const visibleTo = visibilityByLeaf.get(t.moduleKey);
        return [
          t.slug,
          {
            vendedor: vendedorId ? (visibleTo?.has(vendedorId) ?? false) : null,
            vendedorPlus: vendedorPlusId ? (visibleTo?.has(vendedorPlusId) ?? false) : null,
          },
        ];
      })
    );
  }

  return (
    <AdminShell activeHref="/admin/ayuda" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Ayuda</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">
        {isAdmin
          ? "Tutoriales cortos para el equipo. Decide cuáles se ven en el celular y la computadora del mostrador."
          : "Tutoriales cortos para resolver dudas del día a día."}
      </p>

      <TutorialList tutorials={tutorials} isAdmin={isAdmin} roleAccess={roleAccess} />
    </AdminShell>
  );
}
