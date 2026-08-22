import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { getExtraBonus } from "@/lib/extra-bonuses";
import { AdminShell } from "@/components/admin/AdminShell";
import { ExtraBonusForm } from "@/components/admin/ExtraBonusForm";

export const metadata: Metadata = { title: "Editar bono extraordinario" };
export const dynamic = "force-dynamic";

export default async function EditExtraBonusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdminSession();
  const [profile, employees, bonus] = await Promise.all([getProfileById(session.uid), listProfiles(), getExtraBonus(id)]);
  if (!bonus) notFound();

  const activeEmployees = employees.filter((e) => e.role === "employee" && e.active);

  return (
    <AdminShell activeHref="/admin/bonos-extra" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Editar bono extraordinario</h1>
      <ExtraBonusForm employees={activeEmployees} bonus={bonus} />
    </AdminShell>
  );
}
