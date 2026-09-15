"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteStockoutAction } from "@/app/admin/negados/actions";

export function DeleteStockoutButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const res = await deleteStockoutAction(id);
      if (res.ok) {
        setConfirming(false);
        router.refresh();
      } else {
        setError(res.error ?? "No se pudo borrar.");
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center justify-end gap-2">
          <span className="text-[0.78rem] text-admin-ink-soft">¿Borrar?</span>
          <button type="button" disabled={pending} onClick={onConfirm} className="font-semibold text-admin-bad-text hover:underline disabled:opacity-60">
            {pending ? "Borrando…" : "Sí"}
          </button>
          <button type="button" disabled={pending} onClick={() => setConfirming(false)} className="text-admin-ink-soft hover:underline disabled:opacity-60">
            Cancelar
          </button>
        </div>
        {error && <p className="text-[0.78rem] text-admin-bad-text">{error}</p>}
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setConfirming(true)} className="font-semibold text-admin-bad-text hover:underline">
      Borrar
    </button>
  );
}
