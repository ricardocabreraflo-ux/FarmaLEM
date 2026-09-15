"use client";

import { useState, useTransition } from "react";
import {
  createStockoutCategoryAction,
  renameStockoutCategoryAction,
  deleteStockoutCategoryAction,
  type StockoutCategoryActionResult,
} from "@/app/admin/configuracion/actions";
import type { StockoutCategory } from "@/lib/stockout-categories";

export function StockoutCategoriesPanel({ initialCategories }: { initialCategories: StockoutCategory[] }) {
  const [categories, setCategories] = useState(initialCategories);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function run(id: string, action: () => Promise<StockoutCategoryActionResult>) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok && res.categories) setCategories(res.categories);
      else if (!res.ok) setError(res.error ?? "No se pudo completar la acción.");
      setBusyId(null);
    });
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.82rem] text-admin-ink-soft">{categories.length} categoría{categories.length === 1 ? "" : "s"}</p>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setNewName("");
          }}
          aria-label="Nueva categoría"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-admin-primary text-lg font-bold text-white"
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
            run("new", () => createStockoutCategoryAction(name));
          }}
          className="mt-3 flex items-center gap-2 rounded-xl border border-admin-border bg-admin-surface px-4 py-2.5"
        >
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nombre de la categoría"
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
        {categories.length === 0 && <p className="px-4 py-6 text-center text-[0.85rem] text-admin-ink-soft">Sin categorías</p>}
        {categories.map((cat) => {
          const busy = busyId === cat.id;
          return (
            <div key={cat.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                {editingId === cat.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const name = editingName.trim();
                      if (!name) return;
                      setEditingId(null);
                      run(cat.id, () => renameStockoutCategoryAction(cat.id, name));
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
                    <span className="text-[0.88rem] font-semibold text-admin-ink">{cat.name}</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(cat.id);
                          setEditingName(cat.name);
                        }}
                        className="text-[0.78rem] font-semibold text-admin-primary hover:underline"
                      >
                        Renombrar
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setDeletingId(cat.id);
                          setError(null);
                        }}
                        className="text-[0.78rem] font-semibold text-admin-bad-text hover:underline disabled:opacity-40"
                      >
                        Borrar
                      </button>
                    </div>
                  </>
                )}
              </div>

              {deletingId === cat.id && (
                <div className="flex items-center justify-end gap-2 rounded-lg border border-admin-bad-text bg-admin-bad-bg px-3 py-2">
                  <span className="text-[0.78rem] text-admin-bad-text">¿Borrar &quot;{cat.name}&quot;?</span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setDeletingId(null);
                      run(cat.id, () => deleteStockoutCategoryAction(cat.id));
                    }}
                    className="text-[0.8rem] font-semibold text-admin-bad-text hover:underline disabled:opacity-60"
                  >
                    Sí, borrar
                  </button>
                  <button type="button" onClick={() => setDeletingId(null)} className="text-[0.8rem] text-admin-ink-soft hover:underline">
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[0.78rem] text-admin-ink-soft">Aparecen como opciones al capturar un negado o faltante. Borrar una no afecta los registros ya guardados con ese nombre.</p>
    </div>
  );
}
