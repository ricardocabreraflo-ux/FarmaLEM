import "server-only";
import { listProfiles, getActiveEmployeeByShift } from "@/lib/profiles";
import { mexicoCityToday, mondayOf, addDays } from "@/lib/dates";
import { listBonusTiers, computeWeekFromRecords, tierProgress } from "@/lib/bonuses";
import { sendPushToEmployee, sendPushToEmployees } from "@/lib/push";

/**
 * Lógica de los recordatorios programados (pg_cron → /api/cron/notificaciones,
 * ver ese route handler). Cada función es un "kind" del cron; nunca truena el
 * flujo que la llama — un error en un empleado no debe tumbar a los demás.
 */

export async function notifyToldoAbrir(): Promise<void> {
  const emp = await getActiveEmployeeByShift("Matutino");
  if (!emp) return;
  await sendPushToEmployee(emp.id, { title: "☂️ Toldo", body: "Recuerda dejar el toldo a 45°.", url: "/admin/reloj" });
}

export async function notifyToldoCerrar(): Promise<void> {
  const emp = await getActiveEmployeeByShift("Vespertino");
  if (!emp) return;
  await sendPushToEmployee(emp.id, { title: "☂️ Toldo", body: "Es hora de levantar el toldo (o antes, si ya oscureció).", url: "/admin/reloj" });
}

export async function notifyLuces(): Promise<void> {
  const emp = await getActiveEmployeeByShift("Vespertino");
  if (!emp) return;
  await sendPushToEmployee(emp.id, { title: "💡 Luces", body: "Enciende las luces de afuera.", url: "/admin/reloj" });
}

function money(n: number): string {
  return `$${n.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
}

/** Corre el domingo por la noche: a cada vendedora activa le manda cómo le fue en su semana que acaba de terminar. */
export async function notifyBonoSemanal(): Promise<void> {
  const today = mexicoCityToday();
  const monday = mondayOf(today);
  const sunday = addDays(monday, 6);
  const month = addDays(monday, 3).slice(0, 7); // mes del jueves de esa semana, igual que weeksOfMonth()

  const employees = (await listProfiles()).filter((e) => e.role === "employee" && e.active && (e.shift === "Matutino" || e.shift === "Vespertino"));
  if (employees.length === 0) return;
  const tiers = await listBonusTiers(month);

  await Promise.all(
    employees.map(async (emp) => {
      try {
        const { sales, absent } = await computeWeekFromRecords(emp.id, monday, sunday);
        if (absent) {
          await sendPushToEmployee(emp.id, {
            title: "📅 Tu semana",
            body: "Esta semana tuviste una falta, así que no aplica bono — la próxima semana puedes ir de nuevo por tu meta. ¡Ánimo!",
            url: "/admin/reloj",
          });
          return;
        }

        const { ordered, currentTier, nextTier } = tierProgress(sales, emp.shift, tiers);
        if (ordered.length === 0) return; // sin metas configuradas ese mes

        if (currentTier) {
          const next = nextTier ? ` Si subes a ${money(nextTier.goal)} tu siguiente nivel te da ${money(nextTier.bonus)}.` : "";
          await sendPushToEmployee(emp.id, {
            title: "🎉 ¡Llegaste a tu meta!",
            body: `Esta semana vendiste ${money(sales)} y alcanzaste el nivel ${currentTier.level} (${money(currentTier.bonus)} de bono, se paga a fin de mes).${next}`,
            url: "/admin/reloj",
          });
        } else {
          const missing = nextTier ? nextTier.goal - sales : 0;
          await sendPushToEmployee(emp.id, {
            title: "💪 Esta semana no llegaste a la meta",
            body: `Vendiste ${money(sales)}. Te faltaron ${money(missing)} para tu primer nivel de bono — la próxima semana lo puedes lograr. ¡Échale ganas!`,
            url: "/admin/reloj",
          });
        }
      } catch (err) {
        console.error("[cron] bono_semanal:", emp.id, err instanceof Error ? err.message : err);
      }
    })
  );
}

/** Corre el día 28 de cada mes: recuerda a todo el equipo capturar lo próximo a caducar antes de que inicie el mes. */
export async function notifyCaducidadMensual(): Promise<void> {
  const employees = (await listProfiles()).filter((e) => e.role === "employee" && e.active);
  if (employees.length === 0) return;
  await sendPushToEmployees(employees.map((e) => e.id), {
    title: "📦 Revisión de caducidad",
    body: "Revisa tus muebles y captura los productos próximos a caducar antes de que inicie el mes.",
    url: "/admin/caducidad-corta",
  });
}
