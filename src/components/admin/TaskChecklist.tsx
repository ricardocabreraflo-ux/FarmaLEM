"use client";

import { useState, useTransition } from "react";
import { confirmTaskForSession } from "@/app/admin/reloj/actions";
import type { OperationalTaskDef, TaskCheckStatus } from "@/lib/operational-tasks";

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });
}

export function TaskChecklist({ tasks, checkDate, initialStatus }: { tasks: OperationalTaskDef[]; checkDate: string; initialStatus: Record<string, TaskCheckStatus> }) {
  const [status, setStatus] = useState(initialStatus);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function confirm(taskKey: string) {
    setError(null);
    setPendingKey(taskKey);
    startTransition(async () => {
      const res = await confirmTaskForSession(taskKey, checkDate);
      if (res.ok) {
        setStatus((prev) => ({ ...prev, [taskKey]: { done: true, doneAt: new Date().toISOString(), doneBy: null } }));
      } else {
        setError(res.error ?? "No se pudo confirmar.");
      }
      setPendingKey(null);
    });
  }

  return (
    <div className="mt-5 rounded-2xl border border-admin-border bg-admin-surface p-5">
      <h2 className="font-display text-base text-admin-ink">Tareas de hoy</h2>
      <p className="mt-1 text-[0.82rem] text-admin-ink-soft">Si te llega el aviso, puedes confirmar ahí mismo — esto es por si lo cierras sin querer.</p>
      {error && <p className="mt-2 text-[0.82rem] font-semibold text-admin-bad-text">{error}</p>}
      <div className="mt-3 flex flex-col divide-y divide-admin-border">
        {tasks.map((task) => {
          const s = status[task.key];
          return (
            <div key={task.key} className="flex items-center justify-between gap-3 py-2.5">
              <span className="text-[0.88rem] font-semibold text-admin-ink">{task.label}</span>
              {s?.done ? (
                <span className="rounded-full bg-admin-ok-bg px-3 py-1 text-[0.78rem] font-semibold text-admin-ok-text">
                  ✓ Hecho{s.doneAt ? ` · ${fmtTime(s.doneAt)}` : ""}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={pendingKey === task.key}
                  onClick={() => confirm(task.key)}
                  className="rounded-full bg-admin-primary px-4 py-1.5 text-[0.8rem] font-semibold text-white disabled:opacity-60"
                >
                  {pendingKey === task.key ? "Guardando…" : "Ya lo hice"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
