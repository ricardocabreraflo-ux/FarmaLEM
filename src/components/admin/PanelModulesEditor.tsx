"use client";

import { useState, useTransition } from "react";
import { moveModuleAction, toggleModuleAction, type ModuleActionResult } from "@/app/admin/configuracion/actions";
import type { ModuleEditorEntry, ModuleEditorLeaf } from "@/lib/panel-modules";

function LeafRow({
  leaf,
  indent,
  canMoveUp,
  canMoveDown,
  busy,
  onMove,
  onToggle,
}: {
  leaf: ModuleEditorLeaf;
  indent: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  busy: boolean;
  onMove: (dir: "up" | "down") => void;
  onToggle: (field: "enabled" | "visibleEmployee", value: boolean) => void;
}) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-admin-border bg-admin-surface px-4 py-3 ${indent ? "ml-6" : ""}`}>
      <div className="flex items-center gap-3">
        <div className="flex flex-col leading-none">
          <button type="button" disabled={busy || !canMoveUp} onClick={() => onMove("up")} aria-label="Subir" className="px-1 text-admin-ink-soft disabled:opacity-25">
            ▲
          </button>
          <button type="button" disabled={busy || !canMoveDown} onClick={() => onMove("down")} aria-label="Bajar" className="px-1 text-admin-ink-soft disabled:opacity-25">
            ▼
          </button>
        </div>
        <span className="text-[0.9rem] font-semibold text-admin-ink">{leaf.label}</span>
      </div>
      {leaf.locked ? (
        <span className="text-[0.78rem] text-admin-ink-soft">Siempre activo</span>
      ) : (
        <div className="flex flex-wrap items-center gap-4 text-[0.82rem] text-admin-ink-soft">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={leaf.enabled} disabled={busy} onChange={(e) => onToggle("enabled", e.target.checked)} />
            Activo
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={leaf.visibleEmployee} disabled={busy || !leaf.enabled} onChange={(e) => onToggle("visibleEmployee", e.target.checked)} />
            Visible para vendedor
          </label>
        </div>
      )}
    </div>
  );
}

export function PanelModulesEditor({ initialEntries }: { initialEntries: ModuleEditorEntry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(key: string, action: () => Promise<ModuleActionResult>) {
    setBusyKey(key);
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok && res.entries) setEntries(res.entries);
      else if (!res.ok) setError(res.error ?? "No se pudo actualizar.");
      setBusyKey(null);
    });
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {error && <p className="rounded-lg bg-admin-bad-bg px-4 py-2 text-[0.82rem] text-admin-bad-text">{error}</p>}
      {entries.map((entry, i) => {
        const canMoveUp = i > 0;
        const canMoveDown = i < entries.length - 1;

        if (entry.type === "leaf") {
          return (
            <LeafRow
              key={entry.key}
              leaf={entry}
              indent={false}
              canMoveUp={canMoveUp}
              canMoveDown={canMoveDown}
              busy={busyKey === entry.key}
              onMove={(dir) => run(entry.key, () => moveModuleAction(entry.key, dir))}
              onToggle={(field, value) => run(entry.key, () => toggleModuleAction(entry.key, field, value))}
            />
          );
        }

        return (
          <div key={entry.key} className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-admin-primary/40 bg-admin-primary-soft px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex flex-col leading-none">
                  <button
                    type="button"
                    disabled={busyKey === entry.key || !canMoveUp}
                    onClick={() => run(entry.key, () => moveModuleAction(entry.key, "up"))}
                    aria-label="Subir"
                    className="px-1 text-admin-primary-deep disabled:opacity-25"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    disabled={busyKey === entry.key || !canMoveDown}
                    onClick={() => run(entry.key, () => moveModuleAction(entry.key, "down"))}
                    aria-label="Bajar"
                    className="px-1 text-admin-primary-deep disabled:opacity-25"
                  >
                    ▼
                  </button>
                </div>
                <span className="text-[0.9rem] font-bold text-admin-primary-deep">{entry.label}</span>
              </div>
              <label className="flex items-center gap-1.5 text-[0.82rem] text-admin-primary-deep">
                <input
                  type="checkbox"
                  checked={entry.enabled}
                  disabled={busyKey === entry.key}
                  onChange={(e) => run(entry.key, () => toggleModuleAction(entry.key, "enabled", e.target.checked))}
                />
                Grupo activo
              </label>
            </div>
            <div className="flex flex-col gap-2">
              {entry.items.map((item, j) => (
                <LeafRow
                  key={item.key}
                  leaf={item}
                  indent
                  canMoveUp={j > 0}
                  canMoveDown={j < entry.items.length - 1}
                  busy={busyKey === item.key}
                  onMove={(dir) => run(item.key, () => moveModuleAction(item.key, dir))}
                  onToggle={(field, value) => run(item.key, () => toggleModuleAction(item.key, field, value))}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
