import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listShiftScheduleForDate } from "@/lib/shift-schedule";
import { listAttendanceForMonth } from "@/lib/attendance";
import { mexicoCityToday } from "@/lib/time-clock";
import { AdminShell } from "@/components/admin/AdminShell";
import { AttendanceForm } from "@/components/admin/AttendanceForm";
import { ScheduledShiftsList } from "@/components/admin/ScheduledShiftsList";

export const metadata: Metadata = { title: "Registrar asistencia" };
export const dynamic = "force-dynamic";

export default async function NewAttendancePage({ searchParams }: { searchParams: Promise<{ mes?: string; fecha?: string }> }) {
  const session = await requireAdminSession();
  const { mes, fecha } = await searchParams;
  const today = mexicoCityToday();
  const month = mes || today.slice(0, 7);
  const workDate = fecha || today;

  const [profile, employees, scheduled, attendanceThisMonth] = await Promise.all([
    getProfileById(session.uid),
    listProfiles(),
    listShiftScheduleForDate(workDate),
    listAttendanceForMonth(workDate.slice(0, 7)),
  ]);
  const activeEmployees = employees.filter((e) => e.role === "employee" && e.active);
  const existingForDate = attendanceThisMonth.filter((a) => a.work_date === workDate);

  return (
    <AdminShell activeHref="/admin/asistencia" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Registrar asistencia</h1>

      <section className="mt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-base text-admin-ink">Turnos programados</h2>
          <form method="get" className="flex items-end gap-2">
            <input type="hidden" name="mes" value={month} />
            <label className="block text-[0.82rem] font-semibold text-admin-ink">
              Fecha
              <input
                type="date"
                name="fecha"
                defaultValue={workDate}
                className="mt-1 block rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
              />
            </label>
            <button type="submit" className="rounded-full border border-admin-border px-4 py-2 text-[0.82rem] font-semibold text-admin-ink">
              Ver
            </button>
          </form>
        </div>
        <p className="mt-1 text-[0.82rem] text-admin-ink-soft">Vienen del Calendario de turnos — confirma con un toque en vez de capturar todo a mano.</p>
        <div className="mt-3">
          <ScheduledShiftsList workDate={workDate} assignments={scheduled} employees={activeEmployees} existing={existingForDate} />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-base text-admin-ink">Captura manual</h2>
        <p className="mt-1 text-[0.82rem] text-admin-ink-soft">Para turnos que no están en el calendario (cambios de último momento, cobertura, etc.).</p>
        <AttendanceForm employees={activeEmployees} month={month} />
      </section>
    </AdminShell>
  );
}
