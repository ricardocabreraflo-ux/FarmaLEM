"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { closeShortExpiryMonthAction } from "@/app/admin/caducidad-corta/actions";

export function CloseShortExpiryMonthButton({ month }: { month: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await closeShortExpiryMonthAction(month);
      if (!res.ok) {
        setError(res.error ?? "No se pudo cerrar el mes.");
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[0.82rem] text-admin-ink-soft">Ya nadie va a poder editar este mes. ¿Cerrar?</span>
          <button type="button" disabled={pending} onClick={onConfirm} className="rounded-full bg-admin-bad-text px-4 py-2 text-[0.82rem] font-semibold text-white disabled:opacity-60">
            {pending ? "Cerrando…" : "Sí, aprobar y cerrar"}
          </button>
          <button type="button" disabled={pending} onClick={() => setConfirming(false)} className="text-[0.82rem] text-admin-ink-soft hover:underline disabled:opacity-60">
            Cancelar
          </button>
        </div>
        {error && <p className="text-[0.8rem] text-admin-bad-text">{error}</p>}
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white">
      Aprobar y cerrar mes
    </button>
  );
}
