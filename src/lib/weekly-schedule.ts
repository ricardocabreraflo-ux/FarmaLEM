import "server-only";
import { getShelfAssignment } from "@/lib/anaqueles";
import type { FixedDaySchedule, FixedShiftTask } from "@/lib/actividades";

const WEEKDAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

/**
 * Qué le toca limpiar entre semana a quien traiga el grupo de anaqueles
 * PAR ese mes (2,4,6,8,10 + Vitrina Arriba) — un renglón por día,
 * Lunes a Viernes. Quien trae el grupo NON (1,3,5,7,9 + Vitrina Abajo)
 * hace lo mismo que define ODD_GROUP_WEEKLY_TASKS. Cuál turno trae cuál
 * grupo rota por mes (non/par) o se invierte a mano — eso ya lo calcula
 * /admin/anaqueles (getShelfAssignment); aquí solo se le asigna el mismo
 * renglón de tareas al turno que le toque ese grupo ese mes, para que
 * nunca se desincronice de Distribución de anaqueles.
 */
const EVEN_GROUP_WEEKLY_TASKS: (FixedShiftTask | null)[] = [
  { task: "Anaqueles 2 y 4", sub: "+ limpieza de baño" },
  { task: "Anaqueles 6 y 8", sub: "+ limpieza de baño" },
  { task: "Vitrina de arriba", sub: "+ limpieza de baño" },
  { task: "Anaqueles 2 y 10", sub: "+ consultorio · baño" },
  { task: "Anaqueles 4 y 8", sub: "+ limpieza de baño" },
];

const ODD_GROUP_WEEKLY_TASKS: (FixedShiftTask | null)[] = [
  { task: "Anaqueles 1 y 3", sub: "+ consultorio · baño" },
  { task: "Vitrina de abajo", sub: "+ toallas · baño" },
  { task: "Anaqueles 5 y 7", sub: "+ limpieza de baño" },
  { task: "Anaqueles 1 y 9", sub: "+ limpieza de baño" },
  { task: "Anaqueles 3 y 5", sub: "+ limpieza de baño" },
];

/**
 * Limpieza semanal por anaquel para ese mes — Lunes a Viernes sigue a quien
 * traiga cada grupo de anaqueles ese mes (igual que Distribución de
 * anaqueles, override incluido); Sábado y Domingo no dependen del grupo,
 * solo de qué turno trabaja ese día.
 */
export async function getWeeklyScheduleForMonth(month: string): Promise<FixedDaySchedule[]> {
  const assignment = await getShelfAssignment(month);
  const matutinoHasEven = assignment.matutino.nums.includes(2);
  const matutinoTasks = matutinoHasEven ? EVEN_GROUP_WEEKLY_TASKS : ODD_GROUP_WEEKLY_TASKS;
  const vespertinoTasks = matutinoHasEven ? ODD_GROUP_WEEKLY_TASKS : EVEN_GROUP_WEEKLY_TASKS;

  const schedule: FixedDaySchedule[] = WEEKDAY_NAMES.map((weekday, i) => ({
    weekday,
    matutino: matutinoTasks[i],
    vespertino: vespertinoTasks[i],
  }));
  schedule.push(
    { weekday: "Sábado", matutino: { task: "Vitrina + 2 anaqueles", sub: "según el mes — ver Distribución de anaqueles" }, vespertino: null },
    { weekday: "Domingo", matutino: null, vespertino: { task: "Vitrina + 2 anaqueles", sub: "según el mes — ver Distribución de anaqueles" } }
  );
  return schedule;
}
