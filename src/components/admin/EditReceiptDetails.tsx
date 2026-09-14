"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateReceiptDetailsAction } from "@/app/admin/compras/actions";

const inputClass =
  "rounded-lg border border-admin-border bg-admin-input-bg px-3 py-1.5 text-[0.82rem] text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary";

export function EditReceiptDetails({ receiptId, ticketNumber, ticketDate }: { receiptId: string; ticketNumber: string | null; ticketDate: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [number, setNumber] = useState(ticketNumber ?? "");
  const [date, setDate] = useState(ticketDate);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="text-[0.78rem] font-semibold text-admin-primary hover:underline">
        Editar ticket y fecha
      </button>
    );
  }

  function onSave() {
    setError(null);
    if (!date) {
      setError("Falta la fecha.");
      return;
    }
    startTransition(async () => {
      const res = await updateReceiptDetailsAction(receiptId, number, date);
      if (!res.ok) {
        setError(res.error ?? "No se pudo guardar.");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="No. de ticket / factura" className={inputClass} />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
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
