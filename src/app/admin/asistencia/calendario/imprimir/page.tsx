import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
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
  const month = mes || new Date().toISOString().slice(0, 7);

  const [employees, assignments, weekLabels] = await Promise.all([listProfiles(), listShiftScheduleForMonth(month), listWeekLabels()]);
  const activeEmployees = employees.filter((e) => e.role === "employee" && e.active);
  const weeks = buildMonthWeeks(month);

  return (
    <main className="mx-auto max-w-[980px] px-6 py-10">
      <style>{`@media print { .print\\:hidden { display: none !important; } @page { size: landscape; } }`}</style>

      <Link href={`/admin/asistencia/calendario?mes=${month}`} className="text-[0.85rem] font-semibold text-admin-primary print:hidden">
        &larr; Volver al calendario
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="font-display text-xl text-admin-ink capitalize">FarmaLEM &middot; Calendario de turnos &middot; {monthLabel(month)}</h1>
        <PrintButton />
      </div>

      <div className="mt-5">
        <ShiftScheduleGrid weeks={weeks} assignments={assignments} employees={activeEmployees} weekLabels={weekLabels} />
      </div>
    </main>
  );
}
