/** Mismos grupos que el menú ☰ del panel — así el índice de Ayuda se lee igual de familiar. Sin "server-only": lo usan tanto tutorials.ts (servidor) como TutorialList.tsx (cliente). */
export const TUTORIAL_SECTIONS = ["Primeros pasos", "Caja", "Personal", "Mercancía", "Finanzas", "Administración general"] as const;
export type TutorialSection = (typeof TUTORIAL_SECTIONS)[number];
