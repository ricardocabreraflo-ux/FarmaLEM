"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setReceiptStockedAtPharmacyAction } from "@/app/admin/compras/actions";

/** Palomita para marcar que la mercancía de ese ticket ya se acomodó en el anaquel — independiente de si ya se capturó en el otro sistema. */
export function ReceiptStockedCheckbox({ receiptId, initialValue }: { receiptId: string; initialValue: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(initialValue);
  const [pending, startTransition] = useTransition();

  function onChange(next: boolean) {
    setChecked(next);
    startTransition(async () => {
      const res = await setReceiptStockedAtPharmacyAction(receiptId, next);
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
      aria-label="Ya acomodado en la farmacia"
    />
  );
}
