"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setInventoryCheckAction } from "@/app/admin/actividades/actions";
import type { InventoryCheckShift } from "@/lib/activity-inventory-checks";

export function ActivityInventoryCheckbox({ date, shift, initialChecked }: { date: string; shift: InventoryCheckShift; initialChecked: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(initialChecked);
  const [pending, startTransition] = useTransition();

  function onChange(next: boolean) {
    setChecked(next);
    startTransition(async () => {
      const res = await setInventoryCheckAction(date, shift, next);
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
      className="h-3 w-3 shrink-0 accent-admin-primary disabled:opacity-60"
      aria-label={`Ya mandé el inventario de ${shift.toLowerCase()}`}
      title="Ya lo mandé"
    />
  );
}
