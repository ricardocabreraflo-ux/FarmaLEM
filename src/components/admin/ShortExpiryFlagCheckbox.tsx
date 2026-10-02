"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setShortExpiryInSystemAction, setShortExpiryRemovedFromSystemAction } from "@/app/admin/caducidad-corta/actions";

export function ShortExpiryFlagCheckbox({
  id,
  field,
  initialValue,
  disabled,
}: {
  id: string;
  field: "in_system" | "removed_from_system";
  initialValue: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState(initialValue);
  const [pending, startTransition] = useTransition();

  function onChange(next: boolean) {
    setChecked(next);
    startTransition(async () => {
      const res = field === "in_system" ? await setShortExpiryInSystemAction(id, next) : await setShortExpiryRemovedFromSystemAction(id, next);
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
      disabled={pending || disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 accent-admin-primary disabled:opacity-60"
      aria-label={field === "in_system" ? "Sigue en el sistema" : "Dado de baja en el sistema"}
    />
  );
}
