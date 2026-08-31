"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { replaceBonusTiers, saveBonusWeek, computeWeekFromRecords, listBonusTiers, type BonusTier } from "@/lib/bonuses";
import { logAction } from "@/lib/history";

function previousMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

export interface SuggestedTier {
  shift: "Matutino" | "Vespertino";
  level: number;
  goal: number;
  bonus: number;
}

/** Toma las metas del mes anterior y sube la meta semanal (no el bono) el porcentaje indicado, redondeado a $100. */
export async function suggestIncreasedTiers(month: string, percent: number): Promise<SuggestedTier[] | { error: string }> {
  await requireAdminSession();
  const prev = previousMonth(month);
  const prevTiers = await listBonusTiers(prev);
  if (prevTiers.length === 0) return { error: `${prev} no tiene metas configuradas para copiar.` };

  return prevTiers.map((t: BonusTier) => ({
    shift: t.shift,
    level: t.level,
    goal: Math.round((t.goal * (1 + percent / 100)) / 100) * 100,
    bonus: t.bonus,
  }));
}

export interface BonusFormState {
  error?: string;
}

export async function saveBonusTiersForm(_prevState: BonusFormState | undefined, formData: FormData): Promise<BonusFormState> {
  const session = await requireAdminSession();

  const month = String(formData.get("month") ?? "");
  const shifts = formData.getAll("shift").map(String);
  const levels = formData.getAll("level").map(Number);
  const goals = formData.getAll("goal").map(Number);
  const bonusAmounts = formData.getAll("bonus").map(Number);

  if (!month) return { error: "Selecciona el mes." };

  try {
    await replaceBonusTiers(
      month,
      shifts.map((shift, i) => ({ shift: shift as "Matutino" | "Vespertino", level: levels[i], goal: goals[i], bonus: bonusAmounts[i] })),
      session.uid
    );
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudieron guardar las metas." };
  }

  await logAction(session.uid, "Configuró metas de bono", month);
  revalidatePath("/admin/bonos");
  redirect(`/admin/bonos?mes=${month}`);
}

export async function saveBonusWeekForm(_prevState: BonusFormState | undefined, formData: FormData): Promise<BonusFormState> {
  const session = await requireAdminSession();

  const id = String(formData.get("id") ?? "") || undefined;
  const month = String(formData.get("month") ?? "");
  const week = Number(formData.get("week") ?? 0);
  const employeeId = String(formData.get("employeeId") ?? "");
  const shift = String(formData.get("shift") ?? "");
  const startDate = String(formData.get("startDate") ?? "");
  const endDate = String(formData.get("endDate") ?? "");
  const sales = Number(formData.get("sales") ?? 0);
  const absent = String(formData.get("absent") ?? "") === "true";

  if (!month || !week || !employeeId || !startDate || !endDate) return { error: "Completa mes, semana, empleado y fechas." };

  try {
    await saveBonusWeek({ month, week, employeeId, shift, startDate, endDate, sales, absent, createdBy: session.uid }, id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar la semana." };
  }

  await logAction(session.uid, "Calculó bono semanal", `Semana ${week} · ${month}`);
  revalidatePath("/admin/bonos");
  redirect(`/admin/bonos?mes=${month}`);
}

export async function computeWeekAction(employeeId: string, startDate: string, endDate: string) {
  await requireAdminSession();
  if (!startDate || !endDate) return { sales: 0, absent: false };
  return computeWeekFromRecords(employeeId, startDate, endDate);
}
