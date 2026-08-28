"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { punchWithPin } from "@/app/admin/reloj/actions";

type Result = { employeeName: string; type: "Entrada" | "Salida"; time: string } | null;

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "borrar", "0", "enviar"];

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function ClockKiosk() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result>(null);
  const [pending, startTransition] = useTransition();

  function reset() {
    setPin("");
    setError(null);
  }

  function submit(value: string) {
    if (!value) return;
    startTransition(async () => {
      const res = await punchWithPin(value);
      if (res.ok && res.employeeName && res.type && res.time) {
        setResult({ employeeName: res.employeeName, type: res.type, time: res.time });
        setError(null);
        setPin("");
        setTimeout(() => setResult(null), 5000);
      } else {
        setError(res.error ?? "No se pudo registrar.");
        setPin("");
      }
    });
  }

  function press(key: string) {
    if (pending) return;
    if (key === "borrar") return setPin((p) => p.slice(0, -1));
    if (key === "enviar") return submit(pin);
    if (pin.length < 6) setPin((p) => p + key);
  }

  return (
    <div className="mx-auto flex max-w-[380px] flex-col items-center gap-6 px-4 py-10 text-center">
      <div className="flex items-center gap-2">
        <Image src="/logo.png" alt="FarmaLEM" width={40} height={40} className="h-10 w-10 object-contain" priority />
        <strong className="font-display text-xl text-admin-ink">FarmaLEM · Reloj checador</strong>
      </div>

      {result ? (
        <div className="w-full rounded-2xl border border-admin-ok-text bg-admin-ok-bg px-6 py-8">
          <p className="font-display text-lg text-admin-ok-text">{result.employeeName}</p>
          <p className="mt-1 text-[1.3rem] font-bold text-admin-ok-text">{result.type} registrada</p>
          <p className="mt-1 text-[0.9rem] text-admin-ok-text">{fmtTime(result.time)}</p>
        </div>
      ) : (
        <>
          <p className="text-[0.9rem] text-admin-ink-soft">Captura tu PIN para marcar tu entrada o salida.</p>
          <div className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-admin-border bg-admin-surface text-2xl tracking-[0.6em] text-admin-ink">
            {"•".repeat(pin.length) || <span className="text-admin-ink-soft">&nbsp;</span>}
          </div>
          {error && <p className="text-[0.85rem] font-semibold text-admin-bad-text">{error}</p>}
          <div className="grid w-full grid-cols-3 gap-3">
            {KEYS.map((key) => (
              <button
                key={key}
                type="button"
                disabled={pending}
                onClick={() => press(key)}
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
          {pin.length > 0 && (
            <button type="button" onClick={reset} className="text-[0.82rem] font-semibold text-admin-ink-soft hover:underline">
              Cancelar
            </button>
          )}
        </>
      )}
    </div>
  );
}
