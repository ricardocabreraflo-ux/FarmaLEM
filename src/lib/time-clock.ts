import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { verifyPassword } from "@/lib/password";
import { upsertAttendance } from "@/lib/attendance";
import type { Profile } from "@/lib/profiles";

export type ClockEventType = "Entrada" | "Salida";

export interface TimeClockEvent {
  id: string;
  employee_id: string;
  event_type: ClockEventType;
  occurred_at: string;
}

function todayRange() {
  const today = new Date().toISOString().slice(0, 10);
  return { today, start: `${today}T00:00:00`, end: `${today}T23:59:59.999` };
}

/** Busca entre los empleados activos con PIN configurado cuál corresponde al PIN capturado. */
export async function findEmployeeByClockPin(pin: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin().from("profiles").select().eq("active", true).not("clock_pin_hash", "is", null);
  if (error) throw new Error(`No se pudo verificar el PIN: ${error.message}`);
  const candidates = (data ?? []) as Profile[];
  return candidates.find((p) => p.clock_pin_hash && verifyPassword(pin, p.clock_pin_hash)) ?? null;
}

async function lastEventToday(employeeId: string): Promise<TimeClockEvent | null> {
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
 * Registra el siguiente movimiento (Entrada/Salida) del empleado. Al marcar
 * Salida, si hubo Entrada el mismo día, deja lista la asistencia del día
 * como "Asistió" para que Sueldos ya no requiera capturarla aparte.
 */
export async function registerPunch(employee: Profile, createdBy: string): Promise<{ type: ClockEventType; occurredAt: string }> {
  const type = await nextEventType(employee.id);
  const occurredAt = new Date().toISOString();

  const { error } = await supabaseAdmin().from("time_clock_events").insert({ employee_id: employee.id, event_type: type, occurred_at: occurredAt });
  if (error) throw new Error(`No se pudo registrar el movimiento: ${error.message}`);

  if (type === "Salida") {
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
  const { data, error } = await supabaseAdmin()
    .from("time_clock_events")
    .select()
    .gte("occurred_at", `${date}T00:00:00`)
    .lte("occurred_at", `${date}T23:59:59.999`)
    .order("occurred_at", { ascending: true });
  if (error) throw new Error(`No se pudo leer el reloj checador: ${error.message}`);
  return data as TimeClockEvent[];
}
