import type { Metadata } from "next";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { listTutorials } from "@/lib/tutorials";
import { AdminShell } from "@/components/admin/AdminShell";
import { TutorialList } from "@/components/admin/TutorialList";

export const metadata: Metadata = { title: "Ayuda" };
export const dynamic = "force-dynamic";

export default async function AyudaPage() {
  const session = await requireSession();
  const isAdmin = session.role === "admin";
  const [profile, tutorials] = await Promise.all([getProfileById(session.uid), listTutorials(isAdmin)]);

  return (
    <AdminShell activeHref="/admin/ayuda" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Ayuda</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">
        {isAdmin
          ? "Tutoriales cortos para el equipo. Decide cuáles se ven en el celular y la computadora del mostrador."
          : "Tutoriales cortos para resolver dudas del día a día."}
      </p>

      <TutorialList tutorials={tutorials} isAdmin={isAdmin} />
    </AdminShell>
  );
}
