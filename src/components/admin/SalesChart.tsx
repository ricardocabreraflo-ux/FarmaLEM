"use client";

import { useEffect, useState } from "react";
import type { DailySales } from "@/lib/sales-report";

const STORAGE_KEY = "farmalem_admin_sales_chart_visible";
const CHART_HEIGHT = 200;
const BAR_MAX_WIDTH = 18;
const BAR_RADIUS = 4;

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

function roundedTopBarPath(x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, h, w / 2);
  const bottom = y + h;
  return `M${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${bottom} L${x},${bottom} Z`;
}

export function SalesChart({ label, days }: { label: string; days: DailySales[] }) {
  const [visible, setVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  useEffect(() => {
    // localStorage no existe en el servidor, así que la preferencia no se
    // puede leer en un initializer perezoso sin desincronizar el HTML del
    // servidor del primer render del cliente. Es una sincronización legítima
    // desde un sistema externo, no un cálculo que debería vivir en el render.
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored !== null) setVisible(stored === "1");
    } catch {
      // localStorage puede no estar disponible; se queda visible por defecto.
    }
    setLoaded(true);
  }, []);

  function toggle() {
    const next = !visible;
    setVisible(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // sin persistencia, no pasa nada grave.
    }
  }

  const monthTotal = days.reduce((sum, d) => sum + d.total, 0);
  const max = Math.max(...days.map((d) => d.total), 1);
  const chartWidth = days.length * (BAR_MAX_WIDTH + 6);
  const plotHeight = CHART_HEIGHT - 24;
  const hovered = hoverDay !== null ? days.find((d) => d.day === hoverDay) : null;

  return (
    <section className="rounded-2xl border border-admin-border bg-admin-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-admin-ink">Ventas de {label}</h2>
          {loaded && visible && <p className="mt-0.5 text-[0.86rem] text-admin-ink-soft">Total del mes: {fmtMoney(monthTotal)}</p>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={visible}
          onClick={toggle}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${visible ? "bg-admin-primary" : "bg-admin-border"}`}
        >
          <span className="sr-only">{visible ? "Ocultar gráfica" : "Mostrar gráfica"}</span>
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${visible ? "translate-x-5" : "translate-x-1"}`} />
        </button>
      </div>

      {loaded && visible && (
        <div className="relative mt-5 overflow-x-auto">
          {hovered && (
            <div
              className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg bg-admin-primary-deep px-3 py-1.5 text-[0.78rem] font-semibold whitespace-nowrap text-white shadow-md"
              style={{ left: `${((hovered.day - 0.5) / days.length) * chartWidth}px` }}
            >
              Día {hovered.day} &middot; {fmtMoney(hovered.total)}
            </div>
          )}
          <svg width={chartWidth} height={CHART_HEIGHT} role="img" aria-label={`Ventas diarias de ${label}`} className="mt-8">
            <line x1="0" y1={plotHeight} x2={chartWidth} y2={plotHeight} stroke="var(--admin-border)" strokeWidth="1" />
            <line x1="0" y1={0} x2={chartWidth} y2={0} stroke="var(--admin-border)" strokeWidth="1" opacity="0.6" />
            <text x="2" y="11" fontSize="10" fill="var(--admin-ink-soft)">
              {fmtMoney(max)}
            </text>
            {days.map((d, i) => {
              const h = (d.total / max) * plotHeight;
              const x = i * (BAR_MAX_WIDTH + 6);
              const y = plotHeight - h;
              const isHovered = hoverDay === d.day;
              return (
                <path
                  key={d.day}
                  d={roundedTopBarPath(x, y, BAR_MAX_WIDTH, Math.max(h, d.total > 0 ? 2 : 0), BAR_RADIUS)}
                  fill="var(--admin-primary)"
                  opacity={isHovered ? 1 : 0.85}
                  tabIndex={0}
                  role="graphics-symbol"
                  aria-label={`Día ${d.day}: ${fmtMoney(d.total)}`}
                  onMouseEnter={() => setHoverDay(d.day)}
                  onMouseLeave={() => setHoverDay(null)}
                  onFocus={() => setHoverDay(d.day)}
                  onBlur={() => setHoverDay(null)}
                  style={{ cursor: "pointer" }}
                />
              );
            })}
            {days
              .filter((d) => d.day === 1 || d.day % 5 === 0)
              .map((d) => {
                const x = (d.day - 1) * (BAR_MAX_WIDTH + 6) + BAR_MAX_WIDTH / 2;
                return (
                  <text key={d.day} x={x} y={CHART_HEIGHT - 4} textAnchor="middle" fontSize="10.5" fill="var(--admin-ink-soft)">
                    {d.day}
                  </text>
                );
              })}
          </svg>
        </div>
      )}
    </section>
  );
}
