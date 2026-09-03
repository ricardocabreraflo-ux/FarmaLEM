"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { marcarPunch } from "@/app/admin/turno/marcar/actions";

export interface MarcarShiftInfo {
  shift: "Matutino" | "Vespertino";
  firstName: string | null;
  ready: boolean;
}

type Confirmed = { employeeName: string; type: "Entrada" | "Salida"; time: string };

const PIN_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "borrar", "0", "enviar"];

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });
}

export function MarcarKiosk({ shifts }: { shifts: MarcarShiftInfo[] }) {
  const [active, setActive] = useState<MarcarShiftInfo | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<Confirmed | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setActive(null);
    setPin("");
    setError(null);
    setConfirmed(null);
  }

  function submit(value: string) {
    if (!active || !value) return;
    setError(null);
    startTransition(async () => {
      const res = await marcarPunch(active.shift, value);
      if (res.ok && res.type && res.time && res.employeeName) {
        setConfirmed({ employeeName: res.employeeName, type: res.type, time: res.time });
      } else {
        setError(res.error ?? "No se pudo registrar.");
        setPin("");
      }
    });
  }

  function pressKey(key: string) {
    if (pending) return;
    if (key === "borrar") return setPin((p) => p.slice(0, -1));
    if (key === "enviar") return submit(pin);
    if (pin.length < 6) setPin((p) => p + key);
  }

  return (
    <div className="mx-auto flex max-w-[380px] flex-col items-center gap-6 px-4 py-10 text-center">
      <div>
        <strong className="font-display text-xl text-admin-ink">Marcar Entrada / Salida</strong>
        <p className="mt-1 text-[0.85rem] text-admin-ink-soft">Sin abrir sesión — solo tu turno y tu PIN.</p>
      </div>

      {confirmed ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-admin-ok-bg text-2xl text-admin-ok-text">✓</div>
          <p className="font-display text-lg font-bold text-admin-ink">{confirmed.employeeName}</p>
          <p className="font-data text-3xl font-semibold text-admin-ink">{fmtTime(confirmed.time)}</p>
          <p className="text-[0.85rem] text-admin-ink-soft">{confirmed.type} registrada &middot; {active?.shift}</p>
          <button type="button" onClick={reset} className="text-[0.82rem] font-semibold text-admin-ink-soft underline decoration-dotted">
            Marcar otra persona
          </button>
        </>
      ) : !active ? (
        <>
          <p className="text-[0.9rem] text-admin-ink-soft">¿Qué turno llegó?</p>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            {shifts.map((s) => (
              <button
                key={s.shift}
                type="button"
                disabled={!s.ready}
                onClick={() => setActive(s)}
                className="flex flex-col items-center gap-1 rounded-2xl border border-admin-border bg-admin-surface px-6 py-8 transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
              >
                <span className="text-lg font-bold tracking-wide text-admin-ink">{s.shift.toUpperCase()}</span>
                <span className="text-[0.8rem] text-admin-ink-soft">{s.firstName ?? "Sin asignar"}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex w-full justify-start">
            <button
              type="button"
              onClick={reset}
              className="flex items-center gap-1 rounded-full border border-admin-border px-3 py-1.5 text-[0.8rem] font-semibold text-admin-ink-soft hover:border-admin-primary hover:text-admin-primary"
            >
              &larr; Regresar
            </button>
          </div>
          <p className="text-[0.9rem] text-admin-ink-soft">
            {active.shift} &middot; {active.firstName} — tu PIN corto.
          </p>
          <div className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-admin-border bg-admin-surface text-2xl tracking-[0.6em] text-admin-ink">
            {"•".repeat(pin.length) || <span className="text-admin-ink-soft">&nbsp;</span>}
          </div>
          {error && <p className="text-[0.85rem] font-semibold text-admin-bad-text">{error}</p>}
          <div className="grid w-full grid-cols-3 gap-3">
            {PIN_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                disabled={pending}
                onClick={() => pressKey(key)}
                className={`flex h-16 items-center justify-center rounded-2xl text-xl font-bold transition-transform duration-150 ease-out active:scale-95 disabled:opacity-60 ${
                  key === "enviar"
                    ? "bg-admin-primary text-white"
                    : key === "borrar"
                      ? "border border-admin-border text-admin-ink-soft"
                      : "border border-admin-border bg-admin-surface text-admin-ink"
                }`}
              >
                {key === "borrar" ? "⌫" : key === "enviar" ? "OK" : key}
              </button>
            ))}
          </div>
        </>
      )}

      <Link href="/admin/turno" className="text-[0.8rem] font-semibold text-admin-ink-soft hover:underline">
        ¿Vas a trabajar en el panel? Entra aquí
      </Link>
    </div>
  );
}
