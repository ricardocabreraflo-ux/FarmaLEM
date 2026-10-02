"use server";

import { revalidatePath } from "next/cache";
import { requireSession, requireAdminSession } from "@/lib/admin-auth";
import { logAction } from "@/lib/history";
import { lookupStockoutProduct, type StockoutLookupResult } from "@/lib/stockout-reports";
import {
  createShortExpiryItem,
  updateShortExpiryItem,
  deleteShortExpiryItem,
  setShortExpiryInSystem,
  setShortExpiryRemovedFromSystem,
  logShortExpirySale,
  deleteShortExpirySale,
  closeShortExpiryMonth,
  type ShortExpiryShift,
} from "@/lib/short-expiry";

const PATH = "/admin/caducidad-corta";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface LookupResult {
  ok: boolean;
  data?: StockoutLookupResult;
}

/** Mismo catálogo/compras que usa Negados y faltantes para autocompletar por código de barras. */
export async function lookupShortExpiryProductAction(barcode: string): Promise<LookupResult> {
  await requireSession();
  const data = await lookupStockoutProduct(barcode);
  return data ? { ok: true, data } : { ok: false };
}

export interface CreateShortExpiryInput {
  month: string;
  shelf: string;
  barcode: string;
  description: string;
  physicalPieces: number;
  unitPrice: string;
  expiresOn: string;
  discountPct: string;
  twoForOne: boolean;
  notes: string;
}

export async function createShortExpiryItemAction(input: CreateShortExpiryInput): Promise<ActionResult> {
  const session = await requireSession();
  const shelf = input.shelf.trim();
  const barcode = input.barcode.trim();
  const description = input.description.trim();
  if (!shelf) return { ok: false, error: "Falta el anaquel/mueble." };
  if (!description) return { ok: false, error: "Falta la descripción del producto." };
  if (!input.expiresOn) return { ok: false, error: "Falta la fecha de caducidad." };
  if (!(input.physicalPieces > 0)) return { ok: false, error: "Las piezas físicas no son válidas." };

  try {
    await createShortExpiryItem(
      {
        month: input.month,
        shelf,
        barcode,
        description,
        physicalPieces: input.physicalPieces,
        unitPrice: input.unitPrice ? Number(input.unitPrice) : null,
        expiresOn: input.expiresOn,
        discountPct: input.discountPct ? Number(input.discountPct) : null,
        twoForOne: input.twoForOne,
        notes: input.notes.trim() || null,
      },
      session.uid
    );
    await logAction(session.uid, "Registró producto de corta caducidad", `${description} · ${shelf}`);
    revalidatePath(PATH);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo guardar." };
  }
}

export interface UpdateShortExpiryInput {
  id: string;
  shelf: string;
  physicalPieces: number;
  discountPct: string;
  twoForOne: boolean;
  notes: string;
}

export async function updateShortExpiryItemAction(input: UpdateShortExpiryInput): Promise<ActionResult> {
  await requireSession();
  if (!input.shelf.trim()) return { ok: false, error: "Falta el anaquel/mueble." };
  if (!(input.physicalPieces > 0)) return { ok: false, error: "Las piezas físicas no son válidas." };
  try {
    await updateShortExpiryItem(input.id, {
      shelf: input.shelf.trim(),
      physicalPieces: input.physicalPieces,
      discountPct: input.discountPct ? Number(input.discountPct) : null,
      twoForOne: input.twoForOne,
      notes: input.notes.trim() || null,
    });
    revalidatePath(PATH);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo actualizar." };
  }
}

export async function deleteShortExpiryItemAction(id: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  try {
    await deleteShortExpiryItem(id);
    await logAction(session.uid, "Borró producto de corta caducidad", id);
    revalidatePath(PATH);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo borrar." };
  }
}

export async function setShortExpiryInSystemAction(id: string, value: boolean): Promise<ActionResult> {
  await requireSession();
  try {
    await setShortExpiryInSystem(id, value);
    revalidatePath(PATH);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo actualizar." };
  }
}

/** Confirmar la baja real en SICAR X la hace quien cuadra el sistema — por eso solo administración la marca. */
export async function setShortExpiryRemovedFromSystemAction(id: string, value: boolean): Promise<ActionResult> {
  await requireAdminSession();
  try {
    await setShortExpiryRemovedFromSystem(id, value);
    revalidatePath(PATH);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo actualizar." };
  }
}

export async function logShortExpirySaleAction(itemId: string, shift: ShortExpiryShift, quantity: number): Promise<ActionResult> {
  const session = await requireSession();
  if (!(quantity > 0)) return { ok: false, error: "La cantidad no es válida." };
  try {
    await logShortExpirySale(itemId, shift, quantity, session.uid);
    revalidatePath(PATH);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo registrar la venta." };
  }
}

export async function deleteShortExpirySaleAction(id: string): Promise<ActionResult> {
  await requireSession();
  try {
    await deleteShortExpirySale(id);
    revalidatePath(PATH);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo borrar la venta." };
  }
}

/** "Yo le doy aprobar" — cerrar el mes (y arrastrar lo que sigue con existencia) solo lo hace administración. */
export async function closeShortExpiryMonthAction(month: string): Promise<ActionResult> {
  const session = await requireAdminSession();
  try {
    await closeShortExpiryMonth(month, session.uid);
    await logAction(session.uid, "Cerró mes de caducidad corta", month);
    revalidatePath(PATH);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo cerrar el mes." };
  }
}
