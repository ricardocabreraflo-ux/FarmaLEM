import { NextRequest, NextResponse } from "next/server";
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from "mercadopago";
import { getPayment } from "@/lib/mercadopago";
import { getOrderById, markOrderPaid } from "@/lib/orders";

/**
 * Mercado Pago llama esta ruta cada vez que cambia el estado de un pago.
 * Configúrala en Mercado Pago → Tus integraciones → Webhooks como:
 *   https://TU-DOMINIO/api/webhooks/mercadopago
 * y copia la "firma secreta" a MERCADOPAGO_WEBHOOK_SECRET en .env.local.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhook mp] falta MERCADOPAGO_WEBHOOK_SECRET");
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }

  const dataId = req.nextUrl.searchParams.get("data.id");
  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  try {
    WebhookSignatureValidator.validate({
      xSignature,
      xRequestId,
      dataId,
      secret,
      toleranceSeconds: 300,
    });
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) {
      console.warn("[webhook mp] firma inválida:", err.reason);
      return NextResponse.json({ error: "invalid signature" }, { status: 401 });
    }
    throw err;
  }

  const body = await req.json().catch(() => null);
  const type = body?.type ?? req.nextUrl.searchParams.get("type");
  const paymentId = body?.data?.id ?? dataId;

  // Solo nos interesan las notificaciones de pago; todo lo demás se
  // reconoce con 200 para que Mercado Pago no lo siga reintentando.
  if (type !== "payment" || !paymentId) {
    return NextResponse.json({ received: true });
  }

  try {
    const payment = await getPayment(String(paymentId));
    const orderId = payment.external_reference;
    if (!orderId) {
      console.warn("[webhook mp] pago sin external_reference:", paymentId);
      return NextResponse.json({ received: true });
    }

    const order = await getOrderById(orderId);
    if (!order) {
      console.warn("[webhook mp] pago referencia un pedido que no existe:", orderId);
      return NextResponse.json({ received: true });
    }

    await markOrderPaid(order.id, String(payment.id), payment.status ?? "unknown");
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[webhook mp] error procesando el pago", err);
    // 500 le indica a Mercado Pago que reintente más tarde.
    return NextResponse.json({ error: "processing failed" }, { status: 500 });
  }
}
