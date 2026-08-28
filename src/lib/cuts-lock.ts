/** Julio 2026 en adelante ya se puede editar; junio 2026 y antes quedó cerrado (ya se cuadró a mano). */
export const CUTS_LOCKED_BEFORE = "2026-07-01";

export function isCutDateLocked(cutDate: string): boolean {
  return cutDate < CUTS_LOCKED_BEFORE;
}
