"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReceiptEnteredInSystemAction } from "@/app/admin/compras/actions";

/** Palomita para marcar que ese ticket ya se capturó en el otro sistema (SICAR X u otro), sin depender del estado Pendiente/Completa. */
export function ReceiptEnteredCheckbox({ receiptId, initialValue }: { receiptId: string; initialValue: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(initialValue);
  const [pending, startTransition] = useTransition();

  function onChange(next: boolean) {
    setChecked(next);
    startTransition(async () => {
      const res = await setReceiptEnteredInSystemAction(receiptId, next);
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
      aria-label="Ya ingresado al otro sistema"
    />
  );
}
