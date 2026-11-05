import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { sendPushToAdmins } from "@/lib/push";
import { logAction } from "@/lib/history";
import { getProfileById } from "@/lib/profiles";
import { mexicoCityToday } from "@/lib/dates";

export interface OperationalTaskDef {
  key: string;
  label: string;
}

/** Tareas recurrentes que se confirman con un "Ya lo hice" — hoy solo las del turno Vespertino. */
export const OPERATIONAL_TASKS: OperationalTaskDef[] = [
  { key: "toldo", label: "Recoger el toldo" },
  { key: "luces", label: "Encender las luces de afuera" },
];

export function getOperationalTaskLabel(taskKey: string): string | null {
  return OPERATIONAL_TASKS.find((t) => t.key === taskKey)?.label ?? null;
}

export interface TaskCheckStatus {
  done: boolean;
  doneAt: string | null;
  doneBy: string | null;
}

/** Estado de cada tarea para ese día — para mostrar el checklist y para no mandar el push de admin dos veces. */
export async function getTaskChecksForDate(date: string): Promise<Record<string, TaskCheckStatus>> {
  const { data, error } = await supabaseAdmin().from("operational_task_checks").select("task_key, done_at, employee_id").eq("check_date", date);
  if (error) throw new Error(`No se pudieron leer las tareas del día: ${error.message}`);

  const byKey: Record<string, TaskCheckStatus> = {};
  for (const t of OPERATIONAL_TASKS) byKey[t.key] = { done: false, doneAt: null, doneBy: null };
  for (const row of data ?? []) {
    byKey[row.task_key] = { done: true, doneAt: row.done_at, doneBy: row.employee_id };
  }
  return byKey;
}

/** Marca la tarea como hecha ese día. Regresa true solo si fue la primera vez que se marcó (para no avisarle a admin dos veces). */
export async function markTaskDone(taskKey: string, date: string, employeeId: string): Promise<boolean> {
  const db = supabaseAdmin();
  const { data: existing } = await db.from("operational_task_checks").select("id").eq("task_key", taskKey).eq("check_date", date).maybeSingle();
  if (existing) return false;

  const { error } = await db.from("operational_task_checks").insert({ task_key: taskKey, check_date: date, employee_id: employeeId });
  // Si alguien más lo marcó en el mismo instante, el índice único truena — no es un error real, solo ya no es "la primera vez".
  if (error) return false;
  return true;
}

function mexicoCityNow(): { hour: number; minute: number; weekday: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Mexico_City", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  // 0 domingo ... 6 sábado, igual que Date.getDay(), pero anclado a la fecha de Ciudad de México.
  const weekday = new Date(`${mexicoCityToday()}T12:00:00`).getDay();
  return { hour, minute, weekday };
}

export interface PendingTask extends OperationalTaskDef {
  checkDate: string;
}

/**
 * Tareas vigentes ahora mismo para ese turno que todavía no se confirman —
 * para el popup que se abre solo dentro de la app (ver PendingTaskPopup),
 * de respaldo al push por si no les llegó o lo cerraron sin confirmar.
 * "Vigente" = ya pasó su hora de inicio y sigue siendo el mismo día.
 */
export async function getPendingTasksNow(shift: string | null | undefined): Promise<PendingTask[]> {
  if (shift !== "Vespertino") return [];
  const { hour, weekday } = mexicoCityNow();
  if (hour < 18) return [];

  const today = mexicoCityToday();
  const checks = await getTaskChecksForDate(today);
  const isWeekday = weekday >= 1 && weekday <= 5;

  const pending: PendingTask[] = [];
  if (isWeekday && !checks.toldo?.done) pending.push({ key: "toldo", label: "Recoger el toldo", checkDate: today });
  if (!checks.luces?.done) pending.push({ key: "luces", label: "Encender las luces de afuera", checkDate: today });
  return pending;
}

export interface ConfirmTaskResult {
  ok: boolean;
  error?: string;
}

/**
 * Punto único para "Ya lo hice": lo usan tanto el botón de la notificación
 * push (vía /api/tasks/confirmar) como el botón dentro de /admin/reloj — para
 * no duplicar la lógica de avisarle a administración solo la primera vez.
 */
export async function confirmOperationalTask(taskKey: string, date: string, employeeId: string): Promise<ConfirmTaskResult> {
  const label = getOperationalTaskLabel(taskKey);
  if (!label) return { ok: false, error: "Tarea inválida." };

  try {
    const isFirstTime = await markTaskDone(taskKey, date, employeeId);
    if (isFirstTime) {
      const profile = await getProfileById(employeeId);
      await logAction(employeeId, "Confirmó tarea", `${label} · ${date}`);
      await sendPushToAdmins({
        title: `✅ ${label}`,
        body: `${profile?.full_name ?? "Equipo"} confirmó: ${label.toLowerCase()}.`,
        url: "/admin/reloj",
      });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo confirmar." };
  }
}
