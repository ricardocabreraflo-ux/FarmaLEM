"use client";

import { Fragment, useState } from "react";
import { getAttendanceCalendarAction } from "@/app/admin/asistencia/actions";
import { buildMonthWeeks } from "@/lib/calendar-weeks";
import type { AttendanceCalendarCell, AttendanceCalendarOutcome } from "@/lib/attendance";

const SHIFTS: Array<"Matutino" | "Vespertino"> = ["Matutino", "Vespertino"];
const WEEKDAY_LABELS = ["LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO", "DOMINGO"];

const OUTCOME_STYLE: Record<AttendanceCalendarOutcome, string> = {
  Asistió: "bg-admin-ok-bg text-admin-ok-text",
  "Cubrió turno": "bg-admin-primary-soft text-admin-primary-deep",
  Falta: "bg-admin-bad-bg text-admin-bad-text",
  Descanso: "bg-admin-bg text-admin-ink-soft",
  Cerrado: "bg-admin-bg text-admin-ink-soft",
  "Día festivo": "bg-admin-pending-bg text-admin-pending-text",
  sin_capturar: "text-admin-ink-soft",
};

const OUTCOME_LABEL: Record<AttendanceCalendarOutcome, string> = {
  Asistió: "ASISTENCIA",
  "Cubrió turno": "CUBRIÓ TURNO",
  Falta: "FALTA",
  Descanso: "DESCANSO",
  Cerrado: "CERRADO",
  "Día festivo": "DÍA FESTIVO",
  sin_capturar: "SIN CAPTURAR",
};

const COUNT_ORDER: AttendanceCalendarOutcome[] = ["Asistió", "Cubrió turno", "Falta", "Día festivo", "Descanso", "Cerrado", "sin_capturar"];

function firstName(name: string | null) {
  if (!name) return "";
  return name.trim().split(/\s+/)[0]?.toUpperCase() ?? name;
}

function monthLabel(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

export function AttendanceCalendarView({ month }: { month: string }) {
  const [cells, setCells] = useState<AttendanceCalendarCell[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const weeks = buildMonthWeeks(month);
  const byKey = new Map((cells ?? []).map((c) => [`${c.date}-${c.shift}`, c]));
  const counts = (cells ?? []).reduce<Record<string, number>>((acc, c) => {
    acc[c.outcome] = (acc[c.outcome] ?? 0) + 1;
    return acc;
  }, {});

  async function open() {
    setLoading(true);
    setError(null);
    const outcome = await getAttendanceCalendarAction(month);
    setLoading(false);
    if (outcome.ok && outcome.cells) setCells(outcome.cells);
    else setError(outcome.error ?? "No se pudo calcular el calendario.");
  }

  return (
    <div>
      <button
        type="button"
        onClick={open}
        disabled={loading}
        className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
      >
        {loading ? "Calculando…" : "Vista previa del mes"}
      </button>

      {error && <p className="mt-3 rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.82rem] font-semibold text-admin-bad-text">{error}</p>}

      {cells && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCells(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Calendario de asistencia"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-[880px] flex-col overflow-hidden rounded-2xl bg-admin-surface shadow-lg"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-border px-5 py-4">
              <div>
                <h2 className="font-display text-lg text-admin-ink capitalize">Vista previa · {monthLabel(month)}</h2>
                <div className="mt-1.5 flex flex-wrap gap-2 text-[0.76rem] font-semibold">
                  {COUNT_ORDER.map((outcome) => (
                    <span key={outcome} className={`rounded-full px-3 py-1 ${outcome === "sin_capturar" ? "border border-admin-border text-admin-ink-soft" : OUTCOME_STYLE[outcome]}`}>
                      {counts[outcome] ?? 0} {OUTCOME_LABEL[outcome].toLowerCase()}
                    </span>
                  ))}
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

            <div className="flex justify-end border-t border-admin-border px-5 py-4">
              <button
                type="button"
                onClick={() => setCells(null)}
                className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink-soft"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
