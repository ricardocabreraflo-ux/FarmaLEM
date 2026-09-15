import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { addDays, mexicoCityToday } from "@/lib/dates";

export interface BonusTier {
  id: string;
  month: string;
  shift: "Matutino" | "Vespertino";
  level: number;
  goal: number;
  bonus: number;
}

export interface BonusWeek {
  id: string;
  month: string;
  week: number;
  employee_id: string;
  shift: string;
  start_date: string;
  end_date: string;
  sales: number;
  absent: boolean;
}

export async function listBonusTiers(month: string): Promise<BonusTier[]> {
  const { data, error } = await supabaseAdmin().from("bonus_tiers").select().eq("month", month).order("shift").order("level");
  if (error) throw new Error(`No se pudieron leer las metas: ${error.message}`);
  return data as BonusTier[];
}

interface TierInput {
  shift: "Matutino" | "Vespertino";
  level: number;
  goal: number;
  bonus: number;
}

/** Reemplaza toda la pirámide de un mes (8 filas: 2 turnos x 4 niveles) en una sola operación. */
export async function replaceBonusTiers(month: string, tiers: TierInput[], createdBy: string): Promise<void> {
  const db = supabaseAdmin();
  const { error: delError } = await db.from("bonus_tiers").delete().eq("month", month);
  if (delError) throw new Error(delError.message);

  const { error } = await db.from("bonus_tiers").insert(
    tiers.map((t) => ({ month, shift: t.shift, level: t.level, goal: t.goal, bonus: t.bonus, created_by: createdBy }))
  );
  if (error) throw new Error(error.message);
}

export async function listBonusWeeks(month: string): Promise<BonusWeek[]> {
  const { data, error } = await supabaseAdmin().from("bonus_weeks").select().eq("month", month).order("week");
  if (error) throw new Error(`No se pudieron leer los bonos semanales: ${error.message}`);
  return data as BonusWeek[];
}

/** Semanas que empiezan justo en esa fecha (Lunes), sin importar a qué mes quedaron asignadas — para el comprobante semanal. */
export async function listBonusWeeksStarting(mondayDate: string): Promise<BonusWeek[]> {
  const { data, error } = await supabaseAdmin().from("bonus_weeks").select().eq("start_date", mondayDate);
  if (error) throw new Error(`No se pudieron leer los bonos semanales: ${error.message}`);
  return data as BonusWeek[];
}

export async function getBonusWeek(id: string): Promise<BonusWeek | null> {
  const { data, error } = await supabaseAdmin().from("bonus_weeks").select().eq("id", id).single();
  if (error) return null;
  return data as BonusWeek;
}

interface BonusWeekInput {
  month: string;
  week: number;
  employeeId: string;
  shift: string;
  startDate: string;
  endDate: string;
  sales: number;
  absent: boolean;
  createdBy: string;
}

export async function saveBonusWeek(input: BonusWeekInput, id?: string): Promise<void> {
  const row = {
    month: input.month,
    week: input.week,
    employee_id: input.employeeId,
    shift: input.shift,
    start_date: input.startDate,
    end_date: input.endDate,
    sales: input.sales,
    absent: input.absent,
    created_by: input.createdBy,
    updated_at: new Date().toISOString(),
  };
  const db = supabaseAdmin();
  const { error } = id ? await db.from("bonus_weeks").update(row).eq("id", id) : await db.from("bonus_weeks").insert(row);
  if (error) throw new Error(error.message);
}

/**
 * Calcula ventas (cortes aprobados en el rango) y si hubo alguna falta en el
 * rango. Un cierre no planeado (status "Cerrado") cuenta igual que una falta
 * para el bono; un "Día festivo" (cierre planeado) no lo afecta.
 */
export async function computeWeekFromRecords(employeeId: string, startDate: string, endDate: string, opts?: { includePending?: boolean }) {
  const db = supabaseAdmin();
  let cutsQuery = db.from("cuts").select("total").eq("employee_id", employeeId).gte("cut_date", startDate).lte("cut_date", endDate);
  cutsQuery = opts?.includePending ? cutsQuery.neq("status", "Rechazado") : cutsQuery.eq("status", "Aprobado");

  const [{ data: cuts, error: cutsError }, { data: att, error: attError }] = await Promise.all([
    cutsQuery,
    db.from("attendance").select("status").eq("employee_id", employeeId).in("status", ["Falta", "Cerrado"]).gte("work_date", startDate).lte("work_date", endDate),
  ]);
  if (cutsError) throw new Error(cutsError.message);
  if (attError) throw new Error(attError.message);

  const sales = (cuts ?? []).reduce((sum, c) => sum + Number(c.total), 0);
  const absent = (att ?? []).length > 0;
  return { sales, absent };
}

export interface MonthWeekWindow {
  week: number;
  startDate: string;
  endDate: string;
}

/**
 * Semanas Lunes-Domingo de ese mes calendario, numeradas en orden — una
 * semana es de ese mes si su jueves cae en ese mes (igual que ya se venía
 * haciendo a mano: la semana que cruza fin de mes se cuenta completa para
 * el mes donde caen más de sus días, nunca se parte a la mitad).
 */
export function weeksOfMonth(month: string): MonthWeekWindow[] {
  const [y, m] = month.split("-").map(Number);
  const lastDay = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
  const dow = new Date(`${month}-01T12:00:00`).getDay(); // 0 domingo … 4 jueves … 6 sábado
  let thursday = addDays(`${month}-01`, (4 - dow + 7) % 7);

  const weeks: MonthWeekWindow[] = [];
  let week = 1;
  while (thursday <= lastDay) {
    const monday = addDays(thursday, -3);
    weeks.push({ week, startDate: monday, endDate: addDays(monday, 6) });
    week++;
    thursday = addDays(thursday, 7);
  }
  return weeks;
}

/**
 * Calcula y guarda en automático las semanas de ese mes que ya terminaron y
 * todavía no tienen fila — para no depender de que alguien entre a
 * "Calcular semana" a mano cada vez. Nunca toca una semana que ya existe
 * (capturada a mano o generada antes), y no inventa una semana en $0 si esa
 * semana no tuvo ningún corte capturado (probablemente antes de usar el
 * panel). Regresa cuántas filas nuevas creó.
 */
export async function autoGenerateBonusWeeks(month: string, createdBy: string): Promise<number> {
  const db = supabaseAdmin();
  const today = mexicoCityToday();
  const windows = weeksOfMonth(month).filter((w) => w.endDate <= today);
  if (windows.length === 0) return 0;

  const [{ data: employees, error: empErr }, existingWeeks] = await Promise.all([
    db.from("profiles").select("id, shift").eq("role", "employee").eq("active", true),
    listBonusWeeks(month),
  ]);
  if (empErr) throw new Error(`No se pudieron leer los empleados: ${empErr.message}`);
  if (!employees || employees.length === 0) return 0;

  const existingKeys = new Set(existingWeeks.map((w) => `${w.week}:${w.employee_id}`));
  let created = 0;

  for (const w of windows) {
    const { count, error: cutsCountErr } = await db
      .from("cuts")
      .select("id", { count: "exact", head: true })
      .gte("cut_date", w.startDate)
      .lte("cut_date", w.endDate);
    if (cutsCountErr) throw new Error(`No se pudieron leer los cortes: ${cutsCountErr.message}`);
    if (!count) continue; // sin ningún corte esa semana — probablemente antes de usar el panel, no se inventa una semana en $0.

    for (const emp of employees as { id: string; shift: string }[]) {
      const key = `${w.week}:${emp.id}`;
      if (existingKeys.has(key)) continue;

      const { sales, absent } = await computeWeekFromRecords(emp.id, w.startDate, w.endDate);
      await saveBonusWeek({ month, week: w.week, employeeId: emp.id, shift: emp.shift, startDate: w.startDate, endDate: w.endDate, sales, absent, createdBy });
      created++;
    }
  }
  return created;
}

function tiersForShift(tiers: BonusTier[], shift: string) {
  return tiers.filter((t) => t.shift === shift).sort((a, b) => a.goal - b.goal);
}

export interface TierProgress {
  ordered: BonusTier[];
  currentTier: BonusTier | null;
  nextTier: BonusTier | null;
}

/** Dónde va un empleado en la escalera de niveles de su turno, dadas sus ventas hasta ahora — para el Inicio del equipo. */
export function tierProgress(sales: number, shift: string, tiers: BonusTier[]): TierProgress {
  const ordered = tiersForShift(tiers, shift);
  const reached = ordered.filter((t) => sales >= t.goal);
  const currentTier = reached.length > 0 ? reached[reached.length - 1] : null;
  const nextTier = ordered.find((t) => sales < t.goal) ?? null;
  return { ordered, currentTier, nextTier };
}

export function achievedTier(week: BonusWeek, tiers: BonusTier[]): BonusTier | null {
  const options = tiersForShift(tiers, week.shift);
  const reached = options.filter((t) => week.sales >= t.goal);
  return reached.length > 0 ? reached[reached.length - 1] : null;
}

export function earnedBonus(week: BonusWeek, tiers: BonusTier[]): number {
  if (week.absent) return 0;
  return achievedTier(week, tiers)?.bonus ?? 0;
}

export function targetForWeek(week: BonusWeek, tiers: BonusTier[]): number {
  const tier = achievedTier(week, tiers);
  if (tier) return tier.goal;
  const options = tiersForShift(tiers, week.shift);
  return options[0]?.goal ?? 0;
}
