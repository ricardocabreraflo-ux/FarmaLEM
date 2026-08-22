"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createPurchaseForm, type PurchaseFormState } from "@/app/admin/compras/actions";
import type { Supplier } from "@/lib/suppliers";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

export function PurchaseForm({ suppliers }: { suppliers: Supplier[] }) {
  const [state, formAction, pending] = useActionState<PurchaseFormState | undefined, FormData>(createPurchaseForm, undefined);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Fecha
          <input name="purchaseDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Proveedor
          <select name="supplierId" defaultValue="" className={inputClass}>
            <option value="">Sin seleccionar</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Clave corta
          <input name="shortCode" className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Código de barras
          <input name="barcode" required className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink sm:col-span-2">
          Descripción del producto
          <input name="description" required className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Piezas
          <input name="quantity" type="number" min="1" step="1" required className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Costo unitario
          <input name="cost" type="number" min="0" step="0.01" required className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Precio de venta
          <input name="price" type="number" min="0" step="0.01" required className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Factura (opcional)
          <input name="invoice" className={inputClass} />
        </label>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Link href="/admin/compras" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.86rem] font-semibold text-admin-ink-soft">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-admin-primary px-6 py-2.5 text-[0.86rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar producto"}
        </button>
      </div>
    </form>
  );
}
