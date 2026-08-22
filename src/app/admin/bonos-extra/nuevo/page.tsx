import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { AdminShell } from "@/components/admin/AdminShell";
import { ExtraBonusForm } from "@/components/admin/ExtraBonusForm";

export const metadata: Metadata = { title: "Registrar bono extraordinario" };
export const dynamic = "force-dynamic";

export default async function NewExtraBonusPage() {
  const session = await requireAdminSession();
  const [profile, employees] = await Promise.all([getProfileById(session.uid), listProfiles()]);
  const activeEmployees = employees.filter((e) => e.role === "employee" && e.active);

  return (
    <AdminShell activeHref="/admin/bonos-extra" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Registrar bono extraordinario</h1>
      <ExtraBonusForm employees={activeEmployees} />
    </AdminShell>
  );
}
