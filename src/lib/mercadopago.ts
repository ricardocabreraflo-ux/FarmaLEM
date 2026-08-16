import "server-only";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import type { Order } from "@/lib/orders";
import type { CartItem } from "@/lib/cart-context";
import { site } from "@/lib/site";

/**
 * Requiere en .env.local:
 *   MERCADOPAGO_ACCESS_TOKEN=... (Mercado Pago → Tus integraciones → credenciales de producción)
 *   MERCADOPAGO_WEBHOOK_SECRET=... (misma sección, "Firma secreta" del webhook)
 */
function getClient() {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error(
      "Falta MERCADOPAGO_ACCESS_TOKEN en las variables de entorno. Revisa .env.example."
    );
  }
  return new MercadoPagoConfig({ accessToken, options: { timeout: 8000 } });
}

/** Crea una preferencia de Checkout Pro y regresa la URL a la que se manda al cliente a pagar. */
export async function createPaymentPreference(order: Order, items: CartItem[]) {
  const preference = new Preference(getClient());

  const result = await preference.create({
    body: {
      external_reference: order.id,
      items: items.map((it) => ({
        id: it.productId,
        title: it.nombre,
        quantity: it.cantidad,
        unit_price: it.precio,
        currency_id: "MXN",
      })),
      payer: {
        name: order.customer_name,
        phone: { number: order.customer_phone },
      },
      back_urls: {
        success: `${site.url}/checkout/exito?order=${order.id}`,
        pending: `${site.url}/checkout/pendiente?order=${order.id}`,
        failure: `${site.url}/checkout/error?order=${order.id}`,
      },
      auto_return: "approved",
      notification_url: `${site.url}/api/webhooks/mercadopago`,
      statement_descriptor: "FARMALEM",
    },
  });

  if (!result.id || !result.init_point) {
    throw new Error("Mercado Pago no regresó una preferencia de pago válida.");
  }

  return { preferenceId: result.id, checkoutUrl: result.init_point };
}

/** Consulta un pago por su ID — se usa desde el webhook para confirmar el estado real. */
export async function getPayment(paymentId: string) {
  const payment = new Payment(getClient());
  return payment.get({ id: paymentId });
}
