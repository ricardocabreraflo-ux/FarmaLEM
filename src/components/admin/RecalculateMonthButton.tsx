"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recalculateMonthBonusWeeksAction } from "@/app/admin/bonos/actions";

/** Vuelve a calcular las ventas de cada semana ya guardada de ese mes desde los cortes — para cuando se aprueban cortes después de que la semana se generó sola. */
export function RecalculateMonthButton({ month }: { month: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      const res = await recalculateMonthBonusWeeksAction(month);
      if (res.ok) router.refresh();
      else setError(res.error ?? "No se pudo recalcular.");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={run}
        className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink disabled:opacity-60"
      >
        {pending ? "Recalculando…" : "Recalcular mes"}
      </button>
      {error && <span className="text-[0.78rem] font-semibold text-admin-bad-text">{error}</span>}
    </div>
  );
}
