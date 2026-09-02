"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createStockExitForm, type StockExitFormState } from "@/app/admin/inventario/actions";
import { mexicoCityToday } from "@/lib/dates";
import type { InventoryRow } from "@/lib/inventory";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

export function StockExitForm({ products }: { products: InventoryRow[] }) {
  const [state, formAction, pending] = useActionState<StockExitFormState | undefined, FormData>(createStockExitForm, undefined);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Fecha
          <input name="exitDate" type="date" required defaultValue={mexicoCityToday()} className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Producto
          <select name="barcode" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Selecciona un producto
            </option>
            {products.map((p) => (
              <option key={p.barcode} value={p.barcode}>
                {p.description} · disponibles: {p.available}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink">
          Piezas vendidas / salieron
          <input name="quantity" type="number" min="1" step="1" required className={inputClass} />
        </label>

        <label className="block text-[0.85rem] font-semibold text-admin-ink sm:col-span-2">
          Nota (opcional)
          <input name="note" placeholder="Ej. Venta mostrador, merma, ajuste de conteo" className={inputClass} />
        </label>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Link href="/admin/inventario" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.86rem] font-semibold text-admin-ink-soft">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-admin-primary px-6 py-2.5 text-[0.86rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar salida"}
        </button>
      </div>
    </form>
  );
}
