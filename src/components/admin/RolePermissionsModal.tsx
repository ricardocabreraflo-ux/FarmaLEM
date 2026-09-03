"use client";

import { useEffect, useState, useTransition } from "react";
import { getModuleEditorStructureAction, toggleModuleRoleAction, type ModuleActionResult } from "@/app/admin/configuracion/actions";
import type { ModuleEditorEntry, ModuleEditorLeaf } from "@/lib/panel-modules";

function LeafRow({ leaf, roleId, busy, onToggle }: { leaf: ModuleEditorLeaf; roleId: string; busy: boolean; onToggle: (value: boolean) => void }) {
  const visible = leaf.locked ? !leaf.defaultAdminOnly : leaf.visibleRoleIds.includes(roleId);
  return (
    <label className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-[0.85rem] ${leaf.enabled ? "text-admin-ink" : "text-admin-ink-soft"}`}>
      <span>{leaf.label}</span>
      {leaf.locked ? (
        <span className="text-[0.74rem] text-admin-ink-soft">{visible ? "Siempre visible" : "No aplica"}</span>
      ) : (
        <input type="checkbox" checked={visible} disabled={busy || !leaf.enabled} onChange={(e) => onToggle(e.target.checked)} />
      )}
    </label>
  );
}

export function RolePermissionsModal({ roleId, roleName, onClose }: { roleId: string; roleName: string; onClose: () => void }) {
  const [entries, setEntries] = useState<ModuleEditorEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    getModuleEditorStructureAction().then((res) => {
      if (cancelled) return;
      if (res.ok && res.entries) setEntries(res.entries);
      else setLoadError(res.error ?? "No se pudo cargar el panel de navegación.");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(leaf: ModuleEditorLeaf, value: boolean) {
    setBusyKey(leaf.key);
    setError(null);
    startTransition(async () => {
      const res: ModuleActionResult = await toggleModuleRoleAction(leaf.key, leaf.visibleRoleIds, roleId, value);
      if (res.ok && res.entries) setEntries(res.entries);
      else if (!res.ok) setError(res.error ?? "No se pudo actualizar.");
      setBusyKey(null);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Permisos de ${roleName}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl bg-admin-surface shadow-lg"
      >
        <div className="flex items-center justify-between border-b border-admin-border px-5 py-4">
          <h2 className="font-display text-lg text-admin-ink">Permisos de {roleName}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid h-8 w-8 place-items-center rounded-lg text-admin-ink-soft hover:bg-admin-bg">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          <p className="text-[0.82rem] text-admin-ink-soft">Marca qué pantallas puede ver este rol. Un módulo desactivado en Configuración no aparece aquí como opción.</p>

          {error && <p className="mt-3 rounded-lg bg-admin-bad-bg px-4 py-2 text-[0.82rem] text-admin-bad-text">{error}</p>}
          {loadError && <p className="mt-3 rounded-lg bg-admin-bad-bg px-4 py-2 text-[0.82rem] text-admin-bad-text">{loadError}</p>}

          {!entries && !loadError && <p className="mt-4 text-[0.85rem] text-admin-ink-soft">Cargando…</p>}

          {entries && (
            <div className="mt-3 flex flex-col gap-3">
              {entries.map((entry) => {
                if (entry.type === "leaf") {
                  return (
                    <div key={entry.key} className="rounded-xl border border-admin-border">
                      <LeafRow leaf={entry} roleId={roleId} busy={busyKey === entry.key} onToggle={(v) => toggle(entry, v)} />
                    </div>
                  );
                }
                return (
                  <div key={entry.key} className="rounded-xl border border-admin-border">
                    <div className="border-b border-admin-border bg-admin-primary-soft px-3 py-2 text-[0.8rem] font-bold text-admin-primary-deep">{entry.label}</div>
                    <div className="flex flex-col divide-y divide-admin-border">
                      {entry.items.map((item) => (
                        <LeafRow key={item.key} leaf={item} roleId={roleId} busy={busyKey === item.key} onToggle={(v) => toggle(item, v)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
