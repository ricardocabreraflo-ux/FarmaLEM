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

/**
 * Aviso a administración cuando se termina de capturar un corte de caja.
 * Usa el mismo número/token que el aviso de pedidos, pero una plantilla
 * distinta — hay que crearla y aprobarla en Meta antes de que funcione:
 *
 *   WHATSAPP_CUT_TEMPLATE_NAME=corte_capturado_farmalem   (opcional, ese es el default)
 *
 * Texto sugerido para la plantilla (categoría "Utilidad", idioma es_MX):
 *   "Nuevo corte capturado: {{1}} · Turno {{2}} · {{3}} · Total ${{4}} MXN"
 */
interface CutNotificationParams {
  employeeName: string;
  shift: string;
  cutDate: string;
  total: number;
}

export async function sendCutWhatsAppNotification(params: CutNotificationParams) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = process.env.WHATSAPP_NOTIFY_NUMBER;
  const templateName = process.env.WHATSAPP_CUT_TEMPLATE_NAME || "corte_capturado_farmalem";

  if (!token || !phoneNumberId || !recipient) {
    console.warn("[whatsapp] faltan variables de entorno — se omite el aviso de este corte");
    return;
  }

  const dateLabel = new Date(`${params.cutDate}T12:00:00`).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

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
                { type: "text", text: params.employeeName },
                { type: "text", text: params.shift },
                { type: "text", text: dateLabel },
                { type: "text", text: params.total.toFixed(2) },
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
    console.error("[whatsapp] no se pudo enviar el aviso de corte", err);
  }
}

/**
 * Aviso a administración cada vez que alguien marca Entrada o Salida en el
 * reloj checador (desde /admin/reloj o desde /admin/turno/marcar). Mismo
 * token/número que los avisos anteriores, plantilla distinta:
 *
 *   WHATSAPP_PUNCH_TEMPLATE_NAME=checada_farmalem   (opcional, ese es el default)
 *
 * Texto sugerido para la plantilla (categoría "Utilidad", idioma es_MX) —
 * ver README, sección "Aviso de checada" (Meta rechaza plantillas que
 * terminan justo en una variable, por eso {{4}} lleva "hrs." después y hay
 * una línea de cierre).
 */
interface PunchNotificationParams {
  employeeName: string;
  type: "Entrada" | "Salida";
  shift: string;
  occurredAt: string;
}

export async function sendPunchWhatsAppNotification(params: PunchNotificationParams) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const recipient = process.env.WHATSAPP_NOTIFY_NUMBER;
  const templateName = process.env.WHATSAPP_PUNCH_TEMPLATE_NAME || "checada_farmalem";

  if (!token || !phoneNumberId || !recipient) {
    console.warn("[whatsapp] faltan variables de entorno — se omite el aviso de esta checada");
    return;
  }

  const timeLabel = new Date(params.occurredAt).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" });

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
                { type: "text", text: params.employeeName },
                { type: "text", text: params.type },
                { type: "text", text: params.shift },
                { type: "text", text: timeLabel },
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
    console.error("[whatsapp] no se pudo enviar el aviso de checada", err);
  }
}
