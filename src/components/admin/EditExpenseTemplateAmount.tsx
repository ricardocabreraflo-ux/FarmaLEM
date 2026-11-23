"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateExpenseTemplateAmountAction } from "@/app/admin/finanzas/gastos/actions";

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

export function EditExpenseTemplateAmount({ templateId, name, amount }: { templateId: string; name: string; amount: number }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(amount));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="font-data tabular-nums text-admin-ink">{fmtMoney(amount)}</span>
        <button
          type="button"
          onClick={() => {
            setValue(String(amount));
            setEditing(true);
          }}
          className="text-[0.72rem] font-semibold text-admin-primary hover:underline"
        >
          Editar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0"
          step="0.01"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-28 rounded-lg border border-admin-border bg-admin-bg px-2.5 py-1.5 text-right text-admin-ink outline-none"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await updateExpenseTemplateAmountAction(templateId, name, Number(value || 0));
              if (result.error) {
                setError(result.error);
                return;
              }
              setEditing(false);
              router.refresh();
            })
          }
          className="rounded-full bg-admin-primary px-3.5 py-1.5 text-[0.78rem] font-semibold text-white disabled:opacity-60"
        >
          {pending ? "…" : "Guardar"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-[0.78rem] text-admin-ink-soft">
          Cancelar
        </button>
      </div>
      {error && <p className="max-w-[16rem] text-right text-[0.76rem] text-admin-bad-text">{error}</p>}
    </div>
  );
}
