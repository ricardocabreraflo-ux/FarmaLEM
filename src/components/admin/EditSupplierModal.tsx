"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateSupplierAction } from "@/app/admin/proveedores/actions";
import type { Supplier } from "@/lib/suppliers";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

export function EditSupplierModal({ supplier, onClose }: { supplier: Supplier; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(supplier.name);
  const [contact, setContact] = useState(supplier.contact ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateSupplierAction(supplier.id, name, contact);
      if (!res.ok) {
        setError(res.error ?? "No se pudo actualizar el proveedor.");
        return;
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[440px] rounded-2xl bg-admin-surface p-6 shadow-lg"
      >
        <h2 className="font-display text-lg text-admin-ink">Editar proveedor</h2>

        <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
          <label className="block text-[0.85rem] font-semibold text-admin-ink">
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </label>
          <label className="block text-[0.85rem] font-semibold text-admin-ink">
            Contacto
            <input value={contact} onChange={(e) => setContact(e.target.value)} className={inputClass} placeholder="Teléfono, correo o vendedor" />
          </label>

          {error && (
            <p role="alert" className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-full border border-admin-border px-5 py-2.5 text-[0.86rem] font-semibold text-admin-ink-soft">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-admin-primary px-6 py-2.5 text-[0.86rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
            >
              {pending ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
