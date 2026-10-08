"use client";

import { useState, useTransition } from "react";
import {
  createPromotionAction,
  setPromotionActiveAction,
  deletePromotionAction,
  type PromotionActionResult,
} from "@/app/admin/configuracion/actions";
import type { Promotion } from "@/lib/promotions";

export function PromotionsPanel({ initialPromotions }: { initialPromotions: Promotion[] }) {
  const [promotions, setPromotions] = useState(initialPromotions);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function run(id: string, action: () => Promise<PromotionActionResult>) {
    setBusyId(id);
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (res.ok && res.promotions) setPromotions(res.promotions);
      else if (!res.ok) setError(res.error ?? "No se pudo completar la acción.");
      setBusyId(null);
    });
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.82rem] text-admin-ink-soft">
          {promotions.length} promoción{promotions.length === 1 ? "" : "es"}
        </p>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setNewTitle("");
            setNewDescription("");
          }}
          aria-label="Nueva promoción"
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
            const title = newTitle.trim();
            if (!title) return;
            setCreating(false);
            run("new", () => createPromotionAction(title, newDescription));
          }}
          className="mt-3 flex flex-col gap-2 rounded-xl border border-admin-border bg-admin-surface px-4 py-3"
        >
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Ej. 3 x 2 en vitaminas"
            className="rounded-lg border border-admin-border bg-admin-input-bg px-3 py-2 text-[0.85rem] text-admin-ink outline-none"
          />
          <input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Detalle (opcional)"
            className="rounded-lg border border-admin-border bg-admin-input-bg px-3 py-2 text-[0.85rem] text-admin-ink outline-none"
          />
          <div className="flex items-center gap-3">
            <button type="submit" className="text-[0.8rem] font-semibold text-admin-primary">
              Guardar
            </button>
            <button type="button" onClick={() => setCreating(false)} className="text-[0.8rem] text-admin-ink-soft">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="mt-3 flex flex-col divide-y divide-admin-border rounded-xl border border-admin-border bg-admin-surface">
        {promotions.length === 0 && <p className="px-4 py-6 text-center text-[0.85rem] text-admin-ink-soft">Sin promociones capturadas</p>}
        {promotions.map((promo) => {
          const busy = busyId === promo.id;
          return (
            <div key={promo.id} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-[0.88rem] font-semibold text-admin-ink">{promo.title}</span>
                  {promo.description && <p className="text-[0.8rem] text-admin-ink-soft">{promo.description}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(promo.id, () => setPromotionActiveAction(promo.id, !promo.active))}
                    className={`rounded-full px-3 py-1 text-[0.76rem] font-semibold disabled:opacity-40 ${
                      promo.active ? "bg-admin-ok-bg text-admin-ok-text" : "bg-admin-pending-bg text-admin-pending-text"
                    }`}
                  >
                    {promo.active ? "Activa" : "Inactiva"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setDeletingId(promo.id);
                      setError(null);
                    }}
                    className="text-[0.78rem] font-semibold text-admin-bad-text hover:underline disabled:opacity-40"
                  >
                    Borrar
                  </button>
                </div>
              </div>

              {deletingId === promo.id && (
                <div className="flex items-center justify-end gap-2 rounded-lg border border-admin-bad-text bg-admin-bad-bg px-3 py-2">
                  <span className="text-[0.78rem] text-admin-bad-text">¿Borrar &quot;{promo.title}&quot;?</span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setDeletingId(null);
                      run(promo.id, () => deletePromotionAction(promo.id));
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
      <p className="mt-2 text-[0.78rem] text-admin-ink-soft">
        Las promociones marcadas &quot;Activa&quot; se mandan por notificación push a quien checa su entrada ese día, para que las ofrezca en su turno.
      </p>
    </div>
  );
}
