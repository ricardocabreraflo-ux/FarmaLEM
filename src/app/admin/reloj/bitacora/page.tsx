import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById, listProfiles } from "@/lib/profiles";
import { listEventsForDate, mexicoCityToday } from "@/lib/time-clock";
import { AdminShell } from "@/components/admin/AdminShell";
import { DayPicker } from "@/components/admin/DayPicker";

export const metadata: Metadata = { title: "Bitácora del reloj checador" };
export const dynamic = "force-dynamic";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "America/Mexico_City" });
}

export default async function BitacoraRelojPage({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const session = await requireAdminSession();
  const { fecha } = await searchParams;
  const date = fecha || mexicoCityToday();

  const [profile, employees, events] = await Promise.all([getProfileById(session.uid), listProfiles(), listEventsForDate(date)]);
  const nameById = new Map(employees.map((e) => [e.id, e.full_name]));

  return (
    <AdminShell activeHref="/admin/reloj" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Bitácora del reloj checador</h1>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Cada Entrada/Salida marcada desde el reloj checador.</p>

      <Link href="/admin/reloj/semana" className="mt-2 inline-block text-[0.85rem] font-semibold text-admin-primary hover:underline">
        Ver reporte semanal de entradas (para pagar la semana) &rarr;
      </Link>

      <DayPicker date={date} basePath="/admin/reloj/bitacora" />

      <section className="mt-5 overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        {events.length === 0 ? (
          <p className="px-5 py-8 text-center text-admin-ink-soft">Sin movimientos ese día.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[0.86rem]">
              <thead>
                <tr className="border-b border-admin-border text-admin-ink-soft">
                  <th className="px-5 py-3 font-medium">Hora</th>
                  <th className="px-5 py-3 font-medium">Empleado</th>
                  <th className="px-5 py-3 font-medium">Movimiento</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b border-admin-border last:border-0">
                    <td className="px-5 py-3 font-data tabular-nums text-admin-ink-soft">{fmtTime(e.occurred_at)}</td>
                    <td className="px-5 py-3 font-semibold text-admin-ink">{nameById.get(e.employee_id) ?? "Desconocido"}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[0.76rem] font-semibold ${
                          e.event_type === "Entrada" ? "bg-admin-ok-bg text-admin-ok-text" : "bg-admin-pending-bg text-admin-pending-text"
                        }`}
                      >
                        {e.event_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
