import type { Metadata } from "next";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { AdminShell } from "@/components/admin/AdminShell";
import { CutForm } from "@/components/admin/CutForm";

export const metadata: Metadata = { title: "Capturar corte" };
export const dynamic = "force-dynamic";

export default async function NewCutPage() {
  const session = await requireSession();
  const profile = await getProfileById(session.uid);

  const employees =
    session.role === "admin" ? (await listProfiles()).filter((e) => e.role === "employee" && e.active) : [];

  const canChooseShift = session.role === "admin" || !profile?.shift || profile.shift === "Administración";
  const defaultShift = profile?.shift && profile.shift !== "Administración" ? profile.shift : "Matutino";

  return (
    <AdminShell activeHref="/admin/cortes" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Capturar corte</h1>
      <CutForm employees={employees} defaultShift={defaultShift} canChooseShift={canChooseShift} />
    </AdminShell>
  );
}
