import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";

export type ShortExpiryMonthStatus = "Abierto" | "Cerrado";
export type ShortExpiryShift = "Matutino" | "Vespertino";

export interface ShortExpiryMonth {
  month: string;
  status: ShortExpiryMonthStatus;
  closed_by: string | null;
  closed_at: string | null;
}

export interface ShortExpirySale {
  id: string;
  item_id: string;
  shift: ShortExpiryShift;
  quantity: number;
  logged_by: string;
  logged_at: string;
}

export interface ShortExpiryItem {
  id: string;
  month: string;
  shelf: string;
  barcode: string;
  description: string;
  physical_pieces: number;
  unit_price: number | null;
  expires_on: string;
  discount_pct: number | null;
  two_for_one: boolean;
  in_system: boolean;
  removed_from_system: boolean;
  carried_from_prev_month: boolean;
  notes: string | null;
  reported_by: string;
  created_at: string;
  sales: ShortExpirySale[];
  sold: number;
  remaining: number;
}

/** El mes abre solo al tocarlo por primera vez — no hace falta ningún cron ni paso manual aparte. */
export async function getOrCreateMonth(month: string): Promise<ShortExpiryMonth> {
  const db = supabaseAdmin();
  const { data: existing } = await db.from("short_expiry_months").select().eq("month", month).maybeSingle();
  if (existing) return existing as ShortExpiryMonth;

  const { data: created, error } = await db.from("short_expiry_months").insert({ month }).select().single();
  if (error) throw new Error(`No se pudo abrir el mes: ${error.message}`);
  return created as ShortExpiryMonth;
}

export async function getMonth(month: string): Promise<ShortExpiryMonth | null> {
  const { data, error } = await supabaseAdmin().from("short_expiry_months").select().eq("month", month).maybeSingle();
  if (error) throw new Error(`No se pudo leer el mes: ${error.message}`);
  return data as ShortExpiryMonth | null;
}

export async function listItemsForMonth(month: string): Promise<ShortExpiryItem[]> {
  const db = supabaseAdmin();
  const { data: items, error } = await db
    .from("short_expiry_items")
    .select()
    .eq("month", month)
    .order("expires_on", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(`No se pudieron leer los productos: ${error.message}`);
  const rows = (items ?? []) as Omit<ShortExpiryItem, "sales" | "sold" | "remaining">[];
  if (rows.length === 0) return [];

  const { data: sales, error: salesErr } = await db
    .from("short_expiry_sales")
    .select()
    .in(
      "item_id",
      rows.map((r) => r.id)
    )
    .order("logged_at", { ascending: true });
  if (salesErr) throw new Error(`No se pudieron leer las ventas: ${salesErr.message}`);

  const salesByItem = new Map<string, ShortExpirySale[]>();
  for (const s of (sales ?? []) as ShortExpirySale[]) {
    const list = salesByItem.get(s.item_id) ?? [];
    list.push(s);
    salesByItem.set(s.item_id, list);
  }

  return rows.map((r) => {
    const itemSales = salesByItem.get(r.id) ?? [];
    const sold = itemSales.reduce((s, x) => s + x.quantity, 0);
    return { ...r, sales: itemSales, sold, remaining: Math.max(r.physical_pieces - sold, 0) };
  });
}

export interface CreateShortExpiryItemInput {
  month: string;
  shelf: string;
  barcode: string;
  description: string;
  physicalPieces: number;
  unitPrice: number | null;
  expiresOn: string;
  discountPct: number | null;
  twoForOne: boolean;
  notes: string | null;
}

async function assertMonthOpen(month: string): Promise<void> {
  const row = await getOrCreateMonth(month);
  if (row.status !== "Abierto") throw new Error("Ese mes ya quedó cerrado — ya no se puede capturar ni editar ahí.");
}

export async function createShortExpiryItem(input: CreateShortExpiryItemInput, reportedBy: string): Promise<void> {
  await assertMonthOpen(input.month);
  const { error } = await supabaseAdmin().from("short_expiry_items").insert({
    month: input.month,
    shelf: input.shelf,
    barcode: input.barcode,
    description: input.description,
    physical_pieces: input.physicalPieces,
    unit_price: input.unitPrice,
    expires_on: input.expiresOn,
    discount_pct: input.discountPct,
    two_for_one: input.twoForOne,
    notes: input.notes,
    reported_by: reportedBy,
  });
  if (error) throw new Error(`No se pudo guardar el producto: ${error.message}`);
}

export interface UpdateShortExpiryItemInput {
  shelf: string;
  physicalPieces: number;
  discountPct: number | null;
  twoForOne: boolean;
  notes: string | null;
}

async function getItemOrThrow(id: string) {
  const { data, error } = await supabaseAdmin().from("short_expiry_items").select().eq("id", id).maybeSingle();
  if (error || !data) throw new Error("Ese producto ya no existe.");
  return data as Omit<ShortExpiryItem, "sales" | "sold" | "remaining">;
}

export async function updateShortExpiryItem(id: string, input: UpdateShortExpiryItemInput): Promise<void> {
  const item = await getItemOrThrow(id);
  await assertMonthOpen(item.month);
  const { error } = await supabaseAdmin()
    .from("short_expiry_items")
    .update({ shelf: input.shelf, physical_pieces: input.physicalPieces, discount_pct: input.discountPct, two_for_one: input.twoForOne, notes: input.notes })
    .eq("id", id);
  if (error) throw new Error(`No se pudo actualizar: ${error.message}`);
}

export async function deleteShortExpiryItem(id: string): Promise<void> {
  const item = await getItemOrThrow(id);
  await assertMonthOpen(item.month);
  const { error } = await supabaseAdmin().from("short_expiry_items").delete().eq("id", id);
  if (error) throw new Error(`No se pudo borrar: ${error.message}`);
}

export async function setShortExpiryInSystem(id: string, value: boolean): Promise<void> {
  const { error } = await supabaseAdmin().from("short_expiry_items").update({ in_system: value }).eq("id", id);
  if (error) throw new Error(`No se pudo actualizar: ${error.message}`);
}

export async function setShortExpiryRemovedFromSystem(id: string, value: boolean): Promise<void> {
  const { error } = await supabaseAdmin().from("short_expiry_items").update({ removed_from_system: value }).eq("id", id);
  if (error) throw new Error(`No se pudo actualizar: ${error.message}`);
}

/** Una venta con descuento por caducidad próxima, capturada a mano por el turno que la hizo — nunca pasa de lo que queda físico. */
export async function logShortExpirySale(itemId: string, shift: ShortExpiryShift, quantity: number, loggedBy: string): Promise<void> {
  const item = await getItemOrThrow(itemId);
  await assertMonthOpen(item.month);

  const { data: existingSales, error: salesErr } = await supabaseAdmin().from("short_expiry_sales").select("quantity").eq("item_id", itemId);
  if (salesErr) throw new Error(`No se pudo leer las ventas previas: ${salesErr.message}`);
  const sold = (existingSales ?? []).reduce((s, r) => s + (r as { quantity: number }).quantity, 0);
  const remaining = item.physical_pieces - sold;
  if (quantity > remaining) throw new Error(`Solo quedan ${remaining} piezas físicas de ese producto.`);

  const { error } = await supabaseAdmin().from("short_expiry_sales").insert({ item_id: itemId, shift, quantity, logged_by: loggedBy });
  if (error) throw new Error(`No se pudo registrar la venta: ${error.message}`);
}

export async function deleteShortExpirySale(id: string): Promise<void> {
  const { data: sale, error: saleErr } = await supabaseAdmin().from("short_expiry_sales").select("item_id").eq("id", id).maybeSingle();
  if (saleErr || !sale) throw new Error("Esa venta ya no existe.");
  const item = await getItemOrThrow((sale as { item_id: string }).item_id);
  await assertMonthOpen(item.month);
  const { error } = await supabaseAdmin().from("short_expiry_sales").delete().eq("id", id);
  if (error) throw new Error(`No se pudo borrar la venta: ${error.message}`);
}

function nextMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

function monthEndDate(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${month}-${String(lastDay).padStart(2, "0")}`;
}

/**
 * Cierra el mes e imprime la relación (la relación en sí es la página
 * /reporte, esto solo deja de poder tocarse). Lo que queda con existencia y
 * todavía no caduca se arrastra al siguiente mes con las piezas restantes
 * como nuevo físico — lo que ya se caducó o se vendió por completo se queda
 * nada más en el historial de este mes, no se vuelve a arrastrar.
 */
export async function closeShortExpiryMonth(month: string, closedBy: string): Promise<void> {
  const row = await getOrCreateMonth(month);
  if (row.status === "Cerrado") throw new Error("Ese mes ya estaba cerrado.");

  const items = await listItemsForMonth(month);
  const monthEnd = monthEndDate(month);
  const toCarry = items.filter((i) => i.remaining > 0 && i.expires_on > monthEnd);

  const { error: closeErr } = await supabaseAdmin()
    .from("short_expiry_months")
    .update({ status: "Cerrado", closed_by: closedBy, closed_at: new Date().toISOString() })
    .eq("month", month);
  if (closeErr) throw new Error(`No se pudo cerrar el mes: ${closeErr.message}`);

  if (toCarry.length === 0) return;

  const next = nextMonth(month);
  await getOrCreateMonth(next);
  const { error: insertErr } = await supabaseAdmin()
    .from("short_expiry_items")
    .insert(
      toCarry.map((i) => ({
        month: next,
        shelf: i.shelf,
        barcode: i.barcode,
        description: i.description,
        physical_pieces: i.remaining,
        unit_price: i.unit_price,
        expires_on: i.expires_on,
        discount_pct: i.discount_pct,
        two_for_one: i.two_for_one,
        notes: i.notes,
        reported_by: i.reported_by,
        carried_from_prev_month: true,
      }))
    );
  if (insertErr) throw new Error(`Se cerró el mes pero no se pudo arrastrar todo al siguiente: ${insertErr.message}`);
}
