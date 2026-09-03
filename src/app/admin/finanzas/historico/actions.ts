"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/history";
import {
  saveHistoricalIncomeStatement,
  approveHistoricalIncomeStatement,
  unapproveHistoricalIncomeStatement,
  type HistoricalIncomeStatementInput,
} from "@/lib/historical-financials";

export interface HistoricalActionResult {
  ok: boolean;
  error?: string;
}

export async function saveHistoricalMonthAction(month: string, input: HistoricalIncomeStatementInput): Promise<HistoricalActionResult> {
  const session = await requireAdminSession();
  try {
    await saveHistoricalIncomeStatement(month, input, session.uid);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo guardar." };
  }
  await logAction(session.uid, "Guardó estado de resultados histórico", month);
  revalidatePath("/admin/finanzas/historico");
  return { ok: true };
}

export async function approveHistoricalMonthAction(month: string): Promise<HistoricalActionResult> {
  const session = await requireAdminSession();
  try {
    await approveHistoricalIncomeStatement(month, session.uid);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo aprobar." };
  }
  await logAction(session.uid, "Aprobó estado de resultados histórico", month);
  revalidatePath("/admin/finanzas/historico");
  return { ok: true };
}

export async function unapproveHistoricalMonthAction(month: string): Promise<HistoricalActionResult> {
  const session = await requireAdminSession();
  try {
    await unapproveHistoricalIncomeStatement(month);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo desbloquear." };
  }
  await logAction(session.uid, "Desbloqueó estado de resultados histórico", month);
  revalidatePath("/admin/finanzas/historico");
  return { ok: true };
}
