"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setStockoutResolvedAction } from "@/app/admin/negados/actions";

export function StockoutResolvedCheckbox({ id, initialValue }: { id: string; initialValue: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(initialValue);
  const [pending, startTransition] = useTransition();

  function onChange(next: boolean) {
    setChecked(next);
    startTransition(async () => {
      const res = await setStockoutResolvedAction(id, next);
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
      aria-label="Ya se surtió / resuelto"
    />
  );
}
