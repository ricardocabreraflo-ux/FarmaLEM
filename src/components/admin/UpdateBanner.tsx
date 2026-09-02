"use client";

import { useEffect, useState } from "react";

const CURRENT_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID;
const CHECK_INTERVAL_MS = 45 * 1000;

/**
 * Avisa cuando ya se publicó una versión nueva del panel, para no depender de
 * cerrar y volver a abrir la app instalada. Compara el build con el que se
 * cargó en este navegador contra el que está corriendo ahorita en el
 * servidor (/api/version), revisando cada 45 s y al volver a esta ventana.
 *
 * El intervalo es corto a propósito: si alguien deja el panel abierto
 * capturando algo justo cuando se publica una actualización, el código
 * viejo que ya tiene cargado puede fallar al guardar (la Server Action ya
 * no existe en el servidor nuevo). Revisar seguido reduce esa ventana para
 * que le dé tiempo de ver el aviso y recargar antes de que le pase.
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
      <span className="text-[0.85rem] font-semibold">Hay una versión más nueva del panel disponible.</span>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-full bg-white px-4 py-1.5 text-[0.82rem] font-bold text-admin-primary transition-transform duration-150 ease-out active:scale-95"
      >
        Actualizar ahora
      </button>
    </div>
  );
}
