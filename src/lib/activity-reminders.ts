import "server-only";
import { categoryForShift } from "@/lib/actividades";
import { getWeeklyScheduleForMonth } from "@/lib/weekly-schedule";
import { mexicoCityToday } from "@/lib/dates";
import { getTaskChecksForDate, markTaskDone, type PendingTask } from "@/lib/operational-tasks";
import { getProfileById } from "@/lib/profiles";
import { logAction } from "@/lib/history";
import { sendPushToAdmins } from "@/lib/push";

/**
 * Recordatorio de "Calendario de actividades" (limpieza semanal + categoría
 * de inventario del día), con el mismo seguimiento que Tareas operativas
 * ("Ya lo hice" + aviso a administración) — pero sin definición guardada:
 * a diferencia de toldo/luces, el contenido de cada día se calcula solo a
 * partir de la fecha y el turno (ver src/lib/actividades.ts y
 * src/lib/weekly-schedule.ts), así que reutiliza la misma tabla
 * operational_task_checks con una llave fija por tipo y turno en vez de una
 * fila en operational_task_defs. Limpieza e inventario se confirman por
 * separado, cada una con su propio "Ya lo hice".
 */
const WEEKDAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
type Shift = "Matutino" | "Vespertino";
type ActivityType = "limpieza" | "inventario";

function activityKey(type: ActivityType, shift: Shift): string {
  return `actividad-${type}-${shift === "Matutino" ? "matutino" : "vespertino"}`;
}

export function isActivityKey(key: string): boolean {
  return key.startsWith("actividad-");
}

function parseActivityKey(key: string): { type: ActivityType; shift: Shift } | null {
  const match = key.match(/^actividad-(limpieza|inventario)-(matutino|vespertino)$/);
  if (!match) return null;
  return { type: match[1] as ActivityType, shift: match[2] === "matutino" ? "Matutino" : "Vespertino" };
}

export interface TodayActivity {
  key: string;
  label: string;
}

/** Las actividades del día para ese turno (0, 1 o 2) — vacío si ese turno no trabaja ese día (domingo matutino / sábado vespertino). */
export async function getTodayActivities(shift: Shift, date: string): Promise<TodayActivity[]> {
  const lowerShift = shift === "Matutino" ? "matutino" : "vespertino";
  const category = categoryForShift(date, lowerShift);

  const weekday = new Date(`${date}T12:00:00`).getDay();
  const weekly = await getWeeklyScheduleForMonth(date.slice(0, 7));
  const dayRow = weekly.find((w) => w.weekday === WEEKDAY_NAMES[weekday]);
  const cleaning = dayRow ? (shift === "Matutino" ? dayRow.matutino : dayRow.vespertino) : null;

  const activities: TodayActivity[] = [];
  if (cleaning) {
    activities.push({ key: activityKey("limpieza", shift), label: `Limpieza: ${cleaning.task}${cleaning.sub ? ` (${cleaning.sub})` : ""}` });
  }
  if (category) {
    activities.push({ key: activityKey("inventario", shift), label: `Inventario: ${category.label}` });
  }
  return activities;
}

/** Para el popup que se abre solo en el panel (mismo mecanismo que getPendingTasksNow, ver operational-tasks.ts). */
export async function getPendingActivityNow(shift: string | null | undefined): Promise<PendingTask[]> {
  if (shift !== "Matutino" && shift !== "Vespertino") return [];

  const today = mexicoCityToday();
  const [activities, checks] = await Promise.all([getTodayActivities(shift, today), getTaskChecksForDate(today)]);

  return activities.filter((a) => !checks[a.key]?.done).map((a) => ({ key: a.key, label: a.label, checkDate: today }));
}

export interface ConfirmActivityResult {
  ok: boolean;
  error?: string;
}

/** Punto único para "Ya lo hice" de una actividad — igual que confirmOperationalTask, pero calculando la etiqueta en vez de buscarla en una definición guardada. */
export async function confirmActivity(key: string, date: string, employeeId: string): Promise<ConfirmActivityResult> {
  const parsed = parseActivityKey(key);
  if (!parsed) return { ok: false, error: "Actividad inválida." };

  try {
    const isFirstTime = await markTaskDone(key, date, employeeId);
    if (isFirstTime) {
      const [profile, activities] = await Promise.all([getProfileById(employeeId), getTodayActivities(parsed.shift, date)]);
      const label = activities.find((a) => a.key === key)?.label ?? (parsed.type === "limpieza" ? "Limpieza del día" : "Inventario del día");
      await logAction(employeeId, "Confirmó actividad del día", `${label} · ${date}`);
      await sendPushToAdmins({
        title: "🧹 Actividad del día",
        body: `${profile?.full_name ?? "Equipo"} confirmó: ${label.toLowerCase()}.`,
        url: "/admin/actividades",
      });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo confirmar." };
  }
}
