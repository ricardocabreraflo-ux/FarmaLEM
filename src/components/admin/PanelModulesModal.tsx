"use client";

import { useState } from "react";
import { PanelModulesEditor } from "@/components/admin/PanelModulesEditor";
import type { ModuleEditorEntry } from "@/lib/panel-modules";

export function PanelModulesModal({ initialEntries }: { initialEntries: ModuleEditorEntry[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
      >
        Editar panel de navegación
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Panel de navegación"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-admin-surface shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-admin-border px-5 py-4">
              <h2 className="font-display text-lg text-admin-ink">Panel de navegación</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="grid h-8 w-8 place-items-center rounded-lg text-admin-ink-soft hover:bg-admin-bg"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4">
              <p className="text-[0.84rem] text-admin-ink-soft">
                Activa o desactiva cada pantalla, decide cuáles ve el vendedor además del administrador, y cambia el orden con las flechas. Inicio y
                Configuración siempre están activos para no quedarte sin acceso al panel.
              </p>
              <PanelModulesEditor initialEntries={initialEntries} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
