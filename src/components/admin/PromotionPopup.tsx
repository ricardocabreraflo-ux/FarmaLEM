"use client";

import { useEffect, useState } from "react";

interface PopupPromotion {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
}

const POLL_MS = 60 * 60 * 1000; // cada hora

/**
 * Popup que se abre solo, encima de cualquier pantalla del panel, con las
 * promociones marcadas "Anunciar también con un popup cada hora" — para que
 * no se les olvide ofrecerlas aunque no hayan visto el push de la mañana ni
 * entrado a Inicio. Solo para el equipo (no administración, que ya las ve y
 * las administra en Configuración).
 */
export function PromotionPopup({ userRole }: { userRole: string }) {
  const [promotions, setPromotions] = useState<PopupPromotion[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (userRole !== "employee") return;

    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/promotions/popup");
        const data = await res.json();
        if (!cancelled) {
          setPromotions(data.promotions ?? []);
          setDismissed(false);
        }
      } catch {
        // sin red por un momento: no pasa nada, se vuelve a intentar en el siguiente chequeo
      }
    }

    check();
    const interval = setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userRole]);

  if (promotions.length === 0 || dismissed) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="max-h-[85vh] w-full max-w-[380px] overflow-y-auto rounded-2xl bg-admin-surface p-6 text-center shadow-xl">
        <span className="text-3xl">🏷️</span>
        <h2 className="mt-2 font-display text-lg text-admin-ink">Recuerda ofrecer</h2>
        <div className="mt-4 flex flex-col gap-3 text-left">
          {promotions.map((promo) => (
            <div key={promo.id} className="overflow-hidden rounded-xl border border-admin-border">
              {promo.imageUrl && <img src={promo.imageUrl} alt={promo.title} className="aspect-square w-full object-cover" />}
              <div className="p-3">
                <p className="text-[0.88rem] font-semibold text-admin-ink">{promo.title}</p>
                {promo.description && <p className="mt-0.5 text-[0.8rem] text-admin-ink-soft">{promo.description}</p>}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="mt-4 rounded-full bg-admin-primary px-5 py-2 text-[0.85rem] font-semibold text-white"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
