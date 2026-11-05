"use client";

import { useEffect, useState, useTransition } from "react";
import { confirmTaskForSession } from "@/app/admin/reloj/actions";

interface PendingTask {
  key: string;
  label: string;
  checkDate: string;
}

const POLL_MS = 90_000;

/**
 * Tono de alerta de dos notas, generado con Web Audio (sin depender de un
 * archivo de sonido). Los navegadores bloquean el audio sin interacción
 * previa del usuario en esa pestaña — si ya tocaron algo en el panel antes
 * (lo normal a esa hora), suena sin problema; si no, el popup se ve igual,
 * solo que la primera vez puede sonar silencioso.
 */
function playAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      const start = now + i * 0.22;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.25);
    });
    setTimeout(() => ctx.close(), 600);
  } catch {
    // AudioContext no disponible o bloqueado: el popup visual sigue funcionando igual.
  }
}

/**
 * Popup que se abre solo, encima de cualquier pantalla del panel, si quien
 * tiene turno Vespertino tiene una tarea vigente sin confirmar (toldo/luces)
 * — de respaldo al push, por si no llegó o lo cerraron sin querer. Se
 * dismissa con "Más tarde" sin perder la tarea: vuelve a aparecer en el
 * siguiente chequeo si sigue sin confirmarse.
 */
export function PendingTaskPopup({ shift }: { shift: string | null }) {
  const [pending, setPending] = useState<PendingTask[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (shift !== "Vespertino") return;

    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/tasks/pendientes");
        const data = await res.json();
        if (!cancelled) {
          const tasks: PendingTask[] = data.pending ?? [];
          setPending(tasks);
          // Cada chequeo (cada POLL_MS, o al volver a la pestaña) vuelve a mostrarlo si "Más tarde" lo había tapado.
          setDismissed(false);
          if (tasks.length > 0) playAlertSound();
        }
      } catch {
        // sin red por un momento: no pasa nada, se vuelve a intentar en el siguiente chequeo
      }
    }

    check();
    const interval = setInterval(check, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [shift]);

  function confirm(task: PendingTask) {
    setPendingKey(task.key);
    startTransition(async () => {
      const res = await confirmTaskForSession(task.key, task.checkDate);
      if (res.ok) {
        setPending((prev) => prev.filter((t) => t.key !== task.key));
      }
      setPendingKey(null);
    });
  }

  if (pending.length === 0 || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-[380px] rounded-2xl bg-admin-surface p-6 text-center shadow-xl">
        <span className="text-3xl">⏰</span>
        <h2 className="mt-2 font-display text-lg text-admin-ink">Tienes pendiente</h2>
        <div className="mt-4 flex flex-col gap-3">
          {pending.map((task) => (
            <div key={task.key} className="flex items-center justify-between gap-3 rounded-xl border border-admin-border px-4 py-3">
              <span className="text-left text-[0.88rem] font-semibold text-admin-ink">{task.label}</span>
              <button
                type="button"
                disabled={pendingKey === task.key}
                onClick={() => confirm(task)}
                className="shrink-0 rounded-full bg-admin-primary px-4 py-1.5 text-[0.8rem] font-semibold whitespace-nowrap text-white disabled:opacity-60"
              >
                {pendingKey === task.key ? "Guardando…" : "Ya lo hice"}
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="mt-4 text-[0.82rem] font-semibold text-admin-ink-soft underline decoration-dotted"
        >
          Más tarde
        </button>
      </div>
    </div>
  );
}
