"use client";

import { useRouter } from "next/navigation";

export function MonthPicker({ month, basePath, className }: { month: string; basePath: string; className?: string }) {
  const router = useRouter();

  function go(value: string) {
    if (value) router.push(`${basePath}?mes=${value}`);
  }

  return (
    <form
      className={className ?? "mt-4 flex items-end gap-3"}
      onSubmit={(e) => {
        e.preventDefault();
        go(new FormData(e.currentTarget).get("mes") as string);
      }}
    >
      <label className="block max-w-[220px] flex-1 text-[0.85rem] font-semibold text-admin-ink">
        Mes
        <input
          type="month"
          name="mes"
          defaultValue={month}
          onChange={(e) => go(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
        />
      </label>
      <button type="submit" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink">
        Ver
      </button>
    </form>
  );
}
