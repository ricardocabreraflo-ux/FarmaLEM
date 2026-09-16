import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { lastEventToday, mexicoCityToday, listEventsForEmployeeRange, pairPunchesByDay } from "@/lib/time-clock";
import { monthEnd } from "@/lib/dates";
import { logoutToTurno } from "@/app/admin/turno/actions";
import { PunchPanel } from "@/components/admin/PunchPanel";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Reloj checador" };
export const dynamic = "force-dynamic";

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });
}

export default async function RelojPage() {
  const session = await requireSession();

  // Administración no necesita marcar PIN (ya entró con su usuario): en vez del
  // reloj a pantalla completa, ve directo los reportes y accesos que le sirven.
  if (session.role === "admin") {
    const profile = await getProfileById(session.uid);
    return (
      <AdminShell activeHref="/admin/reloj" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
        <h1 className="font-display text-2xl text-admin-ink">Reloj checador</h1>
        <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Esta pantalla es para el equipo, en la computadora de la farmacia. Aquí tienes los reportes y accesos directos.</p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link href="/admin/reloj/semana" className="rounded-2xl border border-admin-border bg-admin-surface p-4 font-semibold text-admin-ink hover:border-admin-primary">
            Reporte semanal de entradas
          </Link>
          <Link href="/admin/reloj/bitacora" className="rounded-2xl border border-admin-border bg-admin-surface p-4 font-semibold text-admin-ink hover:border-admin-primary">
            Bitácora del reloj checador
          </Link>
          <Link href="/admin/asistencia" className="rounded-2xl border border-admin-border bg-admin-surface p-4 font-semibold text-admin-ink hover:border-admin-primary">
            Asistencia
          </Link>
          <Link href="/admin/cortes/nuevo" className="rounded-2xl border border-admin-border bg-admin-surface p-4 font-semibold text-admin-ink hover:border-admin-primary">
            Capturar corte
          </Link>
        </div>
      </AdminShell>
    );
  }

  const today = mexicoCityToday();
  const month = today.slice(0, 7);
  const [profile, last, myPunches] = await Promise.all([
    getProfileById(session.uid),
    lastEventToday(session.uid),
    listEventsForEmployeeRange(session.uid, `${month}-01`, monthEnd(month)),
  ]);
  const punchDays = pairPunchesByDay(myPunches);

  return (
    <AdminShell activeHref="/admin/reloj" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Reloj checador</h1>
        <form action={logoutToTurno}>
          <button type="submit" className="text-[0.82rem] font-semibold text-admin-ink-soft hover:underline">
            Cambiar de turno
          </button>
        </form>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Marca tu Entrada o Salida.</p>

      <div className="mx-auto mt-5 max-w-[380px]">
        <PunchPanel
          employeeName={profile?.full_name ?? "Sin nombre"}
          initialLastEvent={last ? { type: last.event_type, time: last.occurred_at } : null}
        />

        <Link
          href="/admin/cortes/nuevo"
          className="mt-3 block w-full rounded-2xl border border-admin-border bg-admin-surface px-6 py-4 text-center text-[0.95rem] font-semibold text-admin-ink hover:border-admin-primary"
        >
          Capturar corte
        </Link>
      </div>

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
    </AdminShell>
  );
}
