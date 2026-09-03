"use client";

import { useState, useTransition } from "react";
import { moveModuleAction, toggleModuleAction, toggleModuleRoleAction, type ModuleActionResult } from "@/app/admin/configuracion/actions";
import type { ModuleEditorEntry, ModuleEditorLeaf } from "@/lib/panel-modules";
import type { Role } from "@/lib/roles";

function LeafRow({
  leaf,
  roles,
  indent,
  canMoveUp,
  canMoveDown,
  busy,
  onMove,
  onToggleEnabled,
  onToggleRole,
}: {
  leaf: ModuleEditorLeaf;
  roles: Role[];
  indent: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  busy: boolean;
  onMove: (dir: "up" | "down") => void;
  onToggleEnabled: (value: boolean) => void;
  onToggleRole: (roleId: string, value: boolean) => void;
}) {
  return (
    <div className={`rounded-xl border border-admin-border bg-admin-surface px-4 py-3 ${indent ? "ml-6" : ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
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
          <label className="flex items-center gap-1.5 text-[0.82rem] text-admin-ink-soft">
            <input type="checkbox" checked={leaf.enabled} disabled={busy} onChange={(e) => onToggleEnabled(e.target.checked)} />
            Activo
          </label>
        )}
      </div>
      {!leaf.locked && (
        <div className="mt-2.5 flex flex-wrap items-center gap-4 border-t border-admin-border pt-2.5 text-[0.8rem] text-admin-ink-soft">
          <span className="text-[0.76rem] font-semibold uppercase tracking-wide text-admin-ink-soft">Lo ven:</span>
          {roles.map((role) => (
            <label key={role.id} className="flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={leaf.visibleRoleIds.includes(role.id)}
                disabled={busy || !leaf.enabled}
                onChange={(e) => onToggleRole(role.id, e.target.checked)}
              />
              {role.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function PanelModulesEditor({ initialEntries, initialRoles }: { initialEntries: ModuleEditorEntry[]; initialRoles: Role[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [roles, setRoles] = useState(initialRoles);
  const [, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(key: string, action: () => Promise<ModuleActionResult>) {
    setBusyKey(key);
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok && res.entries) {
        setEntries(res.entries);
        if (res.roles) setRoles(res.roles);
      } else if (!res.ok) {
        setError(res.error ?? "No se pudo actualizar.");
      }
      setBusyKey(null);
    });
  }

  function leafRowProps(leaf: ModuleEditorLeaf, canMoveUp: boolean, canMoveDown: boolean, indent: boolean) {
    return {
      leaf,
      roles,
      indent,
      canMoveUp,
      canMoveDown,
      busy: busyKey === leaf.key,
      onMove: (dir: "up" | "down") => run(leaf.key, () => moveModuleAction(leaf.key, dir)),
      onToggleEnabled: (value: boolean) => run(leaf.key, () => toggleModuleAction(leaf.key, value)),
      onToggleRole: (roleId: string, value: boolean) => run(leaf.key, () => toggleModuleRoleAction(leaf.key, leaf.visibleRoleIds, roleId, value)),
    };
  }

  return (
    <div className="mt-4 flex flex-col gap-3">
      {error && <p className="rounded-lg bg-admin-bad-bg px-4 py-2 text-[0.82rem] text-admin-bad-text">{error}</p>}
      {entries.map((entry, i) => {
        const canMoveUp = i > 0;
        const canMoveDown = i < entries.length - 1;

        if (entry.type === "leaf") {
          return <LeafRow key={entry.key} {...leafRowProps(entry, canMoveUp, canMoveDown, false)} />;
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
                  onChange={(e) => run(entry.key, () => toggleModuleAction(entry.key, e.target.checked))}
                />
                Grupo activo
              </label>
            </div>
            <div className="flex flex-col gap-2">
              {entry.items.map((item, j) => (
                <LeafRow key={item.key} {...leafRowProps(item, j > 0, j < entry.items.length - 1, true)} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
