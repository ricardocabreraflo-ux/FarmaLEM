"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { captureExpenseTemplateAction } from "@/app/admin/finanzas/gastos/actions";
import type { ExpenseTemplateType } from "@/lib/expense-templates";

export function CaptureExpenseButton({
  templateId,
  name,
  type,
  category,
  defaultAmount,
  month,
  alreadyCaptured,
}: {
  templateId: string;
  name: string;
  type: ExpenseTemplateType;
  category: string;
  defaultAmount: number;
  month: string;
  alreadyCaptured: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [amount, setAmount] = useState(String(defaultAmount));
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (alreadyCaptured) {
    return <span className="rounded-full bg-admin-ok-bg px-3 py-1.5 text-[0.78rem] font-semibold text-admin-ok-text">Ya registrado este mes</span>;
  }

  if (editing) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-28 rounded-lg border border-admin-border bg-admin-bg px-2.5 py-1.5 text-admin-ink outline-none"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                setError(null);
                const result = await captureExpenseTemplateAction(templateId, name, type, category, Number(amount || 0), month);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                router.refresh();
              })
            }
            className="rounded-full bg-admin-primary px-3.5 py-1.5 text-[0.8rem] font-semibold text-white disabled:opacity-60"
          >
            {pending ? "…" : "Confirmar"}
          </button>
        </div>
        {error && <p className="max-w-[16rem] text-right text-[0.76rem] text-admin-bad-text">{error}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="rounded-full border border-admin-border px-3.5 py-1.5 text-[0.8rem] font-semibold text-admin-ink"
    >
      Registrar este mes
    </button>
  );
}
