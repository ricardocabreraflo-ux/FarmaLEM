import "server-only";
import type { Profile } from "@/lib/profiles";
import type { PushPayload } from "@/lib/push";
import { categoryForShift } from "@/lib/actividades";
import { getWeeklyScheduleForMonth } from "@/lib/weekly-schedule";
import { listActivePromotions } from "@/lib/promotions";
import { listStockoutReportsForEmployeeOnDate } from "@/lib/stockout-reports";

/** Mensajes motivacionales que acompañan el aviso de "tu plan de hoy" al checar Entrada — rotan según el día. */
const MOTIVATIONAL_MESSAGES = [
  "Mucha suerte en tu día — ¡éxito en tus ventas!",
  "Hoy es un gran día para acercarte a tu meta. ¡Tú puedes!",
  "Cada venta cuenta. ¡Vamos con toda!",
  "Sonríe y vende con confianza — hoy se puede.",
  "Un día más para llegar a tu bono semanal. ¡Ánimo!",
  "Que tengas un excelente turno — ¡a darle con energía!",
];

function pickMotivational(dateStr: string): string {
  const seed = Number(dateStr.replaceAll("-", ""));
  return MOTIVATIONAL_MESSAGES[seed % MOTIVATIONAL_MESSAGES.length];
}

/** getWeeklyScheduleForMonth regresa [Lunes..Viernes, Sábado, Domingo] — convierte Date.getDay() (0 domingo) a ese índice. */
function weekdayScheduleIndex(dateStr: string): number {
  const dow = new Date(`${dateStr}T12:00:00`).getDay();
  return dow === 0 ? 6 : dow - 1;
}

/** Aviso al checar Entrada: saludo motivacional + la tarea de limpieza/inventario del día + recordatorio de caja chica. */
export async function buildEntradaDailyBrief(employee: Profile, dateStr: string): Promise<PushPayload> {
  const shiftLower = employee.shift.toLowerCase();
  const month = dateStr.slice(0, 7);
  const [schedule, category] = await Promise.all([
    getWeeklyScheduleForMonth(month),
    Promise.resolve(shiftLower === "matutino" || shiftLower === "vespertino" ? categoryForShift(dateStr, shiftLower) : null),
  ]);
  const day = schedule[weekdayScheduleIndex(dateStr)];
  const task = employee.shift === "Matutino" ? day?.matutino : employee.shift === "Vespertino" ? day?.vespertino : null;

  const parts: string[] = [pickMotivational(dateStr)];
  if (task) parts.push(`Hoy te toca: ${task.task}${task.sub ? ` (${task.sub})` : ""}.`);
  if (category) parts.push(`Inventario de hoy: ${category.label}.`);
  parts.push("Verifica tu caja chica contra lo que te entrega el turno anterior y reporta cualquier anomalía de inmediato.");

  return { title: "🌞 Buen día — tu plan de hoy", body: parts.join(" "), url: "/admin/actividades" };
}

/** Aviso al checar Entrada con las promociones activas que debe ofrecer en su turno (null si no hay ninguna activa). */
export async function buildEntradaPromoPush(): Promise<PushPayload | null> {
  const promos = await listActivePromotions();
  if (promos.length === 0) return null;
  const body = promos.map((p) => p.title).join(" · ");
  return { title: "🏷️ Promociones de hoy", body: `Ofrécelas durante tu turno: ${body}`, url: "/admin/inicio" };
}

/** Aviso a administración al checar Salida con lo que esa persona registró en Negados y faltantes ese día (null si no registró nada). */
export async function buildSalidaStockoutSummary(employee: Profile, dateStr: string): Promise<PushPayload | null> {
  const reports = await listStockoutReportsForEmployeeOnDate(employee.id, dateStr);
  if (reports.length === 0) return null;

  const negados = reports.filter((r) => r.kind === "Negado");
  const faltantes = reports.filter((r) => r.kind === "Faltante");
  const items = reports
    .slice(0, 8)
    .map((r) => `${r.active_substance} (${r.quantity})`)
    .join(" · ");
  const extra = reports.length > 8 ? ` y ${reports.length - 8} más` : "";

  return {
    title: `📋 ${employee.full_name} — negados y faltantes de su turno`,
    body: `${negados.length} negado${negados.length === 1 ? "" : "s"}, ${faltantes.length} faltante${faltantes.length === 1 ? "" : "s"}: ${items}${extra}`,
    url: "/admin/negados",
  };
}
