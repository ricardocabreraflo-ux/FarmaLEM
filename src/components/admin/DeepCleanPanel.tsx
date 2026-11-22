"use client";

import { useState, useTransition } from "react";
import { createDeepCleanOccurrenceAction, deleteDeepCleanOccurrenceAction, type DeepCleanActionResult } from "@/app/admin/configuracion/actions";
import type { DeepCleanOccurrence, DeepCleanShift } from "@/lib/deep-clean";

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function otherShift(shift: DeepCleanShift): DeepCleanShift {
  return shift === "Matutino" ? "Vespertino" : "Matutino";
}

function todayStr() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
}

export function DeepCleanPanel({ initialOccurrences }: { initialOccurrences: DeepCleanOccurrence[] }) {
  const [occurrences, setOccurrences] = useState(initialOccurrences);
  const [creating, setCreating] = useState(false);
  const [date, setDate] = useState(todayStr());
  const [firstHalfShift, setFirstHalfShift] = useState<DeepCleanShift>(occurrences[0] ? otherShift(occurrences[0].firstHalfShift) : "Vespertino");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function run(action: () => Promise<DeepCleanActionResult>) {
    setBusy(true);
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok && res.occurrences) setOccurrences(res.occurrences);
      else if (!res.ok) setError(res.error ?? "No se pudo completar la acción.");
      setBusy(false);
    });
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.82rem] text-admin-ink-soft">
          {occurrences.length === 0 ? "Sin registros" : `Última: ${fmtDate(occurrences[0].occurredOn)} · Mitad 1 la hizo ${occurrences[0].firstHalfShift}`}
        </p>
        <button
          type="button"
          onClick={() => setCreating(true)}
          aria-label="Registrar limpieza profunda"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-admin-primary text-lg font-bold text-white"
        >
          +
        </button>
      </div>

      {error && <p className="mt-3 rounded-lg bg-admin-bad-bg px-4 py-2 text-[0.82rem] text-admin-bad-text">{error}</p>}

      {creating && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setCreating(false);
            run(() => createDeepCleanOccurrenceAction(date, firstHalfShift));
          }}
          className="mt-3 flex flex-col gap-3 rounded-xl border border-admin-border bg-admin-surface px-4 py-3"
        >
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-[0.82rem] text-admin-ink-soft">
              Fecha
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-admin-border bg-admin-input-bg px-3 py-1.5 text-[0.85rem] text-admin-ink outline-none"
              />
            </label>
            <label className="flex items-center gap-2 text-[0.82rem] text-admin-ink-soft">
              ¿Quién hace la Mitad 1?
              <select
                value={firstHalfShift}
                onChange={(e) => setFirstHalfShift(e.target.value as DeepCleanShift)}
                className="rounded-lg border border-admin-border bg-admin-input-bg px-3 py-1.5 text-[0.85rem] text-admin-ink outline-none"
              >
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
              </select>
            </label>
          </div>
          <p className="text-[0.76rem] text-admin-ink-soft">El otro turno hace la Mitad 2 ese mismo día.</p>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={busy} className="text-[0.8rem] font-semibold text-admin-primary disabled:opacity-60">
              {busy ? "Guardando…" : "Guardar"}
            </button>
            <button type="button" onClick={() => setCreating(false)} className="text-[0.8rem] text-admin-ink-soft">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-3 flex flex-col divide-y divide-admin-border rounded-xl border border-admin-border bg-admin-surface">
        {occurrences.length === 0 && <p className="px-4 py-6 text-center text-[0.85rem] text-admin-ink-soft">Sin limpiezas profundas registradas</p>}
        {occurrences.map((occ) => (
          <div key={occ.id} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[0.88rem] font-semibold text-admin-ink">{fmtDate(occ.occurredOn)}</span>
                <p className="text-[0.78rem] text-admin-ink-soft">
                  Mitad 1: {occ.firstHalfShift} &middot; Mitad 2: {otherShift(occ.firstHalfShift)}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setDeletingId(occ.id);
                  setError(null);
                }}
                className="text-[0.78rem] font-semibold text-admin-bad-text hover:underline disabled:opacity-40"
              >
                Borrar
              </button>
            </div>
            {deletingId === occ.id && (
              <div className="flex items-center justify-end gap-2 rounded-lg border border-admin-bad-text bg-admin-bad-bg px-3 py-2">
                <span className="text-[0.78rem] text-admin-bad-text">¿Borrar este registro?</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setDeletingId(null);
                    run(() => deleteDeepCleanOccurrenceAction(occ.id));
                  }}
                  className="text-[0.8rem] font-semibold text-admin-bad-text hover:underline disabled:opacity-60"
                >
                  Sí, borrar
                </button>
                <button type="button" onClick={() => setDeletingId(null)} className="text-[0.8rem] text-admin-ink-soft hover:underline">
                  Cancelar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[0.78rem] text-admin-ink-soft">
        Se divide en Mitad 1 y Mitad 2 — cada turno la ve ese día en &quot;Actividades de hoy&quot; (Inicio) con su propio &quot;Ya lo hice&quot;.
      </p>
    </div>
  );
}
