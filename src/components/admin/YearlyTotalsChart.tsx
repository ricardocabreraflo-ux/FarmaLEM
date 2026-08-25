"use client";

import { useState } from "react";

const CHART_HEIGHT = 220;
const BAR_MAX_WIDTH = 46;
const BAR_GAP = 22;
const BAR_RADIUS = 6;

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

function roundedTopBarPath(x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, h, w / 2);
  const bottom = y + h;
  return `M${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${bottom} L${x},${bottom} Z`;
}

export function YearlyTotalsChart({ years, totalsByYear }: { years: string[]; totalsByYear: Record<string, number> }) {
  const [hoverYear, setHoverYear] = useState<string | null>(null);

  const max = Math.max(...years.map((y) => totalsByYear[y] ?? 0), 1);
  const chartWidth = years.length * (BAR_MAX_WIDTH + BAR_GAP);
  const plotHeight = CHART_HEIGHT - 28;
  const hovered = hoverYear ?? null;

  return (
    <section className="rounded-2xl border border-admin-border bg-admin-surface p-5">
      <h2 className="font-display text-lg text-admin-ink">Ventas por año</h2>
      <div className="relative mt-5 overflow-x-auto">
        {hovered && (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg bg-admin-primary-deep px-3 py-1.5 text-[0.78rem] font-semibold whitespace-nowrap text-white shadow-md"
            style={{ left: `${(years.indexOf(hovered) + 0.5) * (BAR_MAX_WIDTH + BAR_GAP)}px` }}
          >
            {hovered} &middot; {fmtMoney(totalsByYear[hovered] ?? 0)}
          </div>
        )}
        <svg width={chartWidth} height={CHART_HEIGHT} role="img" aria-label="Ventas totales por año" className="mt-8">
          <line x1="0" y1={plotHeight} x2={chartWidth} y2={plotHeight} stroke="var(--admin-border)" strokeWidth="1" />
          <line x1="0" y1={0} x2={chartWidth} y2={0} stroke="var(--admin-border)" strokeWidth="1" opacity="0.6" />
          <text x="2" y="11" fontSize="10" fill="var(--admin-ink-soft)">
            {fmtMoney(max)}
          </text>
          {years.map((y, i) => {
            const total = totalsByYear[y] ?? 0;
            const h = (total / max) * plotHeight;
            const x = i * (BAR_MAX_WIDTH + BAR_GAP);
            const barY = plotHeight - h;
            const isHovered = hoverYear === y;
            return (
              <g key={y}>
                <path
                  d={roundedTopBarPath(x, barY, BAR_MAX_WIDTH, Math.max(h, total > 0 ? 2 : 0), BAR_RADIUS)}
                  fill="var(--admin-primary)"
                  opacity={isHovered ? 1 : 0.85}
                  tabIndex={0}
                  role="graphics-symbol"
                  aria-label={`${y}: ${fmtMoney(total)}`}
                  onMouseEnter={() => setHoverYear(y)}
                  onMouseLeave={() => setHoverYear(null)}
                  onFocus={() => setHoverYear(y)}
                  onBlur={() => setHoverYear(null)}
                  style={{ cursor: "pointer" }}
                />
                <text x={x + BAR_MAX_WIDTH / 2} y={CHART_HEIGHT - 6} textAnchor="middle" fontSize="11.5" fontWeight={600} fill="var(--admin-ink-soft)">
                  {y}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
