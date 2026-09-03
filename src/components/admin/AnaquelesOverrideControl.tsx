"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setShelfOverrideAction, clearShelfOverrideAction } from "@/app/admin/anaqueles/actions";

export function AnaquelesOverrideControl({ month, overridden }: { month: string; overridden: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSet() {
    const ok = window.confirm("¿Invertir el turno de anaqueles de este mes? Va a quedar al revés del patrón automático.");
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const res = await setShelfOverrideAction(month);
      if (res.ok) router.refresh();
      else setError(res.error ?? "No se pudo cambiar.");
    });
  }

  function handleClear() {
    setError(null);
    startTransition(async () => {
      const res = await clearShelfOverrideAction(month);
      if (res.ok) router.refresh();
      else setError(res.error ?? "No se pudo quitar el cambio.");
    });
  }

  if (overridden) {
    return (
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="rounded-full bg-admin-pending-bg px-3 py-1.5 text-[0.78rem] font-semibold text-admin-pending-text">
          Este mes está invertido a mano
        </span>
        <button
          type="button"
          onClick={handleClear}
          disabled={pending}
          className="rounded-full border border-admin-border px-3 py-1.5 text-[0.8rem] font-semibold text-admin-ink-soft disabled:opacity-50"
        >
          {pending ? "…" : "Quitar, volver a lo automático"}
        </button>
        {error && <p className="w-full text-[0.8rem] font-semibold text-admin-bad-text">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button
        type="button"
        onClick={handleSet}
        disabled={pending}
        className="rounded-full border border-admin-border bg-admin-bg px-3 py-1.5 text-[0.8rem] font-semibold text-admin-ink hover:border-admin-primary disabled:opacity-50"
      >
        {pending ? "…" : "Cambiar turno de este mes"}
      </button>
      {error && <p className="w-full text-[0.8rem] font-semibold text-admin-bad-text">{error}</p>}
    </div>
  );
}
