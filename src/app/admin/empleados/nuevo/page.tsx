import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { listRoles } from "@/lib/roles";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmployeeForm } from "@/components/admin/EmployeeForm";
import { createEmployee } from "../actions";

export const metadata: Metadata = { title: "Nuevo empleado" };
export const dynamic = "force-dynamic";

export default async function NewEmployeePage() {
  const session = await requireAdminSession();
  const [profile, roles] = await Promise.all([getProfileById(session.uid), listRoles()]);

  return (
    <AdminShell activeHref="/admin/empleados" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Nuevo empleado</h1>
      <EmployeeForm action={createEmployee} roles={roles} />
    </AdminShell>
  );
}
