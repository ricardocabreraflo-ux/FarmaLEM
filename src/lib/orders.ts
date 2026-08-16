import "server-only";
import { supabaseAdmin } from "@/lib/supabase-server";
import type { CartItem } from "@/lib/cart-context";

export type OrderStatus = "pendiente_pago" | "pagado" | "listo_para_recoger" | "entregado" | "cancelado";

export interface Order {
  id: string;
  created_at: string;
  updated_at: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  notes: string | null;
  subtotal: number;
  total: number;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  mp_status: string | null;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  subtotal: number;
}

interface CreateOrderInput {
  customerName: string;
  customerPhone: string;
  notes?: string;
  items: CartItem[];
}

/** Crea el pedido y sus líneas en una sola operación; el estado inicial siempre es "pendiente_pago". */
export async function createOrder({ customerName, customerPhone, notes, items }: CreateOrderInput) {
  if (items.length === 0) {
    throw new Error("No se puede crear un pedido sin productos.");
  }

  const subtotal = items.reduce((sum, it) => sum + it.precio * it.cantidad, 0);
  const supabase = supabaseAdmin();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_name: customerName,
      customer_phone: customerPhone,
      notes: notes || null,
      subtotal,
      total: subtotal,
      status: "pendiente_pago",
    })
    .select()
    .single();

  if (orderError || !order) {
    throw new Error(`No se pudo crear el pedido: ${orderError?.message}`);
  }

  const { error: itemsError } = await supabase.from("order_items").insert(
    items.map((it) => ({
      order_id: order.id,
      product_id: it.productId,
      nombre: it.nombre,
      precio_unitario: it.precio,
      cantidad: it.cantidad,
      subtotal: it.precio * it.cantidad,
    }))
  );

  if (itemsError) {
    // El pedido quedó huérfano sin líneas — mejor cancelarlo que dejarlo fantasma.
    await supabase.from("orders").update({ status: "cancelado" }).eq("id", order.id);
    throw new Error(`No se pudieron guardar los productos del pedido: ${itemsError.message}`);
  }

  return order as Order;
}

export async function attachMercadoPagoPreference(orderId: string, preferenceId: string) {
  const { error } = await supabaseAdmin()
    .from("orders")
    .update({ mp_preference_id: preferenceId })
    .eq("id", orderId);
  if (error) throw new Error(`No se pudo guardar la preferencia de pago: ${error.message}`);
}

export async function getOrderById(orderId: string) {
  const { data, error } = await supabaseAdmin().from("orders").select().eq("id", orderId).single();
  if (error) return null;
  return data as Order;
}

export async function getOrderByPreferenceId(preferenceId: string) {
  const { data, error } = await supabaseAdmin()
    .from("orders")
    .select()
    .eq("mp_preference_id", preferenceId)
    .single();
  if (error) return null;
  return data as Order;
}

export async function markOrderPaid(orderId: string, paymentId: string, mpStatus: string) {
  const status: OrderStatus = mpStatus === "approved" ? "pagado" : "pendiente_pago";
  const { error } = await supabaseAdmin()
    .from("orders")
    .update({ mp_payment_id: paymentId, mp_status: mpStatus, status })
    .eq("id", orderId);
  if (error) throw new Error(`No se pudo actualizar el estado del pedido: ${error.message}`);
}

export async function listOrders() {
  const { data, error } = await supabaseAdmin()
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`No se pudieron leer los pedidos: ${error.message}`);
  return data as (Order & { order_items: OrderItemRow[] })[];
}

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  const { error } = await supabaseAdmin().from("orders").update({ status }).eq("id", orderId);
  if (error) throw new Error(`No se pudo actualizar el pedido: ${error.message}`);
}
