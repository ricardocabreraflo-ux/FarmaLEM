"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteReceiptAction } from "@/app/admin/compras/actions";

export function DeleteReceiptButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onClick() {
    const ok = window.confirm("¿Borrar esta recepción? Se quitan sus piezas de Inventario y sus fotos. Esto no se puede deshacer.");
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteReceiptAction(id);
      if (res.ok) router.push("/admin/compras");
      else setError(res.error ?? "No se pudo borrar la recepción.");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={onClick}
        className="rounded-full border border-admin-bad-text px-5 py-2.5 text-[0.85rem] font-semibold text-admin-bad-text disabled:opacity-60"
      >
        {pending ? "Borrando…" : "Borrar recepción"}
      </button>
      {error && <p className="text-[0.78rem] text-admin-bad-text">{error}</p>}
    </div>
  );
}
