"use client";

import { useState } from "react";
import Link from "next/link";
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
    const outcome = await generateNextMonth(targetMonth);
    setPending(false);
    if (outcome.ok) {
      setResult(outcome.result);
      router.refresh();
    } else {
      setError(outcome.error);
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
        <div className="mt-3 rounded-lg bg-admin-ok-bg px-4 py-3 text-[0.82rem] font-semibold text-admin-ok-text">
          <p>
            Listo — {monthLabel(targetMonth)} generado. Matutino: {result.matutinoName ?? "Vacante"} · Vespertino: {result.vespertinoName ?? "Vacante"}.
            {result.soloWeekend && " Solo hay una empleada activa: los fines de semana quedaron en su turno normal, sin doblar — revísalo a mano si quieres que cubra el día completo."}
          </p>
          <Link href={`/admin/asistencia/calendario?mes=${targetMonth}`} className="mt-1.5 inline-block underline">
            Ver {monthLabel(targetMonth)} &rarr;
          </Link>
        </div>
      )}
      {error && <p className="mt-3 rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.82rem] font-semibold text-admin-bad-text">{error}</p>}
    </div>
  );
}
