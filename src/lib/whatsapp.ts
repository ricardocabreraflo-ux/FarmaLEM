import "server-only";

/**
 * Notificación por WhatsApp cuando se paga un pedido, vía WhatsApp Business
 * Cloud API de Meta. Nunca truena el flujo que la llama — si falla, solo
 * queda registrado en logs (el pedido ya está pagado y visible en /admin
 * de todas formas).
 *
 * Requiere en .env.local (ver README para cómo conseguirlas en Meta):
 *   WHATSAPP_ACCESS_TOKEN=...
 *   WHATSAPP_PHONE_NUMBER_ID=...
 *   WHATSAPP_NOTIFY_NUMBER=...       (tu número, formato 521XXXXXXXXXX, sin "+")
 *   WHATSAPP_TEMPLATE_NAME=nuevo_pedido_farmalem   (opcional, ese es el default)
 */
interface OrderNotificationParams {
  orderId: string;
  customerName: string;
  customerPhone: string;
  total: number;
}

export async function sendOrderWhatsAppNotification(params: OrderNotificationParams) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = process.env.WHATSAPP_NOTIFY_NUMBER;
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "nuevo_pedido_farmalem";

  if (!token || !phoneNumberId || !recipient) {
    console.warn("[whatsapp] faltan variables de entorno — se omite el aviso de este pedido");
    return;
  }

  const folio = params.orderId.slice(0, 8).toUpperCase();

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "template",
        template: {
          name: templateName,
          language: { code: "es_MX" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: params.customerName },
                { type: "text", text: params.customerPhone },
                { type: "text", text: params.total.toFixed(2) },
                { type: "text", text: folio },
              ],
            },
          ],
        },
      }),
    });

    if (!res.ok) {
      console.error("[whatsapp] Meta respondió con error:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[whatsapp] no se pudo enviar el aviso", err);
  }
}
