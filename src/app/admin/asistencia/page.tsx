import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listAttendanceForMonth } from "@/lib/attendance";
import { AdminShell } from "@/components/admin/AdminShell";
import { AttendanceList } from "@/components/admin/AttendanceList";
import { MonthPicker } from "@/components/admin/MonthPicker";

export const metadata: Metadata = { title: "Asistencia" };
export const dynamic = "force-dynamic";

const PAID = new Set(["Asistió", "Cubrió turno"]);

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export default async function AsistenciaPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireAdminSession();
  const { mes } = await searchParams;
  const month = mes || new Date().toISOString().slice(0, 7);

  const [profile, employees, attendance] = await Promise.all([getProfileById(session.uid), listProfiles(), listAttendanceForMonth(month)]);
  const activeEmployees = employees.filter((e) => e.role === "employee" && e.active);
  const nameById = new Map(employees.map((e) => [e.id, e.full_name]));

  const rows = attendance.map((a) => ({ ...a, employeeName: nameById.get(a.employee_id) ?? "Desconocido" }));

  return (
    <AdminShell activeHref="/admin/asistencia" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Asistencia</h1>
        <Link
          href={`/admin/asistencia/nuevo?mes=${month}`}
          className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          + Registrar día
        </Link>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Cada falta afecta únicamente el bono de la semana donde ocurrió.</p>

      <div className="mt-3 flex flex-wrap gap-4">
        <Link href="/admin/reloj/semana" className="text-[0.85rem] font-semibold text-admin-primary hover:underline">
          Reporte semanal de entradas (reloj checador) &rarr;
        </Link>
        <Link href="/admin/reloj/bitacora" className="text-[0.85rem] font-semibold text-admin-primary hover:underline">
          Bitácora del reloj checador &rarr;
        </Link>
      </div>

      <MonthPicker month={month} basePath="/admin/asistencia" />

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {activeEmployees.map((e) => {
          const list = rows.filter((r) => r.employee_id === e.id);
          const worked = list.filter((r) => PAID.has(r.status)).length;
          const missed = list.filter((r) => r.status === "Falta").length;
          const salary = list.filter((r) => PAID.has(r.status)).reduce((sum, r) => sum + r.rate, 0);
          return (
            <div key={e.id} className="rounded-2xl border border-admin-border bg-admin-surface p-4">
              <span className="text-[0.78rem] text-admin-ink-soft">{e.full_name}</span>
              <p className="mt-1 font-display text-lg text-admin-ink">{worked} turnos</p>
              <span className="text-[0.78rem] text-admin-ink-soft">
                {missed} faltas &middot; {fmtMoney(salary)}
              </span>
            </div>
          );
        })}
      </section>

      <div className="mt-6">
        <AttendanceList rows={rows} />
      </div>
    </AdminShell>
  );
}
