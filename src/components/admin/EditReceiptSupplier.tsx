"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateReceiptSupplierAction, createSupplierAction } from "@/app/admin/compras/actions";
import type { Supplier } from "@/lib/suppliers";

const NEW_SUPPLIER = "__nuevo__";

const inputClass =
  "rounded-lg border border-admin-border bg-admin-input-bg px-3 py-1.5 text-[0.82rem] text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary";

export function EditReceiptSupplier({ receiptId, supplierId, suppliers }: { receiptId: string; supplierId: string; suppliers: Supplier[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(supplierId);
  const [newName, setNewName] = useState("");
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
    if (value === NEW_SUPPLIER && !newName.trim()) {
      setError("Escribe el nombre del proveedor nuevo.");
      return;
    }
    startTransition(async () => {
      let targetId = value;
      if (value === NEW_SUPPLIER) {
        const created = await createSupplierAction(newName);
        if (!created.ok || !created.id) {
          setError(created.error ?? "No se pudo crear el proveedor.");
          return;
        }
        targetId = created.id;
      }
      const res = await updateReceiptSupplierAction(receiptId, targetId);
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
      <select value={value} onChange={(e) => setValue(e.target.value)} className={inputClass}>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
        <option value={NEW_SUPPLIER}>+ Nuevo proveedor…</option>
      </select>
      {value === NEW_SUPPLIER && (
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre del proveedor nuevo" className={inputClass} />
      )}
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
