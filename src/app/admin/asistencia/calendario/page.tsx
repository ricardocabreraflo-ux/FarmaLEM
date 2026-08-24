import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listShiftScheduleForMonth, listWeekLabels } from "@/lib/shift-schedule";
import { buildMonthWeeks } from "@/lib/calendar-weeks";
import { AdminShell } from "@/components/admin/AdminShell";
import { ShiftScheduleGrid } from "@/components/admin/ShiftScheduleGrid";
import { GenerateNextMonthButton } from "@/components/admin/GenerateNextMonthButton";
import { MonthFilterForm } from "@/components/admin/MonthFilterForm";

export const metadata: Metadata = { title: "Calendario de turnos" };
export const dynamic = "force-dynamic";

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

function nextMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

export default async function CalendarioTurnosPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireAdminSession();
  const { mes } = await searchParams;
  const month = mes || new Date().toISOString().slice(0, 7);

  const [profile, employees, assignments, weekLabels] = await Promise.all([
    getProfileById(session.uid),
    listProfiles(),
    listShiftScheduleForMonth(month),
    listWeekLabels(),
  ]);
  const activeEmployees = employees.filter((e) => e.role === "employee" && e.active);
  const weeks = buildMonthWeeks(month);

  return (
    <AdminShell activeHref="/admin/asistencia/calendario" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink capitalize">Calendario de turnos &middot; {monthLabel(month)}</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Toca un turno para asignar quién lo cubre. Esto precarga el turno esperado en Asistencia.</p>

      <MonthFilterForm month={month} />

      <div className="mt-5">
        <ShiftScheduleGrid weeks={weeks} assignments={assignments} employees={activeEmployees} weekLabels={weekLabels} />
      </div>

      <div className="mt-5">
        <GenerateNextMonthButton targetMonth={nextMonth(month)} />
      </div>

      <section className="mt-5 rounded-2xl border border-admin-border bg-admin-bg p-5 text-[0.82rem] text-admin-ink-soft">
        <p className="font-bold text-admin-ink">Notas</p>
        <ul className="mt-1.5 list-disc pl-5">
          <li>El cambio de turno es bajo autorización previa.</li>
          <li>Se deben notificar con una a dos semanas.</li>
          <li>Una falta equivale a perder el bono semanal.</li>
        </ul>
      </section>
    </AdminShell>
  );
}
