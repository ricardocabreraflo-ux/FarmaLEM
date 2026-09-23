/**
 * Número de versión visible para el equipo (esquina inferior derecha del
 * panel) — súbelo cada vez que se lance algo nuevo, junto con la tarjeta
 * correspondiente en `dashboard_announcements` (ver src/lib/announcements.ts).
 * No tiene relación con NEXT_PUBLIC_BUILD_ID (ese es para detectar despliegues
 * técnicos nuevos; este es el número que se le dice al equipo).
 *
 * Formato X.Y.Z:
 *   Z (1.1.1 → 1.1.2) ajuste chico o corrección.
 *   Y (1.1 → 1.2)     función nueva para el equipo.
 *   X (1.x → 2.0)     cambio muy grande/drástico en el panel.
 */
export const APP_VERSION = "1.3";
