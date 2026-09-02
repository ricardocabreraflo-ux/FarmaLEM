import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

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
