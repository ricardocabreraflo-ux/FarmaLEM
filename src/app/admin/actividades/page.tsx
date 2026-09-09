import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { buildMonthCalendar } from "@/lib/actividades";
import { mexicoCityToday } from "@/lib/dates";
import { AdminShell } from "@/components/admin/AdminShell";
import { MonthPicker } from "@/components/admin/MonthPicker";
import { ActivityCalendarGrid, CategoryLegend } from "@/components/admin/ActivityCalendarGrid";
import { FixedWeeklyScheduleTable } from "@/components/admin/FixedWeeklyScheduleTable";

export const metadata: Metadata = { title: "Calendario de actividades" };
export const dynamic = "force-dynamic";

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default async function ActividadesPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireSession();
  const { mes } = await searchParams;
  const month = mes || mexicoCityToday().slice(0, 7);

  const profile = await getProfileById(session.uid);
  const weeks = buildMonthCalendar(month);

  return (
    <AdminShell activeHref="/admin/actividades" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Calendario de actividades</h1>
        <Link
          href={`/admin/actividades/imprimir?mes=${month}`}
          className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          Imprimir
        </Link>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">
        Limpieza semanal por anaquel (fija) más el inventario del día (rota solo, sin repetirse, entre las 8 categorías).
      </p>

      <MonthPicker month={month} basePath="/admin/actividades" />

      <h2 className="mt-6 font-display text-lg text-admin-ink">Limpieza semanal</h2>
      <p className="mt-1 text-[0.82rem] text-admin-ink-soft">Igual todas las semanas del año — no cambia por mes.</p>
      <div className="mt-2">
        <FixedWeeklyScheduleTable />
      </div>

      <h2 className="mt-6 font-display text-lg text-admin-ink">Inventario del día &middot; {monthLabel(month)}</h2>
      <p className="mt-1 text-[0.82rem] text-admin-ink-soft">
        Se cuenta entre las que estén ese día, sin importar el turno. Sábado y domingo además llevan la vitrina y los 2 anaqueles del turno en
        curso — eso lo define{" "}
        <Link href="/admin/anaqueles" className="font-semibold text-admin-primary hover:underline">
          Distribución de anaqueles
        </Link>
        .
      </p>
      <div className="mt-2">
        <CategoryLegend />
      </div>
      <div className="mt-3">
        <ActivityCalendarGrid weeks={weeks} />
      </div>
    </AdminShell>
  );
}
