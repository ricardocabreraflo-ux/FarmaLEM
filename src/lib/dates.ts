// Utilidades de fechas puras (sin depender de en qué zona horaria corre el
// código): trabajan sobre el texto YYYY-MM-DD anclado a mediodía para evitar
// que el cambio de día caiga en la fecha equivocada. Se usan para armar
// semanas Lunes-Domingo en reportes. Sin "server-only": las usan tanto
// Server Components/Actions como componentes de cliente.

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// new Date().toISOString() SIEMPRE da la fecha en UTC, sin importar si corre
// en el navegador o en el servidor — así que "hoy" o "ahorita" calculado así
// se adelanta un día entre las 6pm y la medianoche hora de Ciudad de México
// (fija en UTC-6 desde que México quitó el horario de verano en 2022). Esta
// función da el día real en Ciudad de México, sin importar dónde corra.
export function mexicoCityToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());
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
