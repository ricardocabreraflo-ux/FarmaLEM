import type { Metadata } from "next";
import Link from "next/link";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { getMonthlyFinancials } from "@/lib/financials";
import { getBreakevenMargin } from "@/lib/breakeven";
import { AdminShell } from "@/components/admin/AdminShell";
import { MonthPicker } from "@/components/admin/MonthPicker";

export const metadata: Metadata = { title: "Punto de equilibrio" };
export const dynamic = "force-dynamic";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

function fmtPct(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" }).format(n);
}

export default async function PuntoEquilibrioPage({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const session = await requireAdminSession();
  const { mes } = await searchParams;
  const now = new Date();
  const month = mes || now.toISOString().slice(0, 7);
  const isCurrentMonth = month === now.toISOString().slice(0, 7);

  const [profile, financials, marginPercent] = await Promise.all([getProfileById(session.uid), getMonthlyFinancials(month), getBreakevenMargin()]);

  const fixedCosts = financials.operating;
  const sales = financials.sales;
  const breakeven = marginPercent > 0 ? fixedCosts / marginPercent : 0;
  const [y, m] = month.split("-").map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const daysElapsed = isCurrentMonth ? now.getDate() : daysInMonth;
  const projectedByMonthEnd = daysElapsed > 0 ? (sales / daysElapsed) * daysInMonth : 0;
  const projectedProfit = sales * marginPercent - fixedCosts;
  const belowBreakeven = sales < breakeven;
  const safetyMargin = breakeven > 0 ? (sales - breakeven) / breakeven : 0;
  const progressPct = breakeven > 0 ? Math.min(sales / breakeven, 1) : 0;

  return (
    <AdminShell activeHref="/admin/punto-equilibrio" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-admin-ink">Punto de equilibrio</h1>
        <Link href="/admin/configuracion" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink">
          Ajustar margen
        </Link>
      </div>
      <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">
        Calculado con tus costos fijos y ventas reales del mes, más un margen de contribución estimado de <strong>{fmtPct(marginPercent)}</strong>{" "}
        (configurable).
      </p>

      <MonthPicker month={month} basePath="/admin/punto-equilibrio" />

      <section className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Punto de equilibrio" value={fmtMoney(breakeven)} />
        <Stat label={isCurrentMonth ? "Ventas del mes (a la fecha)" : "Ventas del mes"} value={fmtMoney(sales)} />
        {isCurrentMonth && <Stat label="Proyección a fin de mes" value={fmtMoney(projectedByMonthEnd)} />}
        <Stat label="Utilidad proyectada" value={fmtMoney(projectedProfit)} tone={projectedProfit >= 0 ? "ok" : "bad"} />
      </section>

      <section className="mt-5 rounded-2xl border border-admin-border bg-admin-surface p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-base text-admin-ink">Qué tan cerca está del punto de equilibrio</h2>
          <span className={`text-[0.95rem] font-bold ${belowBreakeven ? "text-admin-bad-text" : "text-admin-ok-text"}`}>
            {belowBreakeven ? `Faltan ${fmtMoney(breakeven - sales)}` : `${fmtPct(safetyMargin)} arriba del punto de equilibrio`}
          </span>
        </div>

        <div className="relative mt-5 h-5 w-full overflow-hidden rounded-full bg-admin-bg">
          <div className={`h-full rounded-full transition-all ${belowBreakeven ? "bg-admin-bad-text" : "bg-admin-primary"}`} style={{ width: `${progressPct * 100}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-[0.78rem] text-admin-ink-soft">
          <span>$0</span>
          <span>Punto de equilibrio: {fmtMoney(breakeven)}</span>
        </div>
      </section>

      <p className="mt-5 text-[0.8rem] text-admin-ink-soft">
        Los costos fijos y las ventas se toman del Estado de resultados y los cortes aprobados de este mes. El margen de contribución es una estimación que
        ajustas en Configuración — el panel aún no separa las ventas por categoría de producto.
      </p>
    </AdminShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "bad" }) {
  const color = tone === "ok" ? "text-admin-ok-text" : tone === "bad" ? "text-admin-bad-text" : "text-admin-ink";
  return (
    <div className="rounded-2xl border border-admin-border bg-admin-surface p-4">
      <span className="text-[0.78rem] text-admin-ink-soft">{label}</span>
      <p className={`mt-1 font-display text-lg ${color}`}>{value}</p>
    </div>
  );
}
