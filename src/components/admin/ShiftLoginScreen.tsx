"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { loginWithPassword, loginWithPin } from "@/app/admin/turno/actions";

export interface ShiftInfo {
  shift: "Matutino" | "Vespertino";
  employeeId: string | null;
  firstName: string | null;
  trusted: boolean;
}

const PIN_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "borrar", "0", "enviar"];

export function ShiftLoginScreen({ shifts }: { shifts: ShiftInfo[] }) {
  const [active, setActive] = useState<ShiftInfo | null>(null);
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setActive(null);
    setPassword("");
    setPin("");
    setError(null);
  }

  function submitPassword() {
    if (!active || !password) return;
    setError(null);
    startTransition(async () => {
      const result = await loginWithPassword(active.shift, password);
      if (result?.error) setError(result.error);
    });
  }

  function submitPin(value: string) {
    if (!active || !value) return;
    setError(null);
    startTransition(async () => {
      const result = await loginWithPin(active.shift, value);
      if (result?.error) {
        setError(result.error);
        setPin("");
      }
    });
  }

  function pressKey(key: string) {
    if (pending) return;
    if (key === "borrar") return setPin((p) => p.slice(0, -1));
    if (key === "enviar") return submitPin(pin);
    if (pin.length < 6) setPin((p) => p + key);
  }

  return (
    <div className="mx-auto flex max-w-[380px] flex-col items-center gap-6 px-4 py-10 text-center">
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="FarmaLEM" width={40} height={40} className="h-10 w-10 object-contain" priority />
        <strong className="font-display text-xl text-admin-ink">FarmaLEM</strong>
      </div>

      {!active ? (
        <>
          <p className="text-[0.9rem] text-admin-ink-soft">Elige tu turno para entrar.</p>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            {shifts.map((s) => (
              <button
                key={s.shift}
                type="button"
                disabled={!s.employeeId}
                onClick={() => setActive(s)}
                className="flex flex-col items-center gap-1 rounded-2xl border border-admin-border bg-admin-surface px-6 py-8 transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
              >
                <span className="text-lg font-bold tracking-wide text-admin-ink">{s.shift.toUpperCase()}</span>
                <span className="text-[0.8rem] text-admin-ink-soft">{s.firstName ?? "Sin asignar"}</span>
              </button>
            ))}
          </div>
        </>
      ) : active.trusted ? (
        <>
          <p className="text-[0.9rem] text-admin-ink-soft">
            {active.shift} &middot; {active.firstName} — captura tu PIN.
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
          <button type="button" onClick={reset} className="text-[0.82rem] font-semibold text-admin-ink-soft hover:underline">
            No soy yo / cambiar turno
          </button>
        </>
      ) : (
        <>
          <p className="text-[0.9rem] text-admin-ink-soft">
            {active.shift} &middot; {active.firstName} — primera vez en esta computadora, escribe tu contraseña.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitPassword()}
            autoFocus
            className="w-full rounded-2xl border border-admin-border bg-admin-input-bg px-4 py-3 text-center text-lg text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
          />
          {error && <p className="text-[0.85rem] font-semibold text-admin-bad-text">{error}</p>}
          <button
            type="button"
            disabled={pending || !password}
            onClick={submitPassword}
            className="w-full rounded-full bg-admin-primary px-6 py-3 text-[0.9rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
          >
            {pending ? "Entrando…" : "Entrar"}
          </button>
          <button type="button" onClick={reset} className="text-[0.82rem] font-semibold text-admin-ink-soft hover:underline">
            Cambiar turno
          </button>
        </>
      )}
    </div>
  );
}
