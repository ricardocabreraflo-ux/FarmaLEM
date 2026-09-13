"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateReceiptSupplierAction } from "@/app/admin/compras/actions";
import type { Supplier } from "@/lib/suppliers";

export function EditReceiptSupplier({ receiptId, supplierId, suppliers }: { receiptId: string; supplierId: string; suppliers: Supplier[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(supplierId);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="text-[0.78rem] font-semibold text-admin-primary hover:underline">
        Cambiar proveedor
      </button>
    );
  }

  function onSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateReceiptSupplierAction(receiptId, value);
      if (!res.ok) {
        setError(res.error ?? "No se pudo cambiar el proveedor.");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-lg border border-admin-border bg-admin-input-bg px-3 py-1.5 text-[0.82rem] text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
      >
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={pending}
        onClick={onSave}
        className="rounded-full bg-admin-primary px-4 py-1.5 text-[0.78rem] font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-[0.78rem] font-semibold text-admin-ink-soft">
        Cancelar
      </button>
      {error && <p className="w-full text-[0.72rem] text-admin-bad-text">{error}</p>}
    </div>
  );
}
