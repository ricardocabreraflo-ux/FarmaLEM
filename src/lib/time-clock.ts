import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { upsertAttendance } from "@/lib/attendance";
import { mexicoCityToday } from "@/lib/dates";
import type { Profile } from "@/lib/profiles";

export { mexicoCityToday };

export type ClockEventType = "Entrada" | "Salida";

export interface TimeClockEvent {
  id: string;
  employee_id: string;
  event_type: ClockEventType;
  occurred_at: string;
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
export async function registerPunch(employee: Profile, createdBy: string): Promise<{ type: ClockEventType; occurredAt: string }> {
  const type = await nextEventType(employee.id);
  const occurredAt = new Date().toISOString();

  const { error } = await supabaseAdmin().from("time_clock_events").insert({ employee_id: employee.id, event_type: type, occurred_at: occurredAt });
  if (error) throw new Error(`No se pudo registrar el movimiento: ${error.message}`);

  if (type === "Entrada") {
    const { today } = todayRange();
    await upsertAttendance({
      workDate: today,
      employeeId: employee.id,
      shift: employee.shift,
      status: "Asistió",
      rate: employee.daily_rate,
      note: "Registrado por reloj checador",
      createdBy,
    });
  }

  return { type, occurredAt };
}

export async function listEventsForDate(date: string): Promise<TimeClockEvent[]> {
  const { start, end } = dayRange(date);
  const { data, error } = await supabaseAdmin().from("time_clock_events").select().gte("occurred_at", start).lte("occurred_at", end).order("occurred_at", { ascending: true });
  if (error) throw new Error(`No se pudo leer el reloj checador: ${error.message}`);
  return data as TimeClockEvent[];
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
