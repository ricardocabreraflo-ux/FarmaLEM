import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { upsertAttendance } from "@/lib/attendance";
import { mexicoCityToday, mondayOf, addDays } from "@/lib/dates";
import type { Profile } from "@/lib/profiles";
import { sendPunchWhatsAppNotification } from "@/lib/whatsapp";
import { sendPushToAdmins, sendPushToEmployee } from "@/lib/push";
import { buildEntradaDailyBrief, buildEntradaPromoPush, buildSalidaStockoutSummary } from "@/lib/employee-notifications";

export { mexicoCityToday };

export type ClockEventType = "Entrada" | "Salida";

export interface TimeClockEvent {
  id: string;
  employee_id: string;
  event_type: ClockEventType;
  occurred_at: string;
  is_late: boolean | null;
  late_minutes: number | null;
}

/**
 * Tolerancia de 10 minutos: llegan a revisar valores y dejar su punto de
 * venta listo antes de abrir — después de esta hora ya es retardo. Turnos
 * sin horario definido (p. ej. Administración) no tienen a qué compararse.
 */
const SHIFT_CUTOFF: Record<string, { hour: number; minute: number }> = {
  Matutino: { hour: 8, minute: 0 },
  Vespertino: { hour: 15, minute: 0 },
};

function mexicoCityTimeOfDay(iso: string): { hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Mexico_City", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(
    new Date(iso)
  );
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return { hour, minute };
}

/** null si ese turno no tiene horario definido (no aplica tolerancia). */
function computeLateness(shift: string, occurredAt: string): { isLate: boolean; lateMinutes: number } | null {
  const cutoff = SHIFT_CUTOFF[shift];
  if (!cutoff) return null;
  const { hour, minute } = mexicoCityTimeOfDay(occurredAt);
  const diff = hour * 60 + minute - (cutoff.hour * 60 + cutoff.minute);
  return { isLate: diff > 0, lateMinutes: Math.max(diff, 0) };
}

/** Cuántas Entradas con retardo lleva ese empleado esta semana (lunes a domingo) — incluye la de hoy si ya se guardó. */
export async function countLateEntriesThisWeek(employeeId: string): Promise<number> {
  const monday = mondayOf(mexicoCityToday());
  const sunday = addDays(monday, 6);
  const { start } = dayRange(monday);
  const { end } = dayRange(sunday);
  const { count, error } = await supabaseAdmin()
    .from("time_clock_events")
    .select("id", { count: "exact", head: true })
    .eq("employee_id", employeeId)
    .eq("event_type", "Entrada")
    .eq("is_late", true)
    .gte("occurred_at", start)
    .lte("occurred_at", end);
  if (error) throw new Error(`No se pudo contar los retardos: ${error.message}`);
  return count ?? 0;
}

function dayRange(date: string) {
  return { start: `${date}T00:00:00.000-06:00`, end: `${date}T23:59:59.999-06:00` };
}

function todayRange() {
  const today = mexicoCityToday();
  return { today, ...dayRange(today) };
}

/** Última marca de hoy de un empleado (o null si aún no marca), para avisar en pantalla antes de que vuelva a marcar. */
export async function lastEventToday(employeeId: string): Promise<TimeClockEvent | null> {
  const { start, end } = todayRange();
  const { data, error } = await supabaseAdmin()
    .from("time_clock_events")
    .select()
    .eq("employee_id", employeeId)
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`No se pudo leer el reloj checador: ${error.message}`);
  return data as TimeClockEvent | null;
}

/** El siguiente movimiento esperado: si no ha marcado hoy o su último movimiento fue Salida, toca Entrada; si no, Salida. */
export async function nextEventType(employeeId: string): Promise<ClockEventType> {
  const last = await lastEventToday(employeeId);
  return !last || last.event_type === "Salida" ? "Entrada" : "Salida";
}

/**
 * Registra el siguiente movimiento (Entrada/Salida) del empleado. Ya con la
 * Entrada deja lista la asistencia del día como "Asistió" (se ve al toque en
 * Asistencia/Sueldos); la Salida solo queda en la bitácora del reloj.
 */
export interface RegisterPunchResult {
  type: ClockEventType;
  occurredAt: string;
  isLate: boolean | null;
  lateMinutes: number | null;
  weeklyLateCount: number | null;
}

export async function registerPunch(employee: Profile, createdBy: string): Promise<RegisterPunchResult> {
  const type = await nextEventType(employee.id);
  const occurredAt = new Date().toISOString();
  const lateness = type === "Entrada" ? computeLateness(employee.shift, occurredAt) : null;

  const { error } = await supabaseAdmin()
    .from("time_clock_events")
    .insert({ employee_id: employee.id, event_type: type, occurred_at: occurredAt, is_late: lateness?.isLate ?? null, late_minutes: lateness?.lateMinutes ?? null });
  if (error) throw new Error(`No se pudo registrar el movimiento: ${error.message}`);

  const weeklyLateCount = lateness?.isLate ? await countLateEntriesThisWeek(employee.id) : null;
  const { today } = todayRange();

  if (type === "Entrada") {
    await upsertAttendance({
      workDate: today,
      employeeId: employee.id,
      shift: employee.shift,
      status: "Asistió",
      rate: employee.daily_rate,
      note: "Registrado por reloj checador",
      createdBy,
    });

    const [daily, promo] = await Promise.all([buildEntradaDailyBrief(employee, today), buildEntradaPromoPush()]);
    await sendPushToEmployee(employee.id, daily);
    if (promo) await sendPushToEmployee(employee.id, promo);
  } else {
    const stockoutSummary = await buildSalidaStockoutSummary(employee, today);
    if (stockoutSummary) await sendPushToAdmins(stockoutSummary);
  }

  await sendPunchWhatsAppNotification({ employeeName: employee.full_name, type, shift: employee.shift, occurredAt });

  const timeLabel = new Date(occurredAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });
  const latenessNote = lateness?.isLate ? ` · retardo de ${lateness.lateMinutes} min (van ${weeklyLateCount} esta semana)` : "";
  await sendPushToAdmins({
    title: `${lateness?.isLate ? "🔴" : type === "Entrada" ? "🟢" : "🔴"} ${employee.full_name}`,
    body: `Marcó su ${type} del turno ${employee.shift} a las ${timeLabel}${latenessNote}`,
    url: "/admin/reloj/bitacora",
  });

  if (weeklyLateCount === 3) {
    await sendPushToAdmins({
      title: `🔴 ${employee.full_name} llegó a 3 retardos esta semana`,
      body: `Turno ${employee.shift} — ya van 3 retardos esta semana, aplica la consecuencia/descuento acordado.`,
      url: "/admin/reloj/bitacora",
    });
  }

  return { type, occurredAt, isLate: lateness?.isLate ?? null, lateMinutes: lateness?.lateMinutes ?? null, weeklyLateCount };
}

export async function listEventsForDate(date: string): Promise<TimeClockEvent[]> {
  const { start, end } = dayRange(date);
  const { data, error } = await supabaseAdmin().from("time_clock_events").select().gte("occurred_at", start).lte("occurred_at", end).order("occurred_at", { ascending: true });
  if (error) throw new Error(`No se pudo leer el reloj checador: ${error.message}`);
  return data as TimeClockEvent[];
}

/** Todos los movimientos (Entrada y Salida) de un empleado entre dos fechas (inclusive) — para que vea su propio historial en Asistencia. */
export async function listEventsForEmployeeRange(employeeId: string, startDate: string, endDate: string): Promise<TimeClockEvent[]> {
  const start = dayRange(startDate).start;
  const end = dayRange(endDate).end;
  const { data, error } = await supabaseAdmin()
    .from("time_clock_events")
    .select()
    .eq("employee_id", employeeId)
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .order("occurred_at", { ascending: false });
  if (error) throw new Error(`No se pudo leer el reloj checador: ${error.message}`);
  return data as TimeClockEvent[];
}

function dateInMexico(iso: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date(iso));
}

/** Agrupa Entrada/Salida por día (a lo más una de cada una por día, el reloj alterna) para el historial personal. */
export function pairPunchesByDay(events: TimeClockEvent[]): [string, { entrada: string | null; salida: string | null }][] {
  const byDate = new Map<string, { entrada: string | null; salida: string | null }>();
  for (const e of events) {
    const d = dateInMexico(e.occurred_at);
    const entry = byDate.get(d) ?? { entrada: null, salida: null };
    if (e.event_type === "Entrada") entry.entrada = e.occurred_at;
    else entry.salida = e.occurred_at;
    byDate.set(d, entry);
  }
  return [...byDate.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

/** Entradas (no Salidas) entre dos fechas (inclusive), para el reporte semanal de nómina. */
export async function listEntradasForRange(startDate: string, endDate: string): Promise<TimeClockEvent[]> {
  const start = dayRange(startDate).start;
  const end = dayRange(endDate).end;
  const { data, error } = await supabaseAdmin()
    .from("time_clock_events")
    .select()
    .eq("event_type", "Entrada")
    .gte("occurred_at", start)
    .lte("occurred_at", end)
    .order("occurred_at", { ascending: true });
  if (error) throw new Error(`No se pudo leer el reloj checador: ${error.message}`);
  return data as TimeClockEvent[];
}
