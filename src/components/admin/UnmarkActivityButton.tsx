"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { unmarkActivityAction } from "@/app/admin/inicio/actions";

function IconUndo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 10h10a5 5 0 0 1 0 10H9" />
      <polyline points="8,5.5 4,10 8,14.5" />
    </svg>
  );
}

export function UnmarkActivityButton({ taskKey, checkDate, label }: { taskKey: string; checkDate: string; label: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        title="Desmarcar — vuelve a aparecer como pendiente"
        aria-label={`Desmarcar ${label}`}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await unmarkActivityAction(taskKey, checkDate, label);
            if (result.error) {
              setError(result.error);
              return;
            }
            router.refresh();
          })
        }
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-admin-ink-soft transition-colors hover:bg-admin-bad-bg hover:text-admin-bad-text disabled:opacity-50"
      >
        <IconUndo className="h-[15px] w-[15px]" />
      </button>
      {error && <p className="max-w-[12rem] text-right text-[0.7rem] text-admin-bad-text">{error}</p>}
    </div>
  );
}
