"use client";

import { useState } from "react";

interface Category {
  name: string;
  mixPct: number;
  marginPct: number;
  color: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { name: "Patente", mixPct: 30, marginPct: 20, color: "#176b46" },
  { name: "Genérico", mixPct: 25, marginPct: 38, color: "#2563eb" },
  { name: "OTC", mixPct: 20, marginPct: 30, color: "#d97706" },
  { name: "Cuidado personal", mixPct: 15, marginPct: 40, color: "#7c3aed" },
  { name: "Servicios", mixPct: 10, marginPct: 80, color: "#0891b2" },
];

const DEFAULT_FIXED_COSTS = 85000;
const DEFAULT_TICKET = 180;
const DEFAULT_DAYS = 30;
const DEFAULT_SALES = 220000;

function fmtMoney(n: number) {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}
function fmtPct(n: number, opts?: Intl.NumberFormatOptions) {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("es-MX", { style: "percent", maximumFractionDigits: 1, ...opts }).format(n);
}

export function BreakevenSimulator() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [fixedCosts, setFixedCosts] = useState(DEFAULT_FIXED_COSTS);
  const [ticket, setTicket] = useState(DEFAULT_TICKET);
  const [days, setDays] = useState(DEFAULT_DAYS);
  const [estimatedSales, setEstimatedSales] = useState(DEFAULT_SALES);

  function updateCategory(index: number, field: "mixPct" | "marginPct", value: number) {
    setCategories((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  function reset() {
    setCategories(DEFAULT_CATEGORIES);
    setFixedCosts(DEFAULT_FIXED_COSTS);
    setTicket(DEFAULT_TICKET);
    setDays(DEFAULT_DAYS);
    setEstimatedSales(DEFAULT_SALES);
  }

  const totalMix = categories.reduce((sum, c) => sum + c.mixPct, 0);
  const mixIsValid = Math.abs(totalMix - 100) < 0.5;
  const weightedMargin = categories.reduce((sum, c) => sum + (c.mixPct / 100) * (c.marginPct / 100), 0);
  const breakeven = weightedMargin > 0 ? fixedCosts / weightedMargin : 0;
  const breakevenTicketsMonth = ticket > 0 ? breakeven / ticket : 0;
  const breakevenTicketsDay = days > 0 ? breakevenTicketsMonth / days : 0;
  const projectedProfit = estimatedSales * weightedMargin - fixedCosts;
  const belowBreakeven = estimatedSales < breakeven;
  const safetyMargin = breakeven > 0 ? (estimatedSales - breakeven) / breakeven : 0;
  const progressPct = breakeven > 0 ? Math.min(estimatedSales / breakeven, 1) : 0;

  return (
    <div className="mt-6 flex flex-col gap-5">
      {!mixIsValid && (
        <p className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] font-semibold text-admin-bad-text">
          El % de mezcla de categorías suma {totalMix.toFixed(1)}%, debe sumar 100% para que el cálculo sea correcto.
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-admin-border bg-admin-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base text-admin-ink">Datos generales</h2>
            <button type="button" onClick={reset} className="text-[0.82rem] font-semibold text-admin-primary hover:underline">
              Restablecer
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <NumberField label="Costos fijos del mes" value={fixedCosts} onChange={setFixedCosts} prefix="$" />
            <NumberField label="Ticket promedio" value={ticket} onChange={setTicket} prefix="$" />
            <NumberField label="Días de operación" value={days} onChange={setDays} />
            <NumberField label="Ventas estimadas del mes" value={estimatedSales} onChange={setEstimatedSales} prefix="$" />
          </div>

          <h3 className="mt-5 font-display text-[0.92rem] text-admin-ink">Mezcla de ventas por categoría</h3>
          <div className="mt-2 flex flex-col gap-2.5">
            {categories.map((cat, i) => (
              <div key={cat.name} className="flex items-center gap-2.5">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="w-[120px] shrink-0 text-[0.85rem] font-semibold text-admin-ink">{cat.name}</span>
                <label className="flex items-center gap-1.5 text-[0.78rem] text-admin-ink-soft">
                  Mezcla
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={cat.mixPct}
                    onChange={(e) => updateCategory(i, "mixPct", Number(e.target.value))}
                    className="w-16 rounded-lg border border-admin-border bg-admin-bg px-2 py-1.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
                  />
                  %
                </label>
                <label className="flex items-center gap-1.5 text-[0.78rem] text-admin-ink-soft">
                  Margen
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={cat.marginPct}
                    onChange={(e) => updateCategory(i, "marginPct", Number(e.target.value))}
                    className="w-16 rounded-lg border border-admin-border bg-admin-bg px-2 py-1.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
                  />
                  %
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-admin-border bg-admin-surface p-5">
          <h2 className="font-display text-base text-admin-ink">Resultado</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Margen ponderado" value={fmtPct(weightedMargin)} />
            <Stat label="Punto de equilibrio" value={fmtMoney(breakeven)} />
            <Stat label="Tickets/mes en el PE" value={Math.round(breakevenTicketsMonth).toLocaleString("es-MX")} />
            <Stat label="Tickets/día en el PE" value={breakevenTicketsDay.toFixed(1)} />
            <Stat label="Utilidad proyectada" value={fmtMoney(projectedProfit)} tone={projectedProfit >= 0 ? "ok" : "bad"} />
            <Stat
              label="Margen de seguridad"
              value={belowBreakeven ? `Faltan ${fmtMoney(breakeven - estimatedSales)}` : fmtPct(safetyMargin, { signDisplay: "exceptZero" })}
              tone={belowBreakeven ? "bad" : "ok"}
            />
          </div>

          <div className="mt-5">
            <span className="text-[0.78rem] text-admin-ink-soft">Ventas estimadas vs. punto de equilibrio</span>
            <div className="relative mt-2 h-4 w-full overflow-hidden rounded-full bg-admin-bg">
              <div className={`h-full rounded-full transition-all ${belowBreakeven ? "bg-admin-bad-text" : "bg-admin-primary"}`} style={{ width: `${progressPct * 100}%` }} />
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[auto_1fr]">
        <section className="rounded-2xl border border-admin-border bg-admin-surface p-5">
          <h2 className="font-display text-base text-admin-ink">Mezcla de ventas</h2>
          <div className="mt-4 flex items-center justify-center">
            <Donut categories={categories} />
          </div>
          <ul className="mt-4 flex flex-col gap-1.5">
            {categories.map((cat) => (
              <li key={cat.name} className="flex items-center gap-2 text-[0.82rem] text-admin-ink-soft">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name} &middot; {cat.mixPct}%
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-admin-border bg-admin-surface p-5">
          <h2 className="font-display text-base text-admin-ink">Cuánto margen aporta cada categoría</h2>
          <p className="mt-1 text-[0.8rem] text-admin-ink-soft">Mezcla % × margen % de cada categoría, en puntos del margen ponderado total.</p>
          <div className="mt-4">
            <ContributionBars categories={categories} />
          </div>
        </section>
      </div>

      <p className="text-[0.8rem] text-admin-ink-soft">
        Esta herramienta es una simulación manual — no está conectada a tus ventas reales porque el panel todavía no registra las ventas por categoría de
        producto. Úsala para explorar escenarios (&ldquo;qué pasa si vendo más servicios y menos patente&rdquo;).
      </p>
    </div>
  );
}

function NumberField({ label, value, onChange, prefix }: { label: string; value: number; onChange: (v: number) => void; prefix?: string }) {
  return (
    <label className="block text-[0.82rem] font-semibold text-admin-ink">
      {label}
      <div className="mt-1.5 flex items-center rounded-lg border border-admin-border bg-admin-bg px-3">
        {prefix && <span className="text-admin-ink-soft">{prefix}</span>}
        <input
          type="number"
          min="0"
          step="1"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full bg-transparent py-2.5 pl-1 text-admin-ink outline-none"
        />
      </div>
    </label>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "bad" }) {
  const color = tone === "ok" ? "text-admin-ok-text" : tone === "bad" ? "text-admin-bad-text" : "text-admin-ink";
  return (
    <div className="rounded-xl bg-admin-bg p-3">
      <span className="text-[0.74rem] text-admin-ink-soft">{label}</span>
      <p className={`mt-0.5 font-display text-[1.05rem] ${color}`}>{value}</p>
    </div>
  );
}

function Donut({ categories }: { categories: Category[] }) {
  const size = 180;
  const strokeWidth = 26;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = categories.reduce((sum, c) => sum + c.mixPct, 0) || 1;

  const segments = categories.reduce<Array<Category & { dash: number; offset: number }>>((acc, cat) => {
    const previousOffset = acc.length > 0 ? acc[acc.length - 1].offset + acc[acc.length - 1].dash : 0;
    const dash = (cat.mixPct / total) * circumference;
    acc.push({ ...cat, dash, offset: previousOffset });
    return acc;
  }, []);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Mezcla de ventas por categoría">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--admin-border)" strokeWidth={strokeWidth} />
      {segments.map((seg) => (
        <circle
          key={seg.name}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeWidth - 4}
          strokeDasharray={`${Math.max(seg.dash - 2, 0)} ${circumference}`}
          strokeDashoffset={-seg.offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

function ContributionBars({ categories }: { categories: Category[] }) {
  const contributions = categories.map((c) => ({ ...c, contribution: (c.mixPct / 100) * (c.marginPct / 100) }));
  const max = Math.max(...contributions.map((c) => c.contribution), 0.01);

  return (
    <div className="flex flex-col gap-3">
      {contributions.map((c) => (
        <div key={c.name} className="flex items-center gap-3">
          <span className="w-[110px] shrink-0 text-[0.82rem] text-admin-ink-soft">{c.name}</span>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-admin-bg">
            <div className="h-full rounded-full" style={{ width: `${(c.contribution / max) * 100}%`, backgroundColor: c.color }} />
          </div>
          <span className="w-12 shrink-0 text-right text-[0.82rem] font-semibold text-admin-ink">{fmtPct(c.contribution)}</span>
        </div>
      ))}
    </div>
  );
}
