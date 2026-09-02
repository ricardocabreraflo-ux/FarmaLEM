"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleTutorialVisibility } from "@/app/admin/ayuda/actions";
import type { Tutorial } from "@/lib/tutorials";

export function TutorialList({ tutorials, isAdmin }: { tutorials: Tutorial[]; isAdmin: boolean }) {
  const [items, setItems] = useState(tutorials);
  const [pending, startTransition] = useTransition();

  function toggle(slug: string, next: boolean) {
    setItems((prev) => prev.map((t) => (t.slug === slug ? { ...t, visible: next } : t)));
    startTransition(async () => {
      await toggleTutorialVisibility(slug, next);
    });
  }

  if (items.length === 0) {
    return <p className="mt-8 rounded-2xl border border-admin-border bg-admin-surface p-6 text-center text-admin-ink-soft">Por ahora no hay tutoriales visibles para ti.</p>;
  }

  return (
    <div className="mt-5 flex flex-col gap-3">
      {items.map((t) => (
        <div
          key={t.slug}
          className={`flex items-center gap-4 rounded-2xl border border-admin-border bg-admin-surface p-4 transition-opacity ${!t.visible && isAdmin ? "opacity-60" : ""}`}
        >
          <Link href={`/admin/ayuda/${t.slug}`} className="flex min-w-0 flex-1 items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-display text-base text-admin-ink">{t.title}</p>
              <p className="mt-0.5 truncate text-[0.82rem] text-admin-ink-soft">{t.summary}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.74rem] font-semibold">
                <span className="rounded-full bg-admin-primary-soft px-2.5 py-0.5 text-admin-primary-deep">{t.audience}</span>
                <span className="text-admin-ink-soft">{t.minutes} min de lectura</span>
              </div>
            </div>
          </Link>

          {isAdmin && (
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <button
                type="button"
                disabled={pending}
                onClick={() => toggle(t.slug, !t.visible)}
                aria-pressed={t.visible}
                aria-label={t.visible ? `Ocultar “${t.title}” del equipo` : `Mostrar “${t.title}” al equipo`}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60 ${t.visible ? "bg-admin-primary" : "bg-admin-border"}`}
              >
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${t.visible ? "translate-x-[22px]" : "translate-x-0.5"}`} />
              </button>
              <span className={`text-[0.7rem] font-semibold ${t.visible ? "text-admin-ok-text" : "text-admin-ink-soft"}`}>{t.visible ? "Visible" : "Oculto"}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
