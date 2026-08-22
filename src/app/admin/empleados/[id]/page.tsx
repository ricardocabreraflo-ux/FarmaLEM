import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { updateEmployee } from "../actions";

export const metadata: Metadata = { title: "Editar empleado" };
export const dynamic = "force-dynamic";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdminSession();
  const [profile, target] = await Promise.all([getProfileById(session.uid), getProfileById(id)]);

  if (!target) notFound();

  return (
    <AdminShell activeHref="/admin/empleados" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Editar empleado</h1>
      <EmployeeForm action={updateEmployee.bind(null, id)} profile={target} />
    </AdminShell>
  );
}
