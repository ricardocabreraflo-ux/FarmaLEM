"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateAttendanceFromCutsAction } from "@/app/admin/asistencia/actions";
import type { GenerateAttendanceResult } from "@/lib/attendance";

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "2-digit", month: "short" });
}

export function GenerateAttendanceFromCutsButton({ month }: { month: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<GenerateAttendanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    const ok = window.confirm(
      `¿Generar la asistencia de ${monthLabel(month)} a partir de los cortes capturados? Entre semana: corte = Asistió, sin corte = Falta. Fin de semana sin corte se deja pendiente. No pisa lo que ya esté capturado con otro turno u otra empleada.`
    );
    if (!ok) return;
    setPending(true);
    setError(null);
    setResult(null);
    const outcome = await generateAttendanceFromCutsAction(month);
    setPending(false);
    if (outcome.ok && outcome.result) {
      setResult(outcome.result);
      router.refresh();
    } else {
      setError(outcome.error ?? "No se pudo generar la asistencia.");
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
        {pending ? "Generando…" : "Generar asistencia desde los cortes"}
      </button>

      {result && (
        <div className="mt-3 rounded-lg bg-admin-ok-bg px-4 py-3 text-[0.82rem] font-semibold text-admin-ok-text">
          <p>Listo — se guardaron {result.created} registros de asistencia.</p>
          {result.weekendPending.length > 0 && (
            <div className="mt-2 font-normal">
              <p>Estos fines de semana no tenían corte capturado, así que no se pudo saber quién faltó — captúralos a mano:</p>
              <ul className="mt-1 list-disc pl-5">
                {result.weekendPending.map((d) => (
                  <li key={d} className="capitalize">
                    {fmtDate(d)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {error && <p className="mt-3 rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.82rem] font-semibold text-admin-bad-text">{error}</p>}
    </div>
  );
}
