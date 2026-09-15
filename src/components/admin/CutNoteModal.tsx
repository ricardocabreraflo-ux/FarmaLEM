"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCutNotesAction } from "@/app/admin/cortes/actions";

export function CutNoteModal({ cutId, initialNotes, onClose }: { cutId: string; initialNotes: string | null; onClose: () => void }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateCutNotesAction(cutId, notes);
      if (!res.ok) {
        setError(res.error ?? "No se pudo guardar la nota.");
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[420px] rounded-2xl bg-admin-surface p-6 shadow-lg"
      >
        <h2 className="font-display text-lg text-admin-ink">Nota del corte</h2>
        <p className="mt-1 text-[0.82rem] text-admin-ink-soft">Una observación libre — por qué se rechazó, alguna aclaración, etc.</p>

        <textarea
          autoFocus
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Escribe la nota…"
          className="mt-4 w-full resize-none rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-[0.85rem] text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary"
        />

        {error && <p className="mt-3 rounded-lg bg-admin-bad-bg px-4 py-2 text-[0.82rem] text-admin-bad-text">{error}</p>}

        <div className="mt-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink-soft">
            Cancelar
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onSave}
            className="rounded-full bg-admin-primary px-6 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
          >
            {pending ? "Guardando…" : "Guardar nota"}
          </button>
        </div>
      </div>
    </div>
  );
}
