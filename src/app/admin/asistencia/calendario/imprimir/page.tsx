import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { mexicoCityToday } from "@/lib/dates";
import { listProfiles } from "@/lib/profiles";
import { listShiftScheduleForMonth, listWeekLabels } from "@/lib/shift-schedule";
import { buildMonthWeeks } from "@/lib/calendar-weeks";
import { ShiftScheduleGrid } from "@/components/admin/ShiftScheduleGrid";
import { PrintButton } from "@/components/admin/PrintButton";

export const metadata: Metadata = { title: "Imprimir calendario de turnos" };
export const dynamic = "force-dynamic";

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export default async function ImprimirCalendarioPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await requireAdminSession();
  const { mes } = await searchParams;
  const month = mes || mexicoCityToday().slice(0, 7);

  const [employees, assignments, weekLabels] = await Promise.all([listProfiles(), listShiftScheduleForMonth(month), listWeekLabels()]);
  const activeEmployees = employees.filter((e) => e.role === "employee" && e.active);
  const weeks = buildMonthWeeks(month);

  return (
    <main className="force-light-admin mx-auto max-w-[980px] px-6 py-10 print:px-0 print:py-1">
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          @page { size: landscape; margin: 8mm; }
        }
        .force-light-admin {
          /* El calendario reutiliza ShiftScheduleGrid (pensado para el panel, que sigue el tema
             claro/oscuro del sistema); aquí se fuerzan los mismos tokens en claro para que la
             versión de impresión nunca salga oscura, sin tocar el componente compartido. */
          --admin-bg: #f3f6f4;
          --admin-surface: #ffffff;
          --admin-input-bg: #e6ebe7;
          --admin-border: rgb(23 33 27 / 0.12);
          --admin-ink: #17211b;
          --admin-ink-soft: #59665d;
          --admin-primary: #176b46;
          --admin-primary-deep: #0f4d33;
          --admin-primary-soft: #e8f1ec;
          --admin-bad-bg: #ffebe9;
          --admin-bad-text: #a6251b;
          background: var(--admin-bg);
          color: var(--admin-ink);
        }
      `}</style>

      <Link href={`/admin/asistencia/calendario?mes=${month}`} className="text-[0.85rem] font-semibold text-admin-primary print:hidden">
        &larr; Volver al calendario
      </Link>
      <div className="mt-2 flex items-center justify-between print:mt-0">
        <h1 className="font-display text-xl text-admin-ink capitalize print:text-[0.95rem]">FarmaLEM &middot; Calendario de turnos &middot; {monthLabel(month)}</h1>
        <PrintButton />
      </div>

      <div className="mt-5 print:mt-1">
        <ShiftScheduleGrid weeks={weeks} assignments={assignments} employees={activeEmployees} weekLabels={weekLabels} />
      </div>
    </main>
  );
}
