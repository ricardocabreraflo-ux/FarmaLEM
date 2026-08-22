import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { AdminShell } from "@/components/admin/AdminShell";
import { BonusWeekForm } from "@/components/admin/BonusWeekForm";

export const metadata: Metadata = { title: "Calcular bono semanal" };
export const dynamic = "force-dynamic";

export default async function NewBonusWeekPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireAdminSession();
  const { mes } = await searchParams;
  const month = mes || new Date().toISOString().slice(0, 7);

  const [profile, employees] = await Promise.all([getProfileById(session.uid), listProfiles()]);
  const activeEmployees = employees.filter((e) => e.role === "employee" && e.active);

  return (
    <AdminShell activeHref="/admin/bonos" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Calcular bono semanal</h1>
      <BonusWeekForm month={month} employees={activeEmployees} />
    </AdminShell>
  );
}
