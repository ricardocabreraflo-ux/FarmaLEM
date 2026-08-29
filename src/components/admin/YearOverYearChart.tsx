"use client";

import { useState } from "react";

const CHART_W = 900;
const CHART_H = 320;
const PAD_L = 54;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 28;
const PLOT_W = CHART_W - PAD_L - PAD_R;
const PLOT_H = CHART_H - PAD_T - PAD_B;

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

function x(mi: number) {
  return PAD_L + (mi / 11) * PLOT_W;
}
function y(v: number, max: number) {
  return PAD_T + PLOT_H - (v / max) * PLOT_H;
}

function pathFor(series: (number | null)[], max: number) {
  let d = "";
  series.forEach((v, mi) => {
    if (v === null) return;
    d += `${d === "" ? "M" : "L"}${x(mi)},${y(v, max)} `;
  });
  return d.trim();
}

function lastIndex(series: (number | null)[]) {
  for (let i = series.length - 1; i >= 0; i--) if (series[i] !== null) return i;
  return -1;
}

export function YearOverYearChart({ years, rows }: { years: string[]; rows: { monthName: string; byYear: Record<string, number> }[] }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (years.length === 0) return null;

  const currentYear = years[years.length - 1];
  const prevYear = years.length >= 2 ? years[years.length - 2] : null;
  const contextYears = years.slice(0, Math.max(years.length - 2, 0));

  const seriesFor = (year: string) => rows.map((r) => r.byYear[year] ?? null);
  const curSeries = seriesFor(currentYear);
  const prevSeries = prevYear ? seriesFor(prevYear) : null;
  const contextSeries = contextYears.map(seriesFor);

  const allValues = years.flatMap(seriesFor).filter((v): v is number => v !== null);
  const max = allValues.length > 0 ? Math.max(...allValues) * 1.08 : 1;

  const curLastIdx = lastIndex(curSeries);

  return (
    <section className="rounded-2xl border border-admin-border bg-admin-surface p-5">
      <h2 className="font-display text-lg text-admin-ink">Año contra año</h2>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[0.82rem] text-admin-ink-soft">
        <span className="flex items-center gap-2">
          <span className="h-[3px] w-4 rounded-full bg-admin-primary" />
          {currentYear} (actual)
        </span>
        {prevYear && (
          <span className="flex items-center gap-2">
            <span
              className="h-[3px] w-4 rounded-full"
              style={{ backgroundImage: "repeating-linear-gradient(90deg, var(--admin-primary) 0 4px, transparent 4px 7px)", opacity: 0.6 }}
            />
            {prevYear}
          </span>
        )}
        {contextYears.length > 0 && (
          <span className="flex items-center gap-2">
            <span className="h-[3px] w-4 rounded-full bg-admin-border" />
            {contextYears.length === 1 ? contextYears[0] : `${contextYears[0]}–${contextYears[contextYears.length - 1]}`} (contexto)
          </span>
        )}
      </div>

      <div className="relative mt-4 overflow-x-auto">
        {hoverIdx !== null && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg bg-admin-primary-deep px-3 py-1.5 text-[0.78rem] font-semibold whitespace-nowrap text-white shadow-md"
            style={{ left: `${(x(hoverIdx) / CHART_W) * 100}%` }}
          >
            {rows[hoverIdx].monthName}: {curSeries[hoverIdx] !== null ? fmtMoney(curSeries[hoverIdx]!) : "—"}
            {prevSeries && <span className="opacity-80"> · {prevYear}: {prevSeries[hoverIdx] !== null ? fmtMoney(prevSeries[hoverIdx]!) : "—"}</span>}
          </div>
        )}

        <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} role="img" aria-label="Ventas año contra año" className="mt-9 w-full min-w-[560px]">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const gy = PAD_T + PLOT_H - f * PLOT_H;
            return (
              <g key={f}>
                <line x1={PAD_L} y1={gy} x2={CHART_W - PAD_R} y2={gy} stroke="var(--admin-border)" strokeWidth="1" />
                <text x="0" y={gy + 3} fontSize="10.5" fill="var(--admin-ink-soft)">
                  {fmtMoney(Math.round((max * f) / 100) * 100)}
                </text>
              </g>
            );
          })}

          {rows.map((r, mi) => (
            <text key={r.monthName} x={x(mi)} y={CHART_H - 6} textAnchor="middle" fontSize="10.5" fill="var(--admin-ink-soft)">
              {r.monthName.slice(0, 3)}
            </text>
          ))}

          {contextSeries.map((series, i) => (
            <path key={i} d={pathFor(series, max)} fill="none" stroke="var(--admin-border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          ))}

          {prevSeries && (
            <path d={pathFor(prevSeries, max)} fill="none" stroke="var(--admin-primary)" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
          )}

          <path d={pathFor(curSeries, max)} fill="none" stroke="var(--admin-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {curLastIdx >= 0 && (
            <circle cx={x(curLastIdx)} cy={y(curSeries[curLastIdx]!, max)} r="4.5" fill="var(--admin-primary)" stroke="var(--admin-surface)" strokeWidth="2" />
          )}

          {hoverIdx !== null && <line x1={x(hoverIdx)} y1={PAD_T} x2={x(hoverIdx)} y2={PAD_T + PLOT_H} stroke="var(--admin-ink-soft)" strokeWidth="1" strokeDasharray="3 3" />}

          {rows.map((_, mi) => (
            <rect
              key={mi}
              x={x(mi) - PLOT_W / 22}
              y={PAD_T}
              width={PLOT_W / 11}
              height={PLOT_H}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(mi)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </svg>
      </div>
    </section>
  );
}
