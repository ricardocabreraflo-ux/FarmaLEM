import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { getCut } from "@/lib/cuts";
import { AdminShell } from "@/components/admin/AdminShell";
import { EditCutForm } from "@/components/admin/EditCutForm";

export const metadata: Metadata = { title: "Editar corte" };
export const dynamic = "force-dynamic";

export default async function EditCutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdminSession();

  const [profile, employees, cut] = await Promise.all([getProfileById(session.uid), listProfiles(), getCut(id)]);
  if (!cut) notFound();

  return (
    <AdminShell activeHref="/admin/cortes" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Editar corte</h1>
      <EditCutForm cut={cut} employees={employees.filter((e) => e.role === "employee")} />
    </AdminShell>
  );
}
