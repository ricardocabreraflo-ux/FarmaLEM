import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { buildMonthCalendar } from "@/lib/actividades";
import { mexicoCityToday } from "@/lib/dates";
import { PrintButton } from "@/components/admin/PrintButton";
import { ActivityCalendarGrid, CategoryLegend } from "@/components/admin/ActivityCalendarGrid";
import { FixedWeeklyScheduleTable } from "@/components/admin/FixedWeeklyScheduleTable";

export const metadata: Metadata = { title: "Imprimir calendario de actividades" };
export const dynamic = "force-dynamic";

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default async function ImprimirActividadesPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  await requireAdminSession();
  const { mes } = await searchParams;
  const month = mes || mexicoCityToday().slice(0, 7);

  const weeks = buildMonthCalendar(month);

  return (
    <main className="force-light-admin mx-auto max-w-[1000px] px-6 py-10 print:px-0 print:py-1">
      <style>{`
        @media print {
          .print\\:hidden { display: none !important; }
          @page { margin: 10mm; size: landscape; }
        }
        .force-light-admin {
          --admin-bg: #f3f6f4;
          --admin-surface: #ffffff;
          --admin-border: rgb(23 33 27 / 0.12);
          --admin-ink: #17211b;
          --admin-ink-soft: #59665d;
          --admin-primary: #176b46;
          --admin-primary-deep: #0f4d33;
          --admin-primary-soft: #e8f1ec;
          --admin-amber: #b5720a;
          --admin-amber-soft: #fbeed9;
          --admin-cat-3: #a5471f;
          --admin-cat-3-soft: #f7e6dd;
          --admin-cat-4: #1f6b7a;
          --admin-cat-4-soft: #e2eff1;
          --admin-cat-5: #6f7a1f;
          --admin-cat-5-soft: #eef1de;
          --admin-cat-6: #8a3a63;
          --admin-cat-6-soft: #f4e4ed;
          --admin-cat-7: #4a4f9e;
          --admin-cat-7-soft: #e6e6f5;
          --admin-cat-8: #3f6b8a;
          --admin-cat-8-soft: #e2eaf0;
          background: var(--admin-bg);
          color: var(--admin-ink);
        }
      `}</style>

      <Link href={`/admin/actividades?mes=${month}`} className="text-[0.85rem] font-semibold text-admin-primary print:hidden">
        &larr; Volver
      </Link>
      <div className="mt-2 flex items-center justify-between print:mt-0">
        <h1 className="font-display text-xl text-admin-ink print:text-[1.05rem]">FarmaLEM &middot; Calendario de actividades &middot; {monthLabel(month)}</h1>
        <PrintButton />
      </div>

      <h2 className="mt-5 font-display text-base text-admin-ink print:mt-3 print:text-[0.9rem]">Limpieza semanal</h2>
      <div className="mt-2 print:mt-1.5 print:break-inside-avoid">
        <FixedWeeklyScheduleTable />
      </div>

      <h2 className="mt-5 font-display text-base text-admin-ink print:mt-3 print:text-[0.9rem]">Inventario del día</h2>
      <div className="mt-2 print:mt-1.5">
        <CategoryLegend />
      </div>
      <div className="mt-3 print:mt-2 print:break-inside-avoid">
        <ActivityCalendarGrid weeks={weeks} />
      </div>
    </main>
  );
}
