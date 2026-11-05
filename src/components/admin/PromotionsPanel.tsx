"use client";

import { useRef, useState, useTransition } from "react";
import {
  createPromotionAction,
  updatePromotionAction,
  setPromotionActiveAction,
  setPromotionImageAction,
  deletePromotionAction,
  type PromotionActionResult,
} from "@/app/admin/configuracion/actions";
import type { PromotionWithImage } from "@/lib/promotions";

function fmtDate(v: string) {
  return new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function isPast(v: string) {
  return v < new Date().toISOString().slice(0, 10);
}

interface FormValue {
  title: string;
  description: string;
  validUntil: string;
  recurringPopup: boolean;
}

function PromotionForm({
  initial,
  showImageField,
  pending,
  onCancel,
  onSubmit,
}: {
  initial: FormValue;
  showImageField: boolean;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (v: FormValue, image: File | null) => void;
}) {
  const [value, setValue] = useState(initial);
  const [image, setImage] = useState<File | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!value.title.trim()) return;
        onSubmit(value, image);
      }}
      className="mt-3 flex flex-col gap-2 rounded-xl border border-admin-border bg-admin-surface px-4 py-3"
    >
      <input
        autoFocus
        value={value.title}
        onChange={(e) => setValue((v) => ({ ...v, title: e.target.value }))}
        placeholder="Ej. 3 x 2 en vitaminas"
        className="rounded-lg border border-admin-border bg-admin-input-bg px-3 py-2 text-[0.85rem] text-admin-ink outline-none"
      />
      <input
        value={value.description}
        onChange={(e) => setValue((v) => ({ ...v, description: e.target.value }))}
        placeholder="Detalle (opcional)"
        className="rounded-lg border border-admin-border bg-admin-input-bg px-3 py-2 text-[0.85rem] text-admin-ink outline-none"
      />
      <label className="flex items-center gap-2 text-[0.8rem] text-admin-ink-soft">
        Vigente hasta (opcional)
        <input
          type="date"
          value={value.validUntil}
          onChange={(e) => setValue((v) => ({ ...v, validUntil: e.target.value }))}
          className="rounded-lg border border-admin-border bg-admin-input-bg px-3 py-1.5 text-[0.85rem] text-admin-ink outline-none"
        />
        {value.validUntil && (
          <button type="button" onClick={() => setValue((v) => ({ ...v, validUntil: "" }))} className="text-admin-primary hover:underline">
            Quitar
          </button>
        )}
      </label>
      {showImageField && (
        <label className="flex items-center gap-2 text-[0.8rem] text-admin-ink-soft">
          Imagen del producto (opcional)
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} className="text-[0.78rem] text-admin-ink-soft" />
        </label>
      )}
      <label className="flex items-center gap-2 text-[0.8rem] text-admin-ink-soft">
        <input
          type="checkbox"
          checked={value.recurringPopup}
          onChange={(e) => setValue((v) => ({ ...v, recurringPopup: e.target.checked }))}
          className="h-4 w-4 accent-admin-primary"
        />
        Anunciarla también con un popup cada hora (además del push al checar entrada)
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="text-[0.8rem] font-semibold text-admin-primary disabled:opacity-60">
          {pending ? "Guardando…" : "Guardar"}
        </button>
        <button type="button" onClick={onCancel} className="text-[0.8rem] text-admin-ink-soft">
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function PromotionsPanel({ initialPromotions }: { initialPromotions: PromotionWithImage[] }) {
  const [promotions, setPromotions] = useState(initialPromotions);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
            setEditingId(null);
          }}
          aria-label="Nueva promoción"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-admin-primary text-lg font-bold text-white"
        >
          +
        </button>
      </div>

      {error && <p className="mt-3 rounded-lg bg-admin-bad-bg px-4 py-2 text-[0.82rem] text-admin-bad-text">{error}</p>}

      {creating && (
        <PromotionForm
          initial={{ title: "", description: "", validUntil: "", recurringPopup: false }}
          showImageField
          pending={busyId === "new"}
          onCancel={() => setCreating(false)}
          onSubmit={(v, image) => {
            setCreating(false);
            run("new", () => createPromotionAction(v.title.trim(), v.description, image, v.validUntil, v.recurringPopup));
          }}
        />
      )}

      <div className="mt-3 flex flex-col divide-y divide-admin-border rounded-xl border border-admin-border bg-admin-surface">
        {promotions.length === 0 && <p className="px-4 py-6 text-center text-[0.85rem] text-admin-ink-soft">Sin promociones capturadas</p>}
        {promotions.map((promo) => {
          const busy = busyId === promo.id;
          return (
            <div key={promo.id} className="flex flex-col gap-2 px-4 py-3">
              {editingId === promo.id ? (
                <PromotionForm
                  initial={{
                    title: promo.title,
                    description: promo.description ?? "",
                    validUntil: promo.valid_until ?? "",
                    recurringPopup: promo.recurring_popup,
                  }}
                  showImageField={false}
                  pending={busy}
                  onCancel={() => setEditingId(null)}
                  onSubmit={(v) => {
                    setEditingId(null);
                    run(promo.id, () => updatePromotionAction(promo.id, v.title.trim(), v.description, v.validUntil, v.recurringPopup));
                  }}
                />
              ) : (
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[0.88rem] font-semibold text-admin-ink">{promo.title}</span>
                        {promo.recurring_popup && (
                          <span className="rounded-full bg-admin-primary-soft px-2 py-0.5 text-[0.7rem] font-semibold text-admin-primary-deep">
                            📢 Popup cada hora
                          </span>
                        )}
                      </div>
                      {promo.description && <p className="text-[0.8rem] text-admin-ink-soft">{promo.description}</p>}
                      {promo.valid_until && (
                        <p className={`text-[0.76rem] font-semibold ${isPast(promo.valid_until) ? "text-admin-bad-text" : "text-admin-ink-soft"}`}>
                          {isPast(promo.valid_until) ? "Venció el" : "Vigente hasta"} {fmtDate(promo.valid_until)}
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => {
                            setEditingId(promo.id);
                            setCreating(false);
                          }}
                          className="text-[0.76rem] font-semibold text-admin-primary hover:underline disabled:opacity-40"
                        >
                          Editar
                        </button>
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
              )}

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
