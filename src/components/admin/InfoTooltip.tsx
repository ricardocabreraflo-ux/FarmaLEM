"use client";

import { useState, type ReactNode } from "react";

/**
 * Icono "i" que muestra una nota larga como globo flotante al pasar el
 * cursor (o al tocarlo en pantallas táctiles, sin hover) — para no ocupar
 * espacio fijo en tarjetas de resumen.
 */
export function InfoTooltip({ content }: { content: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setOpen(false)}
        aria-label="Más información"
        className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-current text-[0.62rem] font-bold leading-none opacity-70 hover:opacity-100"
      >
        i
      </button>
      <span
        role="tooltip"
        className={`absolute right-0 top-full z-30 mt-2 w-60 rounded-xl border border-admin-border bg-admin-surface p-3 text-[0.72rem] leading-snug text-admin-ink-soft shadow-lg transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"
        }`}
      >
        {content}
      </span>
    </span>
  );
}
