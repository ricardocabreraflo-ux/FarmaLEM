import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { getTaskChecksForDate, markTaskDone, type PendingTask } from "@/lib/operational-tasks";
import { getProfileById } from "@/lib/profiles";
import { logAction } from "@/lib/history";
import { sendPushToAdmins } from "@/lib/push";
import { mexicoCityToday } from "@/lib/dates";

export type DeepCleanShift = "Matutino" | "Vespertino";

export interface DeepCleanOccurrence {
  id: string;
  occurredOn: string;
  firstHalfShift: DeepCleanShift;
  createdAt: string;
}

function keyForShift(shift: DeepCleanShift): string {
  return `limpieza-profunda-${shift === "Matutino" ? "matutino" : "vespertino"}`;
}

export function isDeepCleanKey(key: string): boolean {
  return key.startsWith("limpieza-profunda-");
}

/**
 * Limpieza profunda (dos veces al mes, fecha capturada a mano en vez de
 * calculada) — se divide en Mitad 1 y Mitad 2, alternando entre Matutino y
 * Vespertino cada vez que se registra una nueva fecha. Reutiliza
 * operational_task_checks (misma llave "limpieza-profunda-<turno>", el
 * check_date de ese día distingue una ocasión de otra) para el seguimiento
 * "Ya lo hice", igual que las demás actividades.
 */
export async function listRecentDeepCleanOccurrences(limit = 5): Promise<DeepCleanOccurrence[]> {
  const { data, error } = await supabaseAdmin()
    .from("deep_clean_occurrences")
    .select("id, occurred_on, first_half_shift, created_at")
    .order("occurred_on", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`No se pudieron leer las limpiezas profundas: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id,
    occurredOn: row.occurred_on,
    firstHalfShift: row.first_half_shift as DeepCleanShift,
    createdAt: row.created_at,
  }));
}

/** Registra (o corrige, si ya existía esa fecha) una ocasión de limpieza profunda. */
export async function createDeepCleanOccurrence(date: string, firstHalfShift: DeepCleanShift, createdBy: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("deep_clean_occurrences")
    .upsert({ occurred_on: date, first_half_shift: firstHalfShift, created_by: createdBy }, { onConflict: "occurred_on" });
  if (error) throw new Error(`No se pudo registrar la limpieza profunda: ${error.message}`);
}

export async function deleteDeepCleanOccurrence(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("deep_clean_occurrences").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export interface TodayDeepCleanActivity {
  key: string;
  label: string;
}

/** Si hoy toca limpieza profunda, qué mitad le toca a ese turno — null si hoy no hay ninguna registrada. */
export async function getTodayDeepCleanActivity(shift: DeepCleanShift, date: string): Promise<TodayDeepCleanActivity | null> {
  const { data, error } = await supabaseAdmin().from("deep_clean_occurrences").select("first_half_shift").eq("occurred_on", date).maybeSingle();
  if (error) throw new Error(`No se pudo leer la limpieza profunda de hoy: ${error.message}`);
  if (!data) return null;
  const half = data.first_half_shift === shift ? 1 : 2;
  return { key: keyForShift(shift), label: `Limpieza profunda: Mitad ${half}` };
}

/** Para el popup que se abre solo (mismo mecanismo que getPendingActivityNow). */
export async function getPendingDeepCleanNow(shift: string | null | undefined): Promise<PendingTask[]> {
  if (shift !== "Matutino" && shift !== "Vespertino") return [];
  const today = mexicoCityToday();
  const [activity, checks] = await Promise.all([getTodayDeepCleanActivity(shift, today), getTaskChecksForDate(today)]);
  if (!activity || checks[activity.key]?.done) return [];
  return [{ key: activity.key, label: activity.label, checkDate: today }];
}

export interface ConfirmDeepCleanResult {
  ok: boolean;
  error?: string;
}

/** Punto único para "Ya lo hice" de la limpieza profunda — igual patrón que confirmActivity/confirmOperationalTask. */
export async function confirmDeepClean(key: string, date: string, employeeId: string): Promise<ConfirmDeepCleanResult> {
  if (!isDeepCleanKey(key)) return { ok: false, error: "Actividad inválida." };
  try {
    const isFirstTime = await markTaskDone(key, date, employeeId);
    if (isFirstTime) {
      const profile = await getProfileById(employeeId);
      await logAction(employeeId, "Confirmó limpieza profunda", `${key} · ${date}`);
      await sendPushToAdmins({
        title: "🧽 Limpieza profunda",
        body: `${profile?.full_name ?? "Equipo"} confirmó su mitad de la limpieza profunda de hoy.`,
        url: "/admin/configuracion",
      });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo confirmar." };
  }
}
