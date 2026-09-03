import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles, getEmployeeDocumentUrl } from "@/lib/profiles";
import { listRoles } from "@/lib/roles";
import { hasDeletePin } from "@/lib/security-settings";
import { AdminShell } from "@/components/admin/AdminShell";
import { EmployeesList } from "@/components/admin/EmployeesList";

export const metadata: Metadata = { title: "Empleados" };
export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const session = await requireAdminSession();
  const [profile, employees, roles, pinConfigured] = await Promise.all([getProfileById(session.uid), listProfiles(), listRoles(), hasDeletePin()]);

  const rows = await Promise.all(
    employees.map(async (e) => ({
      ...e,
      referenceLetterUrl: e.reference_letter_path ? await getEmployeeDocumentUrl(e.reference_letter_path) : null,
      sicadExamUrl: e.sicad_exam_path ? await getEmployeeDocumentUrl(e.sicad_exam_path) : null,
    }))
  );

  return (
    <AdminShell activeHref="/admin/empleados" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Empleados</h1>
        <Link
          href="/admin/empleados/nuevo"
          className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          + Nuevo empleado
        </Link>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Edita turnos, accesos y estado sin perder el historial.</p>

      <EmployeesList employees={rows} roles={roles} pinConfigured={pinConfigured} />
    </AdminShell>
  );
}
