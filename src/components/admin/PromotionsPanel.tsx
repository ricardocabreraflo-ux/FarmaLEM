"use client";

import { useRef, useState, useTransition } from "react";
import {
  createPromotionAction,
  setPromotionActiveAction,
  setPromotionImageAction,
  deletePromotionAction,
  type PromotionActionResult,
} from "@/app/admin/configuracion/actions";
import type { PromotionWithImage } from "@/lib/promotions";

export function PromotionsPanel({ initialPromotions }: { initialPromotions: PromotionWithImage[] }) {
  const [promotions, setPromotions] = useState(initialPromotions);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
            setNewImage(null);
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
            const image = newImage;
            setCreating(false);
            run("new", () => createPromotionAction(title, newDescription, image));
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
          <label className="flex items-center gap-2 text-[0.8rem] text-admin-ink-soft">
            Imagen del producto (opcional)
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImage(e.target.files?.[0] ?? null)}
              className="text-[0.78rem] text-admin-ink-soft"
            />
          </label>
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
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {promo.imageUrl ? (
                    <img src={promo.imageUrl} alt={promo.title} className="h-14 w-14 shrink-0 rounded-lg border border-admin-border object-cover" />
                  ) : (
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg border border-dashed border-admin-border text-[0.7rem] text-admin-ink-soft">
                      Sin foto
                    </div>
                  )}
                  <div>
                    <span className="text-[0.88rem] font-semibold text-admin-ink">{promo.title}</span>
                    {promo.description && <p className="text-[0.8rem] text-admin-ink-soft">{promo.description}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      {promo.downloadUrl && (
                        <a href={promo.downloadUrl} className="text-[0.76rem] font-semibold text-admin-primary hover:underline">
                          Descargar para imprimir
                        </a>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => fileInputRefs.current[promo.id]?.click()}
                        className="text-[0.76rem] font-semibold text-admin-primary hover:underline disabled:opacity-40"
                      >
                        {promo.imageUrl ? "Cambiar imagen" : "Agregar imagen"}
                      </button>
                      <input
                        ref={(el) => {
                          fileInputRefs.current[promo.id] = el;
                        }}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (file) run(promo.id, () => setPromotionImageAction(promo.id, file));
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(promo.id, () => setPromotionActiveAction(promo.id, !promo.active))}
                    className={`rounded-full px-3 py-1 text-[0.76rem] font-semibold whitespace-nowrap disabled:opacity-40 ${
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
        Las promociones marcadas &quot;Activa&quot; se mandan por notificación push a quien checa su entrada ese día, y se ven con su imagen en
        Inicio, para que las ofrezca en su turno o la descarguen para imprimirla.
      </p>
    </div>
  );
}
