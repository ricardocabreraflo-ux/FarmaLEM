import "server-only";
import { listCuts } from "@/lib/cuts";
import { listHistoricalSales } from "@/lib/historical-sales";

export interface MonthlySales {
  month: string;
  label: string;
  total: number;
  diff: number | null;
  pctChange: number | null;
}

export interface YearlyRow {
  monthName: string;
  byYear: Record<string, number>;
}

const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

/**
 * Ventas mensuales, ordenadas cronológicamente, con variación contra el mes
 * anterior. Para cada mes usa los cortes aprobados si hay alguno capturado;
 * si no hay ninguno (meses previos al panel), cae al total histórico
 * cargado a mano en `historical_sales`.
 */
export async function monthlySales(): Promise<MonthlySales[]> {
  const [cuts, historical] = await Promise.all([listCuts(), listHistoricalSales()]);
  const totalsByMonth = new Map<string, number>();
  for (const c of cuts) {
    if (c.status !== "Aprobado") continue;
    const month = c.cut_date.slice(0, 7);
    totalsByMonth.set(month, (totalsByMonth.get(month) ?? 0) + c.total);
  }
  for (const h of historical) {
    if (!totalsByMonth.has(h.month)) totalsByMonth.set(h.month, h.total);
  }

  const months = [...totalsByMonth.keys()].sort();
  return months.map((month, i) => {
    const total = totalsByMonth.get(month) ?? 0;
    const prev = i > 0 ? totalsByMonth.get(months[i - 1])! : null;
    const diff = prev === null ? null : total - prev;
    const pctChange = prev === null || prev === 0 ? null : diff! / prev;
    return { month, label: monthLabel(month), total, diff, pctChange };
  });
}

export interface DailySales {
  day: number;
  total: number;
}

/** Ventas día por día del mes en curso, a partir de cortes aprobados. Incluye los días sin ventas en 0. */
export async function dailySalesForCurrentMonth(): Promise<{ month: string; label: string; days: DailySales[] }> {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  const cuts = await listCuts();
  const totalsByDay = new Map<number, number>();
  for (const c of cuts) {
    if (c.status !== "Aprobado" || !c.cut_date.startsWith(month)) continue;
    const day = Number(c.cut_date.slice(8, 10));
    totalsByDay.set(day, (totalsByDay.get(day) ?? 0) + c.total);
  }

  const days: DailySales[] = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, total: totalsByDay.get(i + 1) ?? 0 }));
  return { month, label: monthLabel(month), days };
}

/** Pivote año contra año: una fila por mes del calendario, una columna por cada año con datos. */
export async function yearlySalesGrid(): Promise<{ years: string[]; rows: YearlyRow[]; totalsByYear: Record<string, number> }> {
  const months = await monthlySales();
  const years = [...new Set(months.map((m) => m.month.slice(0, 4)))].sort();

  const rows: YearlyRow[] = MONTH_NAMES.map((monthName) => ({ monthName, byYear: {} }));
  const totalsByYear: Record<string, number> = Object.fromEntries(years.map((y) => [y, 0]));

  for (const m of months) {
    const [year, monthNum] = m.month.split("-");
    const rowIndex = Number(monthNum) - 1;
    rows[rowIndex].byYear[year] = m.total;
    totalsByYear[year] = (totalsByYear[year] ?? 0) + m.total;
  }

  return { years, rows, totalsByYear };
}
