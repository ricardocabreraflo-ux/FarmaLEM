"use server";

import { revalidatePath } from "next/cache";
import { requireSession, requireAdminSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/history";
import { lookupStockoutProduct, type StockoutLookupResult } from "@/lib/stockout-reports";
import {
  createInventoryDifference,
  deleteInventoryDifference,
  settlePendingForCashier,
  type InventoryDifferenceKind,
  type InventoryDifferenceShift,
} from "@/lib/inventory-differences";

const PATH = "/admin/diferencias";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface LookupResult {
  ok: boolean;
  data?: StockoutLookupResult;
}

/** Mismo catálogo/compras que Negados y faltantes para autocompletar por código de barras. */
export async function lookupInventoryDifferenceProductAction(barcode: string): Promise<LookupResult> {
  await requireSession();
  const data = await lookupStockoutProduct(barcode);
  return data ? { ok: true, data } : { ok: false };
}

export interface CreateInventoryDifferenceActionInput {
  diffDate: string;
  category: string;
  shift: InventoryDifferenceShift;
  kind: InventoryDifferenceKind;
  barcode: string;
  description: string;
  unitPrice: string;
  quantity: number;
  observations: string;
  cashierId: string;
}

export async function createInventoryDifferenceAction(input: CreateInventoryDifferenceActionInput): Promise<ActionResult> {
  const session = await requireSession();
  const description = input.description.trim();
  if (!description) return { ok: false, error: "Falta la descripción del producto." };
  if (!(input.quantity > 0)) return { ok: false, error: "Las piezas no son válidas." };

  // Una cajera solo puede capturar a su propio nombre; solo administración puede elegir a nombre de quién.
  const cashierId = session.role === "admin" && input.cashierId ? input.cashierId : session.uid;

  try {
    await createInventoryDifference(
      {
        diffDate: input.diffDate,
        category: input.category,
        shift: input.shift,
        kind: input.kind,
        barcode: input.barcode.trim() || null,
        description,
        unitPrice: input.unitPrice ? Number(input.unitPrice) : null,
        quantity: input.quantity,
        observations: input.observations.trim() || null,
        cashierId,
      },
      session.uid
    );
    await logAction(session.uid, input.kind === "Faltante" ? "Registró faltante de inventario" : "Registró sobrante de inventario", description);
    revalidatePath(PATH);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo guardar." };
  }
}

export async function deleteInventoryDifferenceAction(id: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  try {
    await deleteInventoryDifference(id);
    await logAction(session.uid, "Borró diferencia de inventario", id);
    revalidatePath(PATH);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo borrar." };
  }
}

export async function settlePendingForCashierAction(cashierId: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  try {
    await settlePendingForCashier(cashierId, session.uid);
    await logAction(session.uid, "Marcó pagado el saldo de diferencias", cashierId);
    revalidatePath(PATH);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo marcar como pagado." };
  }
}
