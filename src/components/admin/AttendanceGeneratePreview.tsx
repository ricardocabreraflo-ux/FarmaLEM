"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { planAttendanceFromCutsAction, generateAttendanceFromCutsAction } from "@/app/admin/asistencia/actions";
import { buildMonthWeeks } from "@/lib/calendar-weeks";
import type { AttendancePlanCell, AttendancePlanOutcome, GenerateAttendanceResult } from "@/lib/attendance";

const SHIFTS: Array<"Matutino" | "Vespertino"> = ["Matutino", "Vespertino"];
const WEEKDAY_LABELS = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"];

const OUTCOME_STYLE: Record<AttendancePlanOutcome, string> = {
  asistencia: "bg-admin-ok-bg text-admin-ok-text",
  falta: "bg-admin-bad-bg text-admin-bad-text",
  pendiente: "bg-admin-pending-bg text-admin-pending-text",
  ya_capturado: "bg-admin-bg text-admin-ink-soft",
};

const OUTCOME_LABEL: Record<AttendancePlanOutcome, string> = {
  asistencia: "ASISTENCIA",
  falta: "FALTA",
  pendiente: "PENDIENTE",
  ya_capturado: "YA CAPTURADO",
};

function firstName(name: string | null) {
  if (!name) return "";
  return name.trim().split(/\s+/)[0]?.toUpperCase() ?? name;
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "2-digit", month: "short" });
}

export function AttendanceGeneratePreview({ month }: { month: string }) {
  const router = useRouter();
  const [cells, setCells] = useState<AttendancePlanCell[] | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateAttendanceResult | null>(null);

  const weeks = buildMonthWeeks(month);
  const byKey = new Map((cells ?? []).map((c) => [`${c.date}-${c.shift}`, c]));
  const counts = (cells ?? []).reduce<Record<string, number>>((acc, c) => {
    acc[c.outcome] = (acc[c.outcome] ?? 0) + 1;
    return acc;
  }, {});
  const pendingToWrite = (cells ?? []).filter((c) => c.outcome === "asistencia" || c.outcome === "falta").length;

  async function loadPreview() {
    setLoadingPreview(true);
    setError(null);
    setResult(null);
    const outcome = await planAttendanceFromCutsAction(month);
    setLoadingPreview(false);
    if (outcome.ok && outcome.cells) setCells(outcome.cells);
    else setError(outcome.error ?? "No se pudo calcular la vista previa.");
  }

  async function confirmGenerate() {
    const ok = window.confirm(`¿Guardar ${pendingToWrite} registros de asistencia de ${monthLabel(month)} según esta vista previa?`);
    if (!ok) return;
    setGenerating(true);
    setError(null);
    const outcome = await generateAttendanceFromCutsAction(month);
    setGenerating(false);
    if (outcome.ok && outcome.result) {
      setResult(outcome.result);
      setCells(null);
      router.refresh();
    } else {
      setError(outcome.error ?? "No se pudo generar la asistencia.");
    }
  }

  return (
    <div>
      {!cells && (
        <button
          type="button"
          onClick={loadPreview}
          disabled={loadingPreview}
          className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink disabled:opacity-60"
        >
          {loadingPreview ? "Calculando…" : "Vista previa: generar asistencia desde los cortes"}
        </button>
      )}

      {error && <p className="mt-3 rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.82rem] font-semibold text-admin-bad-text">{error}</p>}

      {result && (
        <div className="mt-3 rounded-lg bg-admin-ok-bg px-4 py-3 text-[0.82rem] font-semibold text-admin-ok-text">
          <p>Listo — se guardaron {result.created} registros de asistencia.</p>
          {result.weekendPending.length > 0 && (
            <div className="mt-2 font-normal">
              <p>Estos fines de semana no tenían corte capturado, así que no se supo a quién marcarle falta — captúralos a mano:</p>
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

      {cells && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCells(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Vista previa de asistencia"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-[880px] flex-col overflow-hidden rounded-2xl bg-admin-surface shadow-lg"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border px-5 py-4">
              <div>
                <h2 className="font-display text-lg text-admin-ink capitalize">Vista previa · {monthLabel(month)}</h2>
                <div className="mt-1.5 flex flex-wrap gap-2 text-[0.76rem] font-semibold">
                  <span className="rounded-full bg-admin-ok-bg px-3 py-1 text-admin-ok-text">{counts.asistencia ?? 0} asistencia</span>
                  <span className="rounded-full bg-admin-bad-bg px-3 py-1 text-admin-bad-text">{counts.falta ?? 0} falta</span>
                  <span className="rounded-full bg-admin-pending-bg px-3 py-1 text-admin-pending-text">{counts.pendiente ?? 0} pendiente</span>
                  <span className="rounded-full border border-admin-border px-3 py-1 text-admin-ink-soft">{counts.ya_capturado ?? 0} ya capturado</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCells(null)}
                aria-label="Cerrar"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-admin-ink-soft hover:bg-admin-bg"
              >
                ✕
              </button>
            </div>

            <div className="overflow-auto px-5 py-4">
              <div className="overflow-x-auto rounded-2xl border border-admin-border bg-admin-surface">
                <table className="w-full min-w-[760px] border-collapse text-[0.76rem]">
                  <thead>
                    <tr className="border-b border-admin-border bg-admin-bg text-admin-ink-soft">
                      <th className="w-10 px-2 py-2 text-left font-medium"></th>
                      {WEEKDAY_LABELS.map((label) => (
                        <th key={label} className="px-2 py-2 text-left font-medium">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weeks.map((week) => (
                      <Fragment key={week.label}>
                        {SHIFTS.map((shift, shiftIdx) => (
                          <tr key={`${week.label}-${shift}`} className={`border-b border-admin-border ${shiftIdx === 0 ? "border-t-2 border-t-admin-border" : ""}`}>
                            {shiftIdx === 0 && (
                              <td rowSpan={2} className="border-r border-admin-border px-2 py-2 align-top text-[0.68rem] font-bold text-admin-ink-soft">
                                {week.days[0].dayNum}
                              </td>
                            )}
                            {week.days.map((day) => {
                              const cell = byKey.get(`${day.date}-${shift}`);
                              return (
                                <td key={day.date} className={`px-1.5 py-1.5 align-top ${day.inMonth ? "" : "opacity-30"}`}>
                                  {cell ? (
                                    <div className={`flex w-full flex-col items-start rounded-lg px-2 py-1.5 leading-tight ${OUTCOME_STYLE[cell.outcome]}`}>
                                      <span className="text-[0.6rem] font-semibold opacity-70">{shift === "Matutino" ? "M" : "V"}</span>
                                      <span className="font-bold">{OUTCOME_LABEL[cell.outcome]}</span>
                                      {cell.employeeName && <span className="text-[0.66rem] font-semibold opacity-80">{firstName(cell.employeeName)}</span>}
                                    </div>
                                  ) : (
                                    <div className="px-2 py-1.5 text-admin-ink-soft">—</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-admin-border px-5 py-4">
              <button
                type="button"
                onClick={() => setCells(null)}
                className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink-soft"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmGenerate}
                disabled={generating || pendingToWrite === 0}
                className="rounded-full bg-admin-primary px-6 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
              >
                {generating ? "Generando…" : `Confirmar y generar (${pendingToWrite})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
