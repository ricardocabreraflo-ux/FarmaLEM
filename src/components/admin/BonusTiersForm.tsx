"use client";

import { useActionState, useState, useTransition } from "react";
import Link from "next/link";
import { saveBonusTiersForm, suggestIncreasedTiers, type BonusFormState } from "@/app/admin/bonos/actions";
import type { BonusTier } from "@/lib/bonuses";

const SHIFTS = ["Matutino", "Vespertino"] as const;
const LEVELS = [1, 2, 3, 4];

type Cell = { goal: string; bonus: string };
type Grid = Record<string, Cell>;

function cellKey(shift: string, level: number) {
  return `${shift}-${level}`;
}

function initialGrid(tiers: BonusTier[]): Grid {
  const grid: Grid = {};
  for (const shift of SHIFTS) {
    for (const level of LEVELS) {
      const existing = tiers.find((t) => t.shift === shift && t.level === level);
      grid[cellKey(shift, level)] = { goal: String(existing?.goal ?? 0), bonus: String(existing?.bonus ?? level * 150) };
    }
  }
  return grid;
}

export function BonusTiersForm({ month, tiers }: { month: string; tiers: BonusTier[] }) {
  const [state, formAction, pending] = useActionState<BonusFormState | undefined, FormData>(saveBonusTiersForm, undefined);
  const [grid, setGrid] = useState<Grid>(() => initialGrid(tiers));
  const [percent, setPercent] = useState("5");
  const [suggestMessage, setSuggestMessage] = useState<string | null>(null);
  const [suggesting, startSuggest] = useTransition();

  function setCell(shift: string, level: number, field: "goal" | "bonus", value: string) {
    setGrid((prev) => ({ ...prev, [cellKey(shift, level)]: { ...prev[cellKey(shift, level)], [field]: value } }));
  }

  function applyIncrease() {
    const pct = Number(percent || 0);
    startSuggest(async () => {
      const result = await suggestIncreasedTiers(month, pct);
      if ("error" in result) {
        setSuggestMessage(result.error);
        return;
      }
      setGrid((prev) => {
        const next = { ...prev };
        for (const t of result) next[cellKey(t.shift, t.level)] = { goal: String(t.goal), bonus: String(t.bonus) };
        return next;
      });
      setSuggestMessage(`Metas copiadas del mes anterior y subidas ${pct}% (redondeadas a $100). Revisa y guarda.`);
    });
  }

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="month" value={month} />

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-admin-border bg-admin-primary-soft px-4 py-3.5">
        <label className="block text-[0.85rem] font-semibold text-admin-primary-deep">
          Subir metas del mes anterior
          <div className="mt-1.5 flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              className="w-20 rounded-lg border border-admin-border bg-admin-input-bg px-3 py-2 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
            />
            <span className="text-admin-primary-deep">%</span>
          </div>
        </label>
        <button
          type="button"
          disabled={suggesting}
          onClick={applyIncrease}
          className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white disabled:opacity-60"
        >
          {suggesting ? "Calculando…" : "Copiar y aplicar %"}
        </button>
        <span className="text-[0.8rem] text-admin-primary-deep">La meta semanal sube ese %, redondeada a $100; el bono no cambia.</span>
      </div>
      {suggestMessage && <p className="text-[0.82rem] font-semibold text-admin-ink-soft">{suggestMessage}</p>}

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
                const cell = grid[cellKey(shift, level)];
                return (
                  <tr key={cellKey(shift, level)} className="border-b border-admin-border last:border-0">
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
                        value={cell.goal}
                        onChange={(e) => setCell(shift, level, "goal", e.target.value)}
                        className="w-full rounded-lg border border-admin-border bg-admin-input-bg px-3 py-2 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
                      />
                    </td>
                    <td className="px-5 py-2">
                      <input
                        name="bonus"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={cell.bonus}
                        onChange={(e) => setCell(shift, level, "bonus", e.target.value)}
                        className="w-full rounded-lg border border-admin-border bg-admin-input-bg px-3 py-2 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-admin-primary"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

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
