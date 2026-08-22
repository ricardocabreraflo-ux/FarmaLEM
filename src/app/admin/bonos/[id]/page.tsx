import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { getBonusWeek } from "@/lib/bonuses";
import { AdminShell } from "@/components/admin/AdminShell";
import { BonusWeekForm } from "@/components/admin/BonusWeekForm";

export const metadata: Metadata = { title: "Editar bono semanal" };
export const dynamic = "force-dynamic";

export default async function EditBonusWeekPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ mes?: string }> }) {
  const { id } = await params;
  const { mes } = await searchParams;
  const session = await requireAdminSession();

  const [profile, employees, week] = await Promise.all([getProfileById(session.uid), listProfiles(), getBonusWeek(id)]);
  if (!week) notFound();

  const activeEmployees = employees.filter((e) => e.role === "employee" && e.active);
  const month = mes || week.month;

  return (
    <AdminShell activeHref="/admin/bonos" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Editar bono semanal</h1>
      <BonusWeekForm month={month} employees={activeEmployees} week={week} />
    </AdminShell>
  );
}
