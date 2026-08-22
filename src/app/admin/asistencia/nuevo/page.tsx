import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { AdminShell } from "@/components/admin/AdminShell";
import { AttendanceForm } from "@/components/admin/AttendanceForm";

export const metadata: Metadata = { title: "Registrar asistencia" };
export const dynamic = "force-dynamic";

export default async function NewAttendancePage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireAdminSession();
  const { mes } = await searchParams;
  const month = mes || new Date().toISOString().slice(0, 7);

  const [profile, employees] = await Promise.all([getProfileById(session.uid), listProfiles()]);
  const activeEmployees = employees.filter((e) => e.role === "employee" && e.active);

  return (
    <AdminShell activeHref="/admin/asistencia" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Registrar asistencia</h1>
      <AttendanceForm employees={activeEmployees} month={month} />
    </AdminShell>
  );
}
