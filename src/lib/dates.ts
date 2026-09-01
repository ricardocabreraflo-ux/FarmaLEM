// Utilidades de fechas puras (sin zona horaria de servidor): trabajan sobre el
// texto YYYY-MM-DD anclado a mediodía para evitar que el cambio de día caiga
// en la fecha equivocada. Se usan para armar semanas Lunes-Domingo en reportes.

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Lunes de la semana que contiene esa fecha. */
export function mondayOf(date: string): string {
  const dow = new Date(`${date}T12:00:00`).getDay(); // 0 domingo ... 6 sábado
  return addDays(date, -((dow + 6) % 7));
}
