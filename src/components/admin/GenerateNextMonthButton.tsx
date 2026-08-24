"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateNextMonth } from "@/app/admin/asistencia/calendario/actions";
import type { GenerateMonthResult } from "@/lib/shift-schedule";

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export function GenerateNextMonthButton({ targetMonth }: { targetMonth: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<GenerateMonthResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!window.confirm(`¿Generar ${monthLabel(targetMonth)} siguiendo el patrón vigente? No se pisa lo que ya hayas capturado ese mes.`)) return;
    setPending(true);
    setError(null);
    setResult(null);
    try {
      const r = await generateNextMonth(targetMonth);
      setResult(r);
      router.refresh();
    } catch {
      setError("No se pudo generar el calendario.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink disabled:opacity-60"
      >
        {pending ? "Generando…" : `Generar ${monthLabel(targetMonth)} automáticamente`}
      </button>

      {result && (
        <p className="mt-2 text-[0.8rem] text-admin-ink-soft">
          Matutino: {result.matutinoName ?? "Vacante"} · Vespertino: {result.vespertinoName ?? "Vacante"}.
          {result.soloWeekend && " Solo hay una empleada activa: los fines de semana quedaron en su turno normal, sin doblar — revísalo a mano si quieres que cubra el día completo."}
        </p>
      )}
      {error && <p className="mt-2 text-[0.8rem] font-semibold text-admin-bad-text">{error}</p>}
    </div>
  );
}
