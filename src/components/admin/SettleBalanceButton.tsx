"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { settlePendingForCashierAction } from "@/app/admin/diferencias/actions";

export function SettleBalanceButton({ cashierId }: { cashierId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await settlePendingForCashierAction(cashierId);
      if (!res.ok) {
        setError(res.error ?? "No se pudo marcar como pagado.");
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  }

  if (confirming) {
    return (
      <div className="mt-2 flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[0.76rem] text-admin-ink-soft">¿Ya te entregó todo?</span>
          <button type="button" disabled={pending} onClick={onConfirm} className="text-[0.78rem] font-semibold text-admin-primary hover:underline disabled:opacity-60">
            {pending ? "Guardando…" : "Sí, pagado"}
          </button>
          <button type="button" disabled={pending} onClick={() => setConfirming(false)} className="text-[0.78rem] text-admin-ink-soft hover:underline disabled:opacity-60">
            Cancelar
          </button>
        </div>
        {error && <p className="text-[0.74rem] text-admin-bad-text">{error}</p>}
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} className="mt-2 rounded-full bg-admin-primary px-3.5 py-1.5 text-[0.78rem] font-semibold text-white">
      Marcar pagado
    </button>
  );
}
