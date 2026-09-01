"use client";

import { useState, useTransition } from "react";
import { punchForSession } from "@/app/admin/reloj/actions";

type EventInfo = { type: "Entrada" | "Salida"; time: string } | null;

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });
}

/**
 * Marca la Entrada/Salida de quien ya inició sesión, sin volver a pedir PIN
 * (ese PIN ya se usó para entrar desde /admin/turno). Muestra siempre la
 * última marca del día para que no se vuelva a marcar por duda o confusión.
 */
export function PunchPanel({ employeeName, initialLastEvent }: { employeeName: string; initialLastEvent: EventInfo }) {
  const [lastEvent, setLastEvent] = useState<EventInfo>(initialLastEvent);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const nextType: "Entrada" | "Salida" = !lastEvent || lastEvent.type === "Salida" ? "Entrada" : "Salida";

  function punch() {
    setError(null);
    startTransition(async () => {
      const res = await punchForSession();
      if (res.ok && res.type && res.time) {
        setLastEvent({ type: res.type, time: res.time });
      } else {
        setError(res.error ?? "No se pudo registrar.");
      }
    });
  }

  return (
    <div className="w-full rounded-2xl border border-admin-border bg-admin-surface p-5 text-center">
      <p className="text-[0.85rem] text-admin-ink-soft">{employeeName}</p>
      {lastEvent ? (
        <p className="mt-1 text-[0.9rem] font-semibold text-admin-ok-text">
          Ya marcaste tu {lastEvent.type} a las {fmtTime(lastEvent.time)}
        </p>
      ) : (
        <p className="mt-1 text-[0.9rem] text-admin-ink-soft">Aún no marcas tu entrada hoy.</p>
      )}

      {error && <p className="mt-2 text-[0.85rem] font-semibold text-admin-bad-text">{error}</p>}

      <button
        type="button"
        disabled={pending}
        onClick={punch}
        className="mt-4 w-full rounded-2xl bg-admin-primary px-6 py-4 text-[1.05rem] font-bold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
      >
        {pending ? "Registrando…" : `Marcar mi ${nextType}`}
      </button>
    </div>
  );
}
