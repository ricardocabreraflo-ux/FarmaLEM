"use server";

import { revalidatePath } from "next/cache";
import { requireSession, requireAdminSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/history";
import {
  createStockoutReport,
  setStockoutResolved,
  deleteStockoutReport,
  lookupStockoutProduct,
  type StockoutKind,
  type StockoutShift,
  type StockoutLookupResult,
} from "@/lib/stockout-reports";

export interface CreateStockoutResult {
  ok: boolean;
  error?: string;
}

export interface CreateStockoutInput {
  reportDate: string;
  shift: StockoutShift;
  kind: StockoutKind;
  barcode: string;
  activeSubstance: string;
  category: string;
  presentation: string;
  gramaje: string;
  quantity: number;
  salePrice: string;
  cost: string;
  notes: string;
}

/** Cualquier empleado con acceso al módulo puede registrar un negado/faltante — igual que en la hoja de papel del mostrador. */
export async function createStockoutAction(input: CreateStockoutInput): Promise<CreateStockoutResult> {
  const session = await requireSession();
  const activeSubstance = input.activeSubstance.trim();
  if (!activeSubstance) return { ok: false, error: "Falta la sustancia activa / nombre del producto." };
  if (!(input.quantity > 0)) return { ok: false, error: "La cantidad no es válida." };

  try {
    await createStockoutReport(
      {
        reportDate: input.reportDate,
        shift: input.shift,
        kind: input.kind,
        barcode: input.barcode.trim() || null,
        activeSubstance,
        category: input.category.trim() || null,
        presentation: input.presentation.trim() || null,
        gramaje: input.gramaje.trim() || null,
        quantity: input.quantity,
        salePrice: input.salePrice ? Number(input.salePrice) : null,
        cost: input.cost ? Number(input.cost) : null,
        notes: input.notes.trim() || null,
      },
      session.uid
    );
    await logAction(session.uid, input.kind === "Faltante" ? "Registró faltante" : "Registró negado", activeSubstance);
    revalidatePath("/admin/negados");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo guardar el registro." };
  }
}

export interface LookupStockoutResult {
  ok: boolean;
  data?: StockoutLookupResult;
}

/** Autocompleta un "Faltante" (producto ya conocido) buscando el código de barras en compras/catálogo. */
export async function lookupStockoutProductAction(barcode: string): Promise<LookupStockoutResult> {
  await requireSession();
  const data = await lookupStockoutProduct(barcode);
  return data ? { ok: true, data } : { ok: false };
}

export interface SetStockoutResolvedResult {
  ok: boolean;
  error?: string;
}

export async function setStockoutResolvedAction(id: string, value: boolean): Promise<SetStockoutResolvedResult> {
  await requireSession();
  try {
    await setStockoutResolved(id, value);
    revalidatePath("/admin/negados");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo actualizar." };
  }
}

export interface DeleteStockoutResult {
  ok: boolean;
  error?: string;
}

export async function deleteStockoutAction(id: string): Promise<DeleteStockoutResult> {
  const session = await requireAdminSession();
  try {
    await deleteStockoutReport(id);
    await logAction(session.uid, "Borró negado/faltante", id);
    revalidatePath("/admin/negados");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo borrar el registro." };
  }
}
