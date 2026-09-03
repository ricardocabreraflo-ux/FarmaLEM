"use client";

import { useState, useTransition } from "react";
import {
  createRoleAction,
  duplicateRoleAction,
  deleteRoleAction,
  renameRoleAction,
  type RoleActionResult,
} from "@/app/admin/configuracion/actions";
import type { Role } from "@/lib/roles";
import { RolePermissionsModal } from "@/components/admin/RolePermissionsModal";

const iconBase = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function IconKey() {
  return (
    <svg {...iconBase} className="h-4 w-4">
      <circle cx="8" cy="15" r="3.5" />
      <path d="M10.5 12.5 19 4" />
      <path d="M15.5 8 18 10.5" />
      <path d="M18 5.5 20.5 8" />
    </svg>
  );
}

function IconDuplicate() {
  return (
    <svg {...iconBase} className="h-4 w-4">
      <rect x="8" y="8" width="12" height="12" rx="1.5" />
      <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4H5.5A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg {...iconBase} className="h-4 w-4">
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
      <path d="M13.5 8 16 10.5" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg {...iconBase} className="h-4 w-4">
      <path d="M5 7h14" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M7 7l1 12.5A1.5 1.5 0 0 0 9.5 21h5a1.5 1.5 0 0 0 1.5-1.5L17 7" />
    </svg>
  );
}

export function RolesPanel({ initialRoles, pinConfigured }: { initialRoles: Role[]; pinConfigured: boolean }) {
  const [roles, setRoles] = useState(initialRoles);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletePin, setDeletePin] = useState("");
  const [permissionsRole, setPermissionsRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function run(id: string, action: () => Promise<RoleActionResult>) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok && res.roles) setRoles(res.roles);
      else if (!res.ok) setError(res.error ?? "No se pudo completar la acción.");
      setBusyId(null);
    });
  }

  function confirmDelete(role: Role) {
    setBusyId(role.id);
    setError(null);
    startTransition(async () => {
      const res = await deleteRoleAction(role.id, deletePin);
      if (res.ok && res.roles) {
        setRoles(res.roles);
        setDeletingId(null);
        setDeletePin("");
      } else if (!res.ok) {
        setError(res.error ?? "No se pudo eliminar el rol.");
      }
      setBusyId(null);
    });
  }

  const filtered = roles.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <input
          type="search"
          placeholder="Buscar"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-full border border-admin-border bg-admin-input-bg px-4 py-2.5 text-[0.85rem] text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
        />
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setNewName("");
          }}
          aria-label="Nuevo rol"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-admin-primary text-lg font-bold text-white"
        >
          +
        </button>
      </div>

      {error && <p className="mt-3 rounded-lg bg-admin-bad-bg px-4 py-2 text-[0.82rem] text-admin-bad-text">{error}</p>}

      {creating && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const name = newName.trim();
            if (!name) return;
            setCreating(false);
            run("new", () => createRoleAction(name));
          }}
          className="mt-3 flex items-center gap-2 rounded-xl border border-admin-border bg-admin-surface px-4 py-2.5"
        >
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre del rol"
            className="flex-1 bg-transparent text-[0.85rem] text-admin-ink outline-none"
          />
          <button type="submit" className="text-[0.8rem] font-semibold text-admin-primary">
            Guardar
          </button>
          <button type="button" onClick={() => setCreating(false)} className="text-[0.8rem] text-admin-ink-soft">
            Cancelar
          </button>
        </form>
      )}

      <div className="mt-3 flex flex-col divide-y divide-admin-border rounded-xl border border-admin-border bg-admin-surface">
        {filtered.length === 0 && <p className="px-4 py-6 text-center text-[0.85rem] text-admin-ink-soft">Sin roles</p>}
        {filtered.map((role) => {
          const busy = busyId === role.id;
          return (
            <div key={role.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
              {editingId === role.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const name = editingName.trim();
                    if (!name) return;
                    setEditingId(null);
                    run(role.id, () => renameRoleAction(role.id, name));
                  }}
                  className="flex flex-1 items-center gap-2"
                >
                  <input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 rounded-lg border border-admin-border bg-admin-input-bg px-3 py-1.5 text-[0.85rem] text-admin-ink outline-none"
                  />
                  <button type="submit" className="text-[0.8rem] font-semibold text-admin-primary">
                    Guardar
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="text-[0.8rem] text-admin-ink-soft">
                    Cancelar
                  </button>
                </form>
              ) : (
                <>
                  <span className="text-[0.88rem] font-semibold text-admin-ink">{role.name}</span>
                  <div className="flex items-center gap-3 text-admin-ink-soft">
                    <button
                      type="button"
                      title="Permisos"
                      aria-label={`Permisos de ${role.name}`}
                      onClick={() => setPermissionsRole(role)}
                      className="flex items-center gap-1 hover:text-admin-primary"
                    >
                      <IconKey />
                      <span className="text-[0.78rem] font-semibold">Permisos</span>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      title="Duplicar"
                      aria-label={`Duplicar ${role.name}`}
                      onClick={() => run(role.id, () => duplicateRoleAction(role.id))}
                      className="hover:text-admin-primary disabled:opacity-40"
                    >
                      <IconDuplicate />
                    </button>
                    {!role.locked && (
                      <button
                        type="button"
                        title="Renombrar"
                        aria-label={`Renombrar ${role.name}`}
                        onClick={() => {
                          setEditingId(role.id);
                          setEditingName(role.name);
                        }}
                        className="hover:text-admin-primary"
                      >
                        <IconEdit />
                      </button>
                    )}
                    {!role.locked && (
                      <button
                        type="button"
                        disabled={busy}
                        title="Eliminar"
                        aria-label={`Eliminar ${role.name}`}
                        onClick={() => {
                          setDeletingId(role.id);
                          setDeletePin("");
                          setError(null);
                        }}
                        className="text-admin-bad-text hover:opacity-70 disabled:opacity-40"
                      >
                        <IconTrash />
                      </button>
                    )}
                  </div>
                </>
              )}
              </div>

              {deletingId === role.id && (
                <div className="rounded-lg border border-admin-bad-text bg-admin-bad-bg p-3">
                  <p className="text-[0.8rem] font-semibold text-admin-bad-text">Vas a eliminar el rol &quot;{role.name}&quot; de forma permanente.</p>
                  {!pinConfigured ? (
                    <p className="mt-2 text-[0.78rem] text-admin-bad-text">Primero configura el PIN de eliminación en Configuración.</p>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        confirmDelete(role);
                      }}
                      className="mt-2 flex flex-wrap items-end gap-2"
                    >
                      <label className="text-[0.8rem] font-semibold text-admin-bad-text">
                        PIN
                        <input
                          autoFocus
                          type="password"
                          inputMode="numeric"
                          value={deletePin}
                          onChange={(e) => setDeletePin(e.target.value)}
                          className="mt-1 block w-28 rounded-lg border border-admin-bad-text bg-admin-surface px-3 py-1.5 text-admin-ink outline-none"
                        />
                      </label>
                      <button
                        type="submit"
                        disabled={busy || !deletePin}
                        className="rounded-full bg-admin-bad-text px-4 py-2 text-[0.8rem] font-semibold text-white disabled:opacity-60"
                      >
                        {busy ? "Eliminando…" : "Confirmar eliminación"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingId(null);
                          setDeletePin("");
                        }}
                        className="rounded-full border border-admin-border px-4 py-2 text-[0.8rem] font-semibold text-admin-ink-soft"
                      >
                        Cancelar
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[0.78rem] text-admin-ink-soft">
        Administrador y Vendedor son los roles base y no se pueden renombrar ni borrar. Dale &ldquo;Permisos&rdquo; a cualquier rol para elegir qué
        pantallas ve.
      </p>

      {permissionsRole && (
        <RolePermissionsModal roleId={permissionsRole.id} roleName={permissionsRole.name} onClose={() => setPermissionsRole(null)} />
      )}
    </div>
  );
}
