export interface CalendarDay {
  date: string;
  dayNum: number;
  inMonth: boolean;
}

export interface CalendarWeek {
  label: string;
  days: CalendarDay[];
}

/** Semanas de lunes a domingo que cubren el mes (con días de meses vecinos para completar la primera/última semana). */
export function buildMonthWeeks(month: string): CalendarWeek[] {
  const [y, m] = month.split("-").map(Number);
  const firstOfMonth = new Date(y, m - 1, 1);
  const lastOfMonth = new Date(y, m, 0);

  // Lunes=0 ... Domingo=6
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - firstWeekday);

  const lastWeekday = (lastOfMonth.getDay() + 6) % 7;
  const gridEnd = new Date(lastOfMonth);
  gridEnd.setDate(gridEnd.getDate() + (6 - lastWeekday));

  const weeks: CalendarWeek[] = [];
  const cursor = new Date(gridStart);
  let weekIndex = 1;
  while (cursor <= gridEnd) {
    const days: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const iso = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
      days.push({ date: iso, dayNum: cursor.getDate(), inMonth: cursor.getMonth() === m - 1 });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push({ label: `S-${weekIndex}`, days });
    weekIndex++;
  }
  return weeks;
}
