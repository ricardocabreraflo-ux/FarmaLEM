"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DateRangeFilter({ basePath, desde, hasta }: { basePath: string; desde?: string; hasta?: string }) {
  const router = useRouter();
  const [from, setFrom] = useState(desde ?? "");
  const [to, setTo] = useState(hasta ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!from || !to) return;
    router.push(`${basePath}?desde=${from}&hasta=${to}`);
  }

  return (
    <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-3">
      <label className="block text-[0.85rem] font-semibold text-admin-ink">
        Desde
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          max={to || undefined}
          className="mt-1.5 block w-[9.5rem] rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
        />
      </label>
      <label className="block text-[0.85rem] font-semibold text-admin-ink">
        Hasta
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          min={from || undefined}
          className="mt-1.5 block w-[9.5rem] rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
        />
      </label>
      <button type="submit" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink">
        Ver rango
      </button>
      {(desde || hasta) && (
        <button
          type="button"
          onClick={() => router.push(basePath)}
          className="text-[0.82rem] font-semibold text-admin-ink-soft hover:text-admin-ink"
        >
          Quitar filtro de fechas
        </button>
      )}
    </form>
  );
}
