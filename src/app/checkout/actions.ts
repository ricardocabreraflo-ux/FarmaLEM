"use server";

import { redirect } from "next/navigation";
import { createOrder, attachMercadoPagoPreference } from "@/lib/orders";
import { createPaymentPreference } from "@/lib/mercadopago";
import type { CartItem } from "@/lib/cart-context";

interface StartCheckoutInput {
  customerName: string;
  customerPhone: string;
  notes: string;
  items: CartItem[];
}

/**
 * Crea el pedido (pendiente_pago) en Supabase, genera la preferencia de
 * Mercado Pago y manda al comprador a pagar. No regresa nada en éxito —
 * redirige. En error, regresa { error } para que el formulario lo muestre.
 */
export async function startCheckout(input: StartCheckoutInput) {
  const customerName = input.customerName.trim();
  const customerPhone = input.customerPhone.trim();

  if (!customerName) return { error: "Escribe tu nombre." };
  if (!/^\d{10}$/.test(customerPhone.replace(/\D/g, ""))) {
    return { error: "Escribe un teléfono a 10 dígitos." };
  }
  if (input.items.length === 0) return { error: "Tu carrito está vacío." };

  let checkoutUrl: string;
  try {
    const order = await createOrder({
      customerName,
      customerPhone: customerPhone.replace(/\D/g, ""),
      notes: input.notes.trim(),
      items: input.items,
    });

    const { preferenceId, checkoutUrl: url } = await createPaymentPreference(order, input.items);
    await attachMercadoPagoPreference(order.id, preferenceId);
    checkoutUrl = url;
  } catch (err) {
    console.error("[checkout] error creando la preferencia de pago", err);
    return {
      error:
        err instanceof Error
          ? err.message
          : "No se pudo iniciar el pago. Intenta de nuevo en unos minutos.",
    };
  }

  redirect(checkoutUrl);
}
