"use client";

import { useState, useTransition } from "react";
import { ackAnnouncementAction } from "@/app/admin/inicio/actions";

export function AnnouncementAckButton({ id, initialAcked }: { id: string; initialAcked: boolean }) {
  const [acked, setAcked] = useState(initialAcked);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (acked) {
    return <span className="text-[0.78rem] font-semibold text-admin-ok-text">✓ Ya lo viste</span>;
  }

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setError(null);
          startTransition(async () => {
            const res = await ackAnnouncementAction(id);
            if (res.ok) setAcked(true);
            else setError(res.error ?? "No se pudo guardar.");
          });
        }}
        className="rounded-full bg-admin-primary px-3.5 py-1.5 text-[0.78rem] font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Ya lo vi"}
      </button>
      {error && <p className="mt-1 text-[0.74rem] text-admin-bad-text">{error}</p>}
    </div>
  );
}
