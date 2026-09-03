"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { getModuleEditorStructureAction, saveRolePermissionsAction } from "@/app/admin/configuracion/actions";
import type { ModuleEditorEntry, ModuleEditorLeaf } from "@/lib/panel-modules";

function allLeaves(entries: ModuleEditorEntry[]): ModuleEditorLeaf[] {
  return entries.flatMap((entry) => (entry.type === "leaf" ? [entry] : entry.items));
}

function LeafRow({ leaf, checked, disabled, onToggle }: { leaf: ModuleEditorLeaf; checked: boolean; disabled: boolean; onToggle: (value: boolean) => void }) {
  return (
    <label className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-[0.85rem] ${leaf.enabled ? "text-admin-ink" : "text-admin-ink-soft"}`}>
      <span>{leaf.label}</span>
      {leaf.locked ? (
        <span className="text-[0.74rem] text-admin-ink-soft">{checked ? "Siempre visible" : "No aplica"}</span>
      ) : (
        <input type="checkbox" checked={checked} disabled={disabled || !leaf.enabled} onChange={(e) => onToggle(e.target.checked)} />
      )}
    </label>
  );
}

export function RolePermissionsModal({ roleId, roleName, onClose }: { roleId: string; roleName: string; onClose: () => void }) {
  const [entries, setEntries] = useState<ModuleEditorEntry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    getModuleEditorStructureAction().then((res) => {
      if (cancelled) return;
      if (res.ok && res.entries) {
        setEntries(res.entries);
        const initial = new Set(
          allLeaves(res.entries)
            .filter((leaf) => (leaf.locked ? !leaf.defaultAdminOnly : leaf.visibleRoleIds.includes(roleId)))
            .map((leaf) => leaf.key)
        );
        setCheckedKeys(initial);
      } else setLoadError(res.error ?? "No se pudo cargar el panel de navegación.");
    });
    return () => {
      cancelled = true;
    };
  }, [roleId]);

  const dirty = useMemo(() => {
    if (!entries) return false;
    const initial = new Set(
      allLeaves(entries)
        .filter((leaf) => (leaf.locked ? !leaf.defaultAdminOnly : leaf.visibleRoleIds.includes(roleId)))
        .map((leaf) => leaf.key)
    );
    if (initial.size !== checkedKeys.size) return true;
    for (const k of initial) if (!checkedKeys.has(k)) return true;
    return false;
  }, [entries, checkedKeys, roleId]);

  function toggle(key: string, value: boolean) {
    setSaved(false);
    setCheckedKeys((prev) => {
      const next = new Set(prev);
      if (value) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await saveRolePermissionsAction(roleId, roleName, [...checkedKeys]);
      if (res.ok) {
        if (res.entries) setEntries(res.entries);
        setSaved(true);
      } else {
        setError(res.error ?? "No se pudo guardar.");
      }
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
          <p className="text-[0.82rem] text-admin-ink-soft">
            Marca qué pantallas puede ver este rol y dale &ldquo;Guardar&rdquo;. Un módulo desactivado en Configuración no aparece aquí como opción.
          </p>

          {error && <p className="mt-3 rounded-lg bg-admin-bad-bg px-4 py-2 text-[0.82rem] text-admin-bad-text">{error}</p>}
          {loadError && <p className="mt-3 rounded-lg bg-admin-bad-bg px-4 py-2 text-[0.82rem] text-admin-bad-text">{loadError}</p>}

          {!entries && !loadError && <p className="mt-4 text-[0.85rem] text-admin-ink-soft">Cargando…</p>}

          {entries && (
            <div className="mt-3 flex flex-col gap-3">
              {entries.map((entry) => {
                if (entry.type === "leaf") {
                  return (
                    <div key={entry.key} className="rounded-xl border border-admin-border">
                      <LeafRow leaf={entry} checked={checkedKeys.has(entry.key)} disabled={pending} onToggle={(v) => toggle(entry.key, v)} />
                    </div>
                  );
                }
                return (
                  <div key={entry.key} className="rounded-xl border border-admin-border">
                    <div className="border-b border-admin-border bg-admin-primary-soft px-3 py-2 text-[0.8rem] font-bold text-admin-primary-deep">{entry.label}</div>
                    <div className="flex flex-col divide-y divide-admin-border">
                      {entry.items.map((item) => (
                        <LeafRow key={item.key} leaf={item} checked={checkedKeys.has(item.key)} disabled={pending} onToggle={(v) => toggle(item.key, v)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {entries && (
          <div className="flex items-center justify-between gap-3 border-t border-admin-border px-5 py-4">
            <span className="text-[0.8rem] font-semibold text-admin-ok-text">{saved && !dirty ? "✓ Guardado" : ""}</span>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink-soft">
                Cerrar
              </button>
              <button
                type="button"
                disabled={pending || !dirty}
                onClick={handleSave}
                className="rounded-full bg-admin-primary px-6 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
              >
                {pending ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
