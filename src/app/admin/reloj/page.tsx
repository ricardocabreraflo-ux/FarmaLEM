import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { lastEventToday } from "@/lib/time-clock";
import { logoutToTurno } from "@/app/admin/turno/actions";
import { PunchPanel } from "@/components/admin/PunchPanel";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Reloj checador" };
export const dynamic = "force-dynamic";

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

  const [profile, last] = await Promise.all([getProfileById(session.uid), lastEventToday(session.uid)]);

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
    </AdminShell>
  );
}
