import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import { sendPushToAdmins, sendPushToEmployee } from "@/lib/push";
import { logAction } from "@/lib/history";
import { getProfileById, getActiveEmployeeByShift } from "@/lib/profiles";
import { mexicoCityToday } from "@/lib/dates";

export type OperationalTaskShift = "Matutino" | "Vespertino";

export interface OperationalTaskDef {
  id: string;
  key: string;
  label: string;
  hour: number;
  minute: number;
  weekdays: number[];
  shift: OperationalTaskShift;
  active: boolean;
}

function slugify(label: string): string {
  return (
    label
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "tarea"
  );
}

async function uniqueTaskKey(label: string): Promise<string> {
  const base = slugify(label);
  const db = supabaseAdmin();
  let candidate = base;
  let n = 2;
  for (;;) {
    const { data } = await db.from("operational_task_defs").select("id").eq("key", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${n++}`;
  }
}

/** Todas las tareas (activas o no) — para administrarlas en Configuración. */
export async function listOperationalTaskDefs(): Promise<OperationalTaskDef[]> {
  const { data, error } = await supabaseAdmin().from("operational_task_defs").select().order("shift").order("hour").order("minute");
  if (error) throw new Error(`No se pudieron leer las tareas operativas: ${error.message}`);
  return data as OperationalTaskDef[];
}

/** Tareas activas de ese turno — para el checklist y el popup de /admin/reloj. */
export async function listActiveTaskDefsForShift(shift: string | null | undefined): Promise<OperationalTaskDef[]> {
  if (shift !== "Matutino" && shift !== "Vespertino") return [];
  const { data, error } = await supabaseAdmin().from("operational_task_defs").select().eq("shift", shift).eq("active", true).order("hour").order("minute");
  if (error) throw new Error(`No se pudieron leer las tareas operativas: ${error.message}`);
  return data as OperationalTaskDef[];
}

async function getTaskDefByKey(key: string): Promise<OperationalTaskDef | null> {
  const { data, error } = await supabaseAdmin().from("operational_task_defs").select().eq("key", key).maybeSingle();
  if (error || !data) return null;
  return data as OperationalTaskDef;
}

export interface SaveTaskDefInput {
  label: string;
  hour: number;
  minute: number;
  weekdays: number[];
  shift: OperationalTaskShift;
}

export async function createOperationalTaskDef(input: SaveTaskDefInput, createdBy: string): Promise<void> {
  const label = input.label.trim();
  if (!label) throw new Error("Ponle un nombre a la tarea.");
  if (input.weekdays.length === 0) throw new Error("Elige al menos un día.");
  const key = await uniqueTaskKey(label);
  const { error } = await supabaseAdmin()
    .from("operational_task_defs")
    .insert({ key, label, hour: input.hour, minute: input.minute, weekdays: input.weekdays, shift: input.shift, created_by: createdBy });
  if (error) throw new Error(error.message);
}

export async function updateOperationalTaskDef(id: string, input: SaveTaskDefInput): Promise<void> {
  const label = input.label.trim();
  if (!label) throw new Error("Ponle un nombre a la tarea.");
  if (input.weekdays.length === 0) throw new Error("Elige al menos un día.");
  const { error } = await supabaseAdmin()
    .from("operational_task_defs")
    .update({ label, hour: input.hour, minute: input.minute, weekdays: input.weekdays, shift: input.shift })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function setOperationalTaskDefActive(id: string, active: boolean): Promise<void> {
  const { error } = await supabaseAdmin().from("operational_task_defs").update({ active }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteOperationalTaskDef(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from("operational_task_defs").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export interface TaskCheckStatus {
  done: boolean;
  doneAt: string | null;
  doneBy: string | null;
}

/** Quién confirmó qué tarea ese día — por eso no hace falta una lista de tareas conocida de antemano. */
export async function getTaskChecksForDate(date: string): Promise<Record<string, TaskCheckStatus>> {
  const { data, error } = await supabaseAdmin().from("operational_task_checks").select("task_key, done_at, employee_id").eq("check_date", date);
  if (error) throw new Error(`No se pudieron leer las tareas del día: ${error.message}`);

  const byKey: Record<string, TaskCheckStatus> = {};
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

export interface PendingTask {
  key: string;
  label: string;
  checkDate: string;
}

/**
 * Tareas vigentes ahora mismo para ese turno que todavía no se confirman —
 * para el popup que se abre solo dentro de la app (PendingTaskPopup), de
 * respaldo al push por si no les llegó o lo cerraron sin confirmar.
 * "Vigente" = ya pasó su hora de inicio y sigue siendo el mismo día.
 */
export async function getPendingTasksNow(shift: string | null | undefined): Promise<PendingTask[]> {
  const defs = await listActiveTaskDefsForShift(shift);
  if (defs.length === 0) return [];

  const { hour, minute, weekday } = mexicoCityNow();
  const nowMinutes = hour * 60 + minute;
  const today = mexicoCityToday();
  const checks = await getTaskChecksForDate(today);

  const pending: PendingTask[] = [];
  for (const def of defs) {
    if (!def.weekdays.includes(weekday)) continue;
    if (nowMinutes < def.hour * 60 + def.minute) continue;
    if (checks[def.key]?.done) continue;
    pending.push({ key: def.key, label: def.label, checkDate: today });
  }
  return pending;
}

/**
 * Tareas activas cuya hora programada cae dentro de los últimos `windowMinutes`
 * minutos — para el cron que manda el push (corre cada 5 min, ver
 * notifyOperationalTasksDue en cron-notifications.ts). No manda el push si ya
 * se mandó hoy para esa tarea (operational_task_pushes).
 */
export async function getTasksDueForPush(windowMinutes: number): Promise<OperationalTaskDef[]> {
  const { data, error } = await supabaseAdmin().from("operational_task_defs").select().eq("active", true);
  if (error) throw new Error(`No se pudieron leer las tareas operativas: ${error.message}`);
  const defs = data as OperationalTaskDef[];
  if (defs.length === 0) return [];

  const { hour, minute, weekday } = mexicoCityNow();
  const nowMinutes = hour * 60 + minute;
  const today = mexicoCityToday();

  const due: OperationalTaskDef[] = [];
  for (const def of defs) {
    if (!def.weekdays.includes(weekday)) continue;
    const scheduled = def.hour * 60 + def.minute;
    if (nowMinutes < scheduled || nowMinutes >= scheduled + windowMinutes) continue;

    const { data: already } = await supabaseAdmin().from("operational_task_pushes").select("task_key").eq("task_key", def.key).eq("push_date", today).maybeSingle();
    if (already) continue;

    const { error: insertError } = await supabaseAdmin().from("operational_task_pushes").insert({ task_key: def.key, push_date: today });
    if (insertError) continue; // alguien más (otro tick solapado) ya lo mandó
    due.push(def);
  }
  return due;
}

export interface ConfirmTaskResult {
  ok: boolean;
  error?: string;
}

/**
 * Punto único para "Ya lo hice": lo usan tanto el botón de la notificación
 * push (vía /api/tasks/confirmar) como los botones dentro de /admin/reloj —
 * para no duplicar la lógica de avisarle a administración solo la primera vez.
 */
export async function confirmOperationalTask(taskKey: string, date: string, employeeId: string): Promise<ConfirmTaskResult> {
  const def = await getTaskDefByKey(taskKey);
  if (!def) return { ok: false, error: "Tarea inválida." };

  try {
    const isFirstTime = await markTaskDone(taskKey, date, employeeId);
    if (isFirstTime) {
      const profile = await getProfileById(employeeId);
      await logAction(employeeId, "Confirmó tarea", `${def.label} · ${date}`);
      await sendPushToAdmins({
        title: `✅ ${def.label}`,
        body: `${profile?.full_name ?? "Equipo"} confirmó: ${def.label.toLowerCase()}.`,
        url: "/admin/reloj",
      });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo confirmar." };
  }
}

/** El tick del cron: manda el push (con botón "Ya lo hice") a quien tenga el turno de cada tarea que le toque ahora. */
export async function sendDueOperationalTaskPushes(windowMinutes: number): Promise<void> {
  const due = await getTasksDueForPush(windowMinutes);
  const today = mexicoCityToday();

  await Promise.all(
    due.map(async (def) => {
      const emp = await getActiveEmployeeByShift(def.shift);
      if (!emp) return;
      await sendPushToEmployee(emp.id, {
        title: `⏰ ${def.label}`,
        body: `Toca "Ya lo hice" en cuanto quede.`,
        url: "/admin/reloj",
        taskKey: def.key,
        checkDate: today,
      });
    })
  );
}
