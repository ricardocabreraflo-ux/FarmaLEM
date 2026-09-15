"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCutCashCollectedAction } from "@/app/admin/cortes/actions";

/** Palomita para marcar que el efectivo físico de ese corte ya se recogió — para llevar el flujo de efectivo real día a día. */
export function CutCashCollectedCheckbox({ cutId, initialValue }: { cutId: string; initialValue: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(initialValue);
  const [pending, startTransition] = useTransition();

  function onChange(next: boolean) {
    setChecked(next);
    startTransition(async () => {
      const res = await setCutCashCollectedAction(cutId, next);
      if (!res.ok) {
        setChecked(!next);
        return;
      }
      router.refresh();
    });
  }

  return (
    <input
      type="checkbox"
      checked={checked}
      disabled={pending}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 accent-admin-primary disabled:opacity-60"
      aria-label="Efectivo ya recogido"
    />
  );
}
