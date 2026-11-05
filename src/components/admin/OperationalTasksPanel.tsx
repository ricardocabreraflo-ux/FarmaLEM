"use client";

import { useState, useTransition } from "react";
import {
  createOperationalTaskDefAction,
  updateOperationalTaskDefAction,
  setOperationalTaskDefActiveAction,
  deleteOperationalTaskDefAction,
  type OperationalTaskActionResult,
} from "@/app/admin/configuracion/actions";
import type { OperationalTaskDef, OperationalTaskShift, TaskCheckStatus } from "@/lib/operational-tasks";

const WEEKDAY_OPTIONS: { num: number; label: string }[] = [
  { num: 1, label: "L" },
  { num: 2, label: "M" },
  { num: 3, label: "M" },
  { num: 4, label: "J" },
  { num: 5, label: "V" },
  { num: 6, label: "S" },
  { num: 0, label: "D" },
];

function fmtTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function fmtWeekdays(weekdays: number[]) {
  if (weekdays.length === 7) return "Todos los días";
  const set = new Set(weekdays);
  if ([1, 2, 3, 4, 5].every((n) => set.has(n)) && weekdays.length === 5) return "Lunes a viernes";
  return WEEKDAY_OPTIONS.filter((d) => set.has(d.num))
    .map((d) => d.label)
    .join(" ");
}

interface FormValue {
  label: string;
  time: string;
  weekdays: number[];
  shift: OperationalTaskShift;
}

const EMPTY_FORM: FormValue = { label: "", time: "18:00", weekdays: [1, 2, 3, 4, 5], shift: "Vespertino" };

function TaskForm({ initial, onCancel, onSubmit, pending }: { initial: FormValue; onCancel: () => void; onSubmit: (v: FormValue) => void; pending: boolean }) {
  const [value, setValue] = useState(initial);

  function toggleDay(num: number) {
    setValue((v) => ({ ...v, weekdays: v.weekdays.includes(num) ? v.weekdays.filter((d) => d !== num) : [...v.weekdays, num] }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.label.trim() || value.weekdays.length === 0) return;
        onSubmit(value);
      }}
      className="mt-3 flex flex-col gap-3 rounded-xl border border-admin-border bg-admin-surface px-4 py-3"
    >
      <input
        autoFocus
        value={value.label}
        onChange={(e) => setValue((v) => ({ ...v, label: e.target.value }))}
        placeholder="Ej. Verificar caja chica"
        className="rounded-lg border border-admin-border bg-admin-input-bg px-3 py-2 text-[0.85rem] text-admin-ink outline-none"
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-[0.82rem] text-admin-ink-soft">
          Hora
          <input
            type="time"
            value={value.time}
            onChange={(e) => setValue((v) => ({ ...v, time: e.target.value }))}
            className="rounded-lg border border-admin-border bg-admin-input-bg px-3 py-1.5 text-[0.85rem] text-admin-ink outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-[0.82rem] text-admin-ink-soft">
          Turno
          <select
            value={value.shift}
            onChange={(e) => setValue((v) => ({ ...v, shift: e.target.value as OperationalTaskShift }))}
            className="rounded-lg border border-admin-border bg-admin-input-bg px-3 py-1.5 text-[0.85rem] text-admin-ink outline-none"
          >
            <option value="Matutino">Matutino</option>
            <option value="Vespertino">Vespertino</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[0.82rem] text-admin-ink-soft">Días:</span>
        {WEEKDAY_OPTIONS.map((d) => (
          <button
            key={d.num}
            type="button"
            onClick={() => toggleDay(d.num)}
            className={`grid h-8 w-8 place-items-center rounded-full text-[0.78rem] font-semibold ${
              value.weekdays.includes(d.num) ? "bg-admin-primary text-white" : "border border-admin-border text-admin-ink-soft"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="text-[0.8rem] font-semibold text-admin-primary disabled:opacity-60">
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={onCancel} className="text-[0.8rem] text-admin-ink-soft">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function OperationalTasksPanel({ initialTasks, todayChecks }: { initialTasks: OperationalTaskDef[]; todayChecks: Record<string, TaskCheckStatus> }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function run(id: string, action: () => Promise<OperationalTaskActionResult>) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok && res.tasks) setTasks(res.tasks);
      else if (!res.ok) setError(res.error ?? "No se pudo completar la acción.");
      setBusyId(null);
    });
  }

  function toInput(v: FormValue) {
    const [hourStr, minuteStr] = v.time.split(":");
    return { label: v.label.trim(), hour: Number(hourStr), minute: Number(minuteStr), weekdays: v.weekdays, shift: v.shift };
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.82rem] text-admin-ink-soft">
          {tasks.length} tarea{tasks.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditingId(null);
          }}
          aria-label="Nueva tarea"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-admin-primary text-lg font-bold text-white"
        >
          +
        </button>
      </div>

      {error && <p className="mt-3 rounded-lg bg-admin-bad-bg px-4 py-2 text-[0.82rem] text-admin-bad-text">{error}</p>}

      {creating && (
        <TaskForm
          initial={EMPTY_FORM}
          pending={busyId === "new"}
          onCancel={() => setCreating(false)}
          onSubmit={(v) => {
            setCreating(false);
            run("new", () => createOperationalTaskDefAction(toInput(v)));
          }}
        />
      )}

      <div className="mt-3 flex flex-col divide-y divide-admin-border rounded-xl border border-admin-border bg-admin-surface">
        {tasks.length === 0 && <p className="px-4 py-6 text-center text-[0.85rem] text-admin-ink-soft">Sin tareas configuradas</p>}
        {tasks.map((task) => {
          const busy = busyId === task.id;
          const check = todayChecks[task.key];
          return (
            <div key={task.id} className="flex flex-col gap-2 px-4 py-3">
              {editingId === task.id ? (
                <TaskForm
                  initial={{ label: task.label, time: fmtTime(task.hour, task.minute), weekdays: task.weekdays, shift: task.shift }}
                  pending={busy}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(v) => {
                    setEditingId(null);
                    run(task.id, () => updateOperationalTaskDefAction(task.id, toInput(v)));
                  }}
                />
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[0.88rem] font-semibold text-admin-ink">{task.label}</span>
                      <p className="text-[0.78rem] text-admin-ink-soft">
                        {fmtTime(task.hour, task.minute)} &middot; {fmtWeekdays(task.weekdays)} &middot; {task.shift}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => run(task.id, () => setOperationalTaskDefActiveAction(task.id, !task.active))}
                        className={`rounded-full px-3 py-1 text-[0.76rem] font-semibold disabled:opacity-40 ${
                          task.active ? "bg-admin-ok-bg text-admin-ok-text" : "bg-admin-pending-bg text-admin-pending-text"
                        }`}
                      >
                        {task.active ? "Activa" : "Inactiva"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(task.id);
                          setCreating(false);
                        }}
                        className="text-[0.78rem] font-semibold text-admin-primary hover:underline"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setDeletingId(task.id);
                          setError(null);
                        }}
                        className="text-[0.78rem] font-semibold text-admin-bad-text hover:underline disabled:opacity-40"
                      >
                        Borrar
                      </button>
                    </div>
                  </div>

                  {task.active && (
                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-[0.74rem] font-semibold ${
                        check?.done ? "bg-admin-ok-bg text-admin-ok-text" : "bg-admin-pending-bg text-admin-pending-text"
                      }`}
                    >
                      {check?.done ? "✓ Hoy: confirmada" : "Hoy: pendiente"}
                    </span>
                  )}

                  {deletingId === task.id && (
                    <div className="flex items-center justify-end gap-2 rounded-lg border border-admin-bad-text bg-admin-bad-bg px-3 py-2">
                      <span className="text-[0.78rem] text-admin-bad-text">¿Borrar &quot;{task.label}&quot;?</span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setDeletingId(null);
                          run(task.id, () => deleteOperationalTaskDefAction(task.id));
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
                </>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[0.78rem] text-admin-ink-soft">
        A la hora que pongas, a quien tenga ese turno le llega un push con botón &quot;Ya lo hice&quot; — y a ti te avisa en cuanto lo confirme.
      </p>
    </div>
  );
}
