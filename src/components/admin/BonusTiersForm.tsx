"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveBonusTiersForm, type BonusFormState } from "@/app/admin/bonos/actions";
import type { BonusTier } from "@/lib/bonuses";

const SHIFTS = ["Matutino", "Vespertino"] as const;
const LEVELS = [1, 2, 3, 4];

export function BonusTiersForm({ month, tiers }: { month: string; tiers: BonusTier[] }) {
  const [state, formAction, pending] = useActionState<BonusFormState | undefined, FormData>(saveBonusTiersForm, undefined);

  const find = (shift: string, level: number) => tiers.find((t) => t.shift === shift && t.level === level);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="month" value={month} />

      <div className="overflow-hidden rounded-2xl border border-admin-border bg-admin-surface">
        <table className="w-full text-left text-[0.86rem]">
          <thead>
            <tr className="border-b border-admin-border text-admin-ink-soft">
              <th className="px-5 py-3 font-medium">Turno</th>
              <th className="px-5 py-3 font-medium">Nivel</th>
              <th className="px-5 py-3 font-medium">Meta semanal</th>
              <th className="px-5 py-3 font-medium">Bono</th>
            </tr>
          </thead>
          <tbody>
            {SHIFTS.flatMap((shift) =>
              LEVELS.map((level) => {
                const existing = find(shift, level);
                return (
                  <tr key={`${shift}-${level}`} className="border-b border-admin-border last:border-0">
                    <td className="px-5 py-3 text-admin-ink">
                      {shift}
                      <input type="hidden" name="shift" value={shift} />
                    </td>
                    <td className="px-5 py-3 text-admin-ink-soft">
                      {level}
                      <input type="hidden" name="level" value={level} />
                    </td>
                    <td className="px-5 py-2">
                      <input
                        name="goal"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        defaultValue={existing?.goal ?? 0}
                        className="w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
                      />
                    </td>
                    <td className="px-5 py-2">
                      <input
                        name="bonus"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        defaultValue={existing?.bonus ?? level * 150}
                        className="w-full rounded-lg border border-admin-border bg-admin-bg px-3 py-2 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="rounded-lg bg-admin-primary-soft px-4 py-3 text-[0.85rem] text-admin-primary-deep">
        Al cambiar de mes puedes copiar los valores anteriores y aumentar las metas.
      </p>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Link href={`/admin/bonos?mes=${month}`} className="rounded-full border border-admin-border px-5 py-2.5 text-[0.86rem] font-semibold text-admin-ink-soft">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-admin-primary px-6 py-2.5 text-[0.86rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar metas"}
        </button>
      </div>
    </form>
  );
}
