"use client";

import { useEffect, useState } from "react";

const CURRENT_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID;
const CHECK_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Avisa cuando ya se publicó una versión nueva del panel, para no depender de
 * cerrar y volver a abrir la app instalada. Compara el build con el que se
 * cargó en este navegador contra el que está corriendo ahorita en el
 * servidor (/api/version), revisando cada 10 min y al volver a esta ventana.
 *
 * No es urgente actualizar apenas aparece: con NETLIFY_NEXT_SKEW_PROTECTION
 * activado (ver .env.example), cada sesión ya abierta se queda pegada a la
 * versión con la que cargó y sigue funcionando bien aunque se publique una
 * actualización — este aviso es solo para que, cuando tengan un momento
 * libre, actualicen a la versión más nueva.
 */
export function UpdateBanner() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!CURRENT_BUILD_ID) return;

    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const data = (await res.json()) as { buildId: string | null };
        if (!cancelled && data.buildId && data.buildId !== CURRENT_BUILD_ID) setAvailable(true);
      } catch {
        // sin internet o red inestable: se vuelve a intentar en el siguiente ciclo
      }
    }

    check();
    const id = setInterval(check, CHECK_INTERVAL_MS);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);

    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);

  if (!available) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex flex-wrap items-center justify-center gap-3 border-t border-admin-border bg-admin-primary px-4 py-3 text-center text-white shadow-lg">
      <span className="text-[0.85rem] font-semibold">Hay una versión más nueva del panel. No es urgente — actualiza cuando tengas un momento.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-full bg-white px-4 py-1.5 text-[0.82rem] font-bold text-admin-primary transition-transform duration-150 ease-out active:scale-95"
      >
        Actualizar
      </button>
    </div>
  );
}
