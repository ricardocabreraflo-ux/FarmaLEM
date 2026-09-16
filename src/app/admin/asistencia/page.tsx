import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listAttendanceForMonth } from "@/lib/attendance";
import { mexicoCityToday, listEventsForEmployeeRange, pairPunchesByDay } from "@/lib/time-clock";
import { monthEnd } from "@/lib/dates";
import { canAccessModule } from "@/lib/panel-modules";
import { AdminShell } from "@/components/admin/AdminShell";
import { AttendanceList } from "@/components/admin/AttendanceList";
import { AttendanceCalendarView } from "@/components/admin/AttendanceCalendarView";
import { AttendanceGeneratePreview } from "@/components/admin/AttendanceGeneratePreview";
import { MonthPicker } from "@/components/admin/MonthPicker";

export const metadata: Metadata = { title: "Asistencia" };
export const dynamic = "force-dynamic";

const PAID = new Set(["Asistió", "Cubrió turno"]);

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });
}

export default async function AsistenciaPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireSession();
  const isAdmin = session.role === "admin";
  const profile = await getProfileById(session.uid);
  if (!(await canAccessModule("/admin/asistencia", isAdmin, profile?.role_id ?? null))) redirect("/admin");

  const { mes } = await searchParams;
  const month = mes || mexicoCityToday().slice(0, 7);

  const [employees, attendance, myPunches] = await Promise.all([
    listProfiles(),
    listAttendanceForMonth(month),
    isAdmin ? Promise.resolve([]) : listEventsForEmployeeRange(session.uid, `${month}-01`, monthEnd(month)),
  ]);
  const activeEmployees = employees.filter((e) => e.role === "employee" && e.active);
  const nameById = new Map(employees.map((e) => [e.id, e.full_name]));

  const allRows = attendance.map((a) => ({ ...a, employeeName: nameById.get(a.employee_id) ?? "Desconocido" }));
  // Una vendedora solo ve su propia asistencia, de solo lectura — nunca la de sus compañeras.
  const rows = isAdmin ? allRows : allRows.filter((r) => r.employee_id === session.uid);
  const punchDays = isAdmin ? [] : pairPunchesByDay(myPunches);

  return (
    <AdminShell activeHref="/admin/asistencia" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Asistencia</h1>
        {isAdmin && (
          <Link
            href={`/admin/asistencia/nuevo?mes=${month}`}
            className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            + Registrar día
          </Link>
        )}
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Cada falta afecta únicamente el bono de la semana donde ocurrió.</p>

      {isAdmin && (
        <div className="mt-3 flex flex-wrap gap-4">
          <Link href="/admin/reloj/semana" className="text-[0.85rem] font-semibold text-admin-primary hover:underline">
            Reporte semanal de entradas (reloj checador) &rarr;
          </Link>
          <Link href="/admin/reloj/bitacora" className="text-[0.85rem] font-semibold text-admin-primary hover:underline">
            Bitácora del reloj checador &rarr;
          </Link>
        </div>
      )}

      <MonthPicker month={month} basePath="/admin/asistencia" />

      {isAdmin && (
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <AttendanceCalendarView month={month} />
          <AttendanceGeneratePreview month={month} />
        </div>
      )}

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(isAdmin ? activeEmployees : activeEmployees.filter((e) => e.id === session.uid)).map((e) => {
          const list = allRows.filter((r) => r.employee_id === e.id);
          const worked = list.filter((r) => PAID.has(r.status)).length;
          const missed = list.filter((r) => r.status === "Falta").length;
          const salary = list.filter((r) => PAID.has(r.status)).reduce((sum, r) => sum + r.rate, 0);
          return (
            <div key={e.id} className="rounded-2xl border border-admin-border bg-admin-surface p-4">
              <span className="text-[0.78rem] text-admin-ink-soft">{e.full_name}</span>
              <p className="mt-1 font-display text-lg text-admin-ink">{worked} turnos</p>
              <span className="text-[0.78rem] text-admin-ink-soft">
                {missed} faltas{isAdmin && ` · ${fmtMoney(salary)}`}
              </span>
            </div>
          );
        })}
      </section>

      {!isAdmin && (
        <>
          <h2 className="mt-8 font-display text-base text-admin-ink">Mi reloj checador</h2>
          <p className="mt-1 text-[0.82rem] text-admin-ink-soft">Tus entradas y salidas marcadas este mes.</p>
          <section className="mt-3 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
            {punchDays.length === 0 ? (
              <p className="px-5 py-8 text-center text-admin-ink-soft">Sin movimientos este mes.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[0.86rem]">
                  <thead>
                    <tr className="border-b border-admin-border text-admin-ink-soft">
                      <th className="px-5 py-3 font-medium">Fecha</th>
                      <th className="px-5 py-3 font-medium">Entrada</th>
                      <th className="px-5 py-3 font-medium">Salida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {punchDays.map(([date, p]) => (
                      <tr key={date} className="border-b border-admin-border last:border-0">
                        <td className="px-5 py-3 text-admin-ink-soft">{fmtDate(date)}</td>
                        <td className="px-5 py-3 font-data tabular-nums text-admin-ink">{p.entrada ? fmtTime(p.entrada) : "—"}</td>
                        <td className="px-5 py-3 font-data tabular-nums text-admin-ink">{p.salida ? fmtTime(p.salida) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <h2 className="mt-8 font-display text-base text-admin-ink">Mis días</h2>
        </>
      )}

      <div className="mt-6">
        <AttendanceList key={month} rows={rows} isAdmin={isAdmin} />
      </div>
    </AdminShell>
  );
}
