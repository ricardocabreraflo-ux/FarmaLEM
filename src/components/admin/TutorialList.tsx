"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toggleTutorialVisibility } from "@/app/admin/ayuda/actions";
import type { Tutorial } from "@/lib/tutorials";
import { TUTORIAL_SECTIONS } from "@/lib/tutorial-sections";

function groupBySection(items: Tutorial[]) {
  const bySection = new Map<string, Tutorial[]>();
  for (const t of items) {
    const list = bySection.get(t.section) ?? [];
    list.push(t);
    bySection.set(t.section, list);
  }
  return TUTORIAL_SECTIONS.map((section) => ({ section, items: bySection.get(section) ?? [] })).filter((g) => g.items.length > 0);
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="M5 7.5 10 12.5 15 7.5" />
    </svg>
  );
}

/** Acceso hoy de un rol de permisos a la pantalla que documenta un tutorial — null = no aplica (no corresponde a una pantalla propia). */
export interface TutorialRoleAccess {
  vendedor: boolean | null;
  vendedorPlus: boolean | null;
}

function RoleAccessBadge({ label, access }: { label: string; access: boolean | null }) {
  if (access === null) {
    return (
      <span className="inline-flex items-center gap-1.5 text-admin-ink-soft" title={`${label}: no aplica`}>
        <span className="grid h-4 w-4 place-items-center rounded-full bg-admin-bg text-[0.62rem] leading-none">–</span>
        <span className="text-[0.72rem]">{label}</span>
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 ${access ? "text-admin-ok-text" : "text-admin-ink-soft"}`} title={`${label}: ${access ? "sí puede ver esta pantalla hoy" : "no ve esta pantalla hoy"}`}>
      <span className={`grid h-4 w-4 place-items-center rounded-full text-[0.62rem] font-bold leading-none ${access ? "bg-admin-ok-bg" : "bg-admin-border"}`} aria-hidden="true">
        {access ? "✓" : "–"}
      </span>
      <span className="text-[0.72rem] font-semibold">{label}</span>
    </span>
  );
}

export function TutorialList({
  tutorials,
  isAdmin,
  roleAccess = {},
}: {
  tutorials: Tutorial[];
  isAdmin: boolean;
  roleAccess?: Record<string, TutorialRoleAccess>;
}) {
  const [items, setItems] = useState(tutorials);
  const [pending, startTransition] = useTransition();
  const groups = groupBySection(tutorials);
  const [openSections, setOpenSections] = useState<Set<string>>(() => new Set(groups.length > 0 ? [groups[0].section] : []));

  function toggle(slug: string, next: boolean) {
    setItems((prev) => prev.map((t) => (t.slug === slug ? { ...t, visible: next } : t)));
    startTransition(async () => {
      await toggleTutorialVisibility(slug, next);
    });
  }

  function toggleSection(section: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  }

  if (items.length === 0) {
    return <p className="mt-8 rounded-2xl border border-admin-border bg-admin-surface p-6 text-center text-admin-ink-soft">Por ahora no hay tutoriales visibles para ti.</p>;
  }

  return (
    <div className="mt-5 flex flex-col gap-3">
      {groupBySection(items).map(({ section, items: sectionItems }) => {
        const open = openSections.has(section);
        return (
          <section key={section} className="overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
            <button
              type="button"
              onClick={() => toggleSection(section)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <span className="flex items-center gap-2 font-display text-[0.9rem] uppercase tracking-wide text-admin-ink-soft">
                {section}
                <span className="rounded-full bg-admin-bg px-2 py-0.5 text-[0.72rem] font-semibold normal-case tracking-normal text-admin-ink-soft">{sectionItems.length}</span>
              </span>
              <ChevronIcon open={open} />
            </button>

            {open && (
              <div className="flex flex-col gap-3 border-t border-admin-border p-4 pt-3">
                {sectionItems.map((t) => {
                  const access = roleAccess[t.slug];
                  return (
                    <div key={t.slug} className={`rounded-2xl border border-admin-border bg-admin-bg p-4 transition-opacity ${!t.visible && isAdmin ? "opacity-60" : ""}`}>
                      <Link href={`/admin/ayuda/${t.slug}`} className="block">
                        <p className="font-display text-base text-admin-ink">{t.title}</p>
                        <p className="mt-0.5 text-[0.82rem] text-admin-ink-soft">{t.summary}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[0.74rem] font-semibold">
                          <span className="rounded-full bg-admin-primary-soft px-2.5 py-0.5 text-admin-primary-deep">{t.audience}</span>
                          <span className="text-admin-ink-soft">{t.minutes} min de lectura</span>
                        </div>
                      </Link>

                      {isAdmin && (
                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-admin-border pt-3">
                          <RoleAccessBadge label="Vendedor" access={access?.vendedor ?? null} />
                          <RoleAccessBadge label="Vendedor Plus" access={access?.vendedorPlus ?? null} />

                          <div className="ml-auto flex items-center gap-2">
                            <span className={`text-[0.72rem] font-semibold ${t.visible ? "text-admin-ok-text" : "text-admin-ink-soft"}`}>{t.visible ? "Visible en Ayuda" : "Oculto"}</span>
                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => toggle(t.slug, !t.visible)}
                              aria-pressed={t.visible}
                              aria-label={t.visible ? `Ocultar “${t.title}” del equipo` : `Mostrar “${t.title}” al equipo`}
                              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-60 ${t.visible ? "bg-admin-primary" : "bg-admin-border"}`}
                            >
                              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${t.visible ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
