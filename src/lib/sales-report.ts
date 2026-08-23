import "server-only";
import { listCuts } from "@/lib/cuts";

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

/** Ventas mensuales a partir de cortes aprobados, ordenadas cronológicamente, con variación contra el mes anterior. */
export async function monthlySales(): Promise<MonthlySales[]> {
  const cuts = await listCuts();
  const totalsByMonth = new Map<string, number>();
  for (const c of cuts) {
    if (c.status !== "Aprobado") continue;
    const month = c.cut_date.slice(0, 7);
    totalsByMonth.set(month, (totalsByMonth.get(month) ?? 0) + c.total);
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
