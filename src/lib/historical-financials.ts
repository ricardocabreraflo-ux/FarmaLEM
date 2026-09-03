import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export interface HistoricalIncomeStatement {
  month: string;
  ventas: number;
  costos: number;
  gasto_renta: number;
  gasto_luz_agua: number;
  gasto_bonos: number;
  gasto_sueldos: number;
  gasto_varios: number;
  gasto_papeleria: number;
  gasto_sistema: number;
  gasto_internet: number;
  perdidas_merma: number;
  approved: boolean;
  approved_by: string | null;
  approved_at: string | null;
  updated_by: string | null;
  updated_at: string;
}

export async function listHistoricalIncomeStatements(months: string[]): Promise<Map<string, HistoricalIncomeStatement>> {
  if (months.length === 0) return new Map();
  const { data, error } = await supabaseAdmin().from("historical_income_statements").select().in("month", months);
  if (error) throw new Error(`No se pudieron leer los estados de resultados históricos: ${error.message}`);
  return new Map((data as HistoricalIncomeStatement[]).map((r) => [r.month, r]));
}

export interface HistoricalIncomeStatementInput {
  ventas: number;
  costos: number;
  gastoRenta: number;
  gastoLuzAgua: number;
  gastoBonos: number;
  gastoSueldos: number;
  gastoVarios: number;
  gastoPapeleria: number;
  gastoSistema: number;
  gastoInternet: number;
  perdidasMerma: number;
}

/** Guarda un mes como borrador — no toca nada si ya está aprobado (queda fijo). */
export async function saveHistoricalIncomeStatement(month: string, input: HistoricalIncomeStatementInput, updatedBy: string): Promise<void> {
  const existing = await listHistoricalIncomeStatements([month]);
  if (existing.get(month)?.approved) throw new Error(`${month} ya está aprobado y fijo — no se puede editar.`);

  const { error } = await supabaseAdmin()
    .from("historical_income_statements")
    .upsert(
      {
        month,
        ventas: input.ventas,
        costos: input.costos,
        gasto_renta: input.gastoRenta,
        gasto_luz_agua: input.gastoLuzAgua,
        gasto_bonos: input.gastoBonos,
        gasto_sueldos: input.gastoSueldos,
        gasto_varios: input.gastoVarios,
        gasto_papeleria: input.gastoPapeleria,
        gasto_sistema: input.gastoSistema,
        gasto_internet: input.gastoInternet,
        perdidas_merma: input.perdidasMerma,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "month" }
    );
  if (error) throw new Error(error.message);
}

export async function approveHistoricalIncomeStatement(month: string, approvedBy: string): Promise<void> {
  const existing = await listHistoricalIncomeStatements([month]);
  const row = existing.get(month);
  if (!row) throw new Error(`Primero guarda ${month} antes de aprobarlo.`);
  if (row.approved) return;

  const { error } = await supabaseAdmin()
    .from("historical_income_statements")
    .update({ approved: true, approved_by: approvedBy, approved_at: new Date().toISOString() })
    .eq("month", month);
  if (error) throw new Error(error.message);
}

/** Desbloquea un mes aprobado, por si se necesita corregir algo. */
export async function unapproveHistoricalIncomeStatement(month: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("historical_income_statements")
    .update({ approved: false, approved_by: null, approved_at: null })
    .eq("month", month);
  if (error) throw new Error(error.message);
}
