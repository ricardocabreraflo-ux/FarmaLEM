export interface InventoryCategory {
  key: string;
  label: string;
  colorVar: string;
  softVar: string;
}

/**
 * Las 8 categorías de inventario de la farmacia, en el orden fijo del ciclo
 * de rotación. El orden importa: define qué categoría le toca a cada turno
 * cada día (ver categoryForShift).
 */
export const INVENTORY_CATEGORIES: InventoryCategory[] = [
  { key: "sueltos", label: "Sueltos", colorVar: "var(--admin-primary)", softVar: "var(--admin-primary-soft)" },
  { key: "vitaminas", label: "Vitaminas", colorVar: "var(--admin-amber)", softVar: "var(--admin-amber-soft)" },
  { key: "antibioticos", label: "Antibióticos", colorVar: "var(--admin-cat-3)", softVar: "var(--admin-cat-3-soft)" },
  { key: "generico", label: "Genérico", colorVar: "var(--admin-cat-4)", softVar: "var(--admin-cat-4-soft)" },
  { key: "patente", label: "Patente", colorVar: "var(--admin-cat-5)", softVar: "var(--admin-cat-5-soft)" },
  { key: "dulceria", label: "Dulcería", colorVar: "var(--admin-cat-6)", softVar: "var(--admin-cat-6-soft)" },
  { key: "perfumeria1", label: "Perfumería 1", colorVar: "var(--admin-cat-7)", softVar: "var(--admin-cat-7-soft)" },
  { key: "perfumeria2", label: "Perfumería 2", colorVar: "var(--admin-cat-8)", softVar: "var(--admin-cat-8-soft)" },
];

/**
 * Día 0 del ciclo — a partir de aquí se cuenta cuántos días han pasado para
 * saber qué categoría le toca a matutino ese día; vespertino va 4 categorías
 * adelante (la mitad del ciclo de 8), así nunca coincide con matutino el
 * mismo día y, con el paso de los días, igual va recorriendo las 8 sin
 * repetirse. Domingo no trabaja matutino y sábado no trabaja vespertino —
 * ese día nada más se cuenta el turno que sí está.
 */
const ROTATION_EPOCH = new Date(Date.UTC(2026, 0, 1));
const VESPERTINO_OFFSET = 4; // mitad de las 8 categorías

/** domingo=0 ... sábado=6 (Date.getUTCDay()). */
const MATUTINO_OFF_WEEKDAY = 0; // domingo
const VESPERTINO_OFF_WEEKDAY = 6; // sábado

function daysSinceEpoch(date: Date): number {
  const utcDate = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.round((utcDate - ROTATION_EPOCH.getTime()) / 86_400_000);
}

function categoryForOffset(count: number): InventoryCategory {
  const idx = ((count % 8) + 8) % 8;
  return INVENTORY_CATEGORIES[idx];
}

/** dateStr en formato 'YYYY-MM-DD'. null si ese turno no trabaja ese día de la semana. */
export function categoryForShift(dateStr: string, shift: "matutino" | "vespertino"): InventoryCategory | null {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const offWeekday = shift === "matutino" ? MATUTINO_OFF_WEEKDAY : VESPERTINO_OFF_WEEKDAY;
  if (date.getUTCDay() === offWeekday) return null;
  const count = daysSinceEpoch(date) + (shift === "vespertino" ? VESPERTINO_OFFSET : 0);
  return categoryForOffset(count);
}

export interface CalendarDay {
  dateStr: string;
  day: number;
  inMonth: boolean;
  isWeekend: boolean;
  weekendShiftLabel: string | null;
  categoryMatutino: InventoryCategory | null;
  categoryVespertino: InventoryCategory | null;
}

const WEEKEND_SHIFT_LABEL: Record<number, string | null> = {
  0: "Turno vespertino",
  6: "Turno matutino",
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Semanas (lunes a domingo) que cubren el mes 'YYYY-MM', incluyendo los
 * días de relleno del mes anterior/siguiente para completar cada semana —
 * igual que un calendario normal.
 */
export function buildMonthCalendar(month: string): CalendarDay[][] {
  const [y, m] = month.split("-").map(Number);
  const firstOfMonth = new Date(Date.UTC(y, m - 1, 1));
  const lastOfMonth = new Date(Date.UTC(y, m, 0));

  // Lunes=1..Domingo=7, para retroceder al lunes de esa semana.
  const isoWeekday = (firstOfMonth.getUTCDay() + 6) % 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setUTCDate(gridStart.getUTCDate() - isoWeekday);

  const weeks: CalendarDay[][] = [];
  const cursor = new Date(gridStart);
  for (;;) {
    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const dateStr = `${cursor.getUTCFullYear()}-${pad(cursor.getUTCMonth() + 1)}-${pad(cursor.getUTCDate())}`;
      const weekday = cursor.getUTCDay();
      week.push({
        dateStr,
        day: cursor.getUTCDate(),
        inMonth: cursor.getUTCMonth() + 1 === m && cursor.getUTCFullYear() === y,
        isWeekend: weekday === 0 || weekday === 6,
        weekendShiftLabel: WEEKEND_SHIFT_LABEL[weekday] ?? null,
        categoryMatutino: categoryForShift(dateStr, "matutino"),
        categoryVespertino: categoryForShift(dateStr, "vespertino"),
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    weeks.push(week);
    if (cursor > lastOfMonth) break;
  }
  return weeks;
}

export interface FixedShiftTask {
  task: string;
  sub: string;
}

export interface FixedDaySchedule {
  weekday: string;
  matutino: FixedShiftTask | null;
  vespertino: FixedShiftTask | null;
}

/**
 * Limpieza semanal por anaquel — fija, no rota por mes (a diferencia de la
 * distribución de anaqueles del fin de semana, que sí depende del mes y
 * vive en /admin/anaqueles).
 */
export const FIXED_WEEKLY_SCHEDULE: FixedDaySchedule[] = [
  {
    weekday: "Lunes",
    matutino: { task: "Anaqueles 2 y 4", sub: "+ limpieza de baño" },
    vespertino: { task: "Anaqueles 1 y 3", sub: "+ consultorio · baño" },
  },
  {
    weekday: "Martes",
    matutino: { task: "Anaqueles 6 y 8", sub: "+ limpieza de baño" },
    vespertino: { task: "Vitrina de abajo", sub: "+ toallas · baño" },
  },
  {
    weekday: "Miércoles",
    matutino: { task: "Vitrina de arriba", sub: "+ limpieza de baño" },
    vespertino: { task: "Anaqueles 5 y 7", sub: "+ limpieza de baño" },
  },
  {
    weekday: "Jueves",
    matutino: { task: "Anaqueles 2 y 10", sub: "+ consultorio · baño" },
    vespertino: { task: "Anaqueles 1 y 9", sub: "+ limpieza de baño" },
  },
  {
    weekday: "Viernes",
    matutino: { task: "Anaqueles 4 y 8", sub: "+ limpieza de baño" },
    vespertino: { task: "Anaqueles 3 y 5", sub: "+ limpieza de baño" },
  },
  {
    weekday: "Sábado",
    matutino: { task: "Vitrina + 2 anaqueles", sub: "según el mes — ver Distribución de anaqueles" },
    vespertino: null,
  },
  {
    weekday: "Domingo",
    matutino: null,
    vespertino: { task: "Vitrina + 2 anaqueles", sub: "según el mes — ver Distribución de anaqueles" },
  },
];
