import "server-only";
import webPush from "web-push";
import { supabaseAdmin } from "@/lib/supabase-server";
import { logAction } from "@/lib/history";

// TEMPORAL: para diagnosticar por qué no llegan los avisos en producción —
// quitar junto con las llamadas a logAction() de abajo una vez resuelto.
const DEBUG_ADMIN_ID = "02c49bd0-7202-4fad-b937-e939562a4c8a";

/**
 * Notificaciones push del navegador/PWA (Web Push) — a diferencia de WhatsApp,
 * no depende de una plantilla aprobada por Meta: llegan directo al celular o
 * computadora de quien activó "Notificaciones" en Configuración, aunque no
 * tenga la pestaña abierta. Requiere en .env.local:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY=...
 *   VAPID_PRIVATE_KEY=...
 * (generadas una sola vez con `npx web-push generate-vapid-keys`).
 */

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

function configureWebPush(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.warn("[push] faltan las llaves VAPID — se omite el aviso");
    return false;
  }
  webPush.setVapidDetails("mailto:ricardo.cabreraflo@gmail.com", publicKey, privateKey);
  return true;
}

export async function savePushSubscription(employeeId: string, sub: PushSubscriptionInput): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("push_subscriptions")
    .upsert({ employee_id: employeeId, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth }, { onConflict: "endpoint" });
  if (error) throw new Error(`No se pudo guardar la suscripción: ${error.message}`);
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const { error } = await supabaseAdmin().from("push_subscriptions").delete().eq("endpoint", endpoint);
  if (error) throw new Error(`No se pudo quitar la suscripción: ${error.message}`);
}

export async function hasPushSubscription(employeeId: string, endpoint: string): Promise<boolean> {
  const { data } = await supabaseAdmin().from("push_subscriptions").select("id").eq("employee_id", employeeId).eq("endpoint", endpoint).maybeSingle();
  return Boolean(data);
}

/**
 * Manda un push a todas las suscripciones de administración — nunca truena el
 * flujo que la llama (igual que las notificaciones de WhatsApp): si faltan las
 * llaves VAPID, si no hay nadie suscrito, o si Meta/el navegador rechaza el
 * envío, solo queda registrado en logs. Una suscripción caducada (404/410) se
 * borra sola para no reintentarla siempre.
 */
export async function sendPushToAdmins(payload: PushPayload): Promise<void> {
  try {
    if (!configureWebPush()) {
      await logAction(DEBUG_ADMIN_ID, "[debug push]", "faltan llaves VAPID en runtime");
      return;
    }
    const db = supabaseAdmin();
    const { data: admins, error: adminsErr } = await db.from("profiles").select("id").eq("role", "admin");
    if (adminsErr || !admins || admins.length === 0) {
      await logAction(DEBUG_ADMIN_ID, "[debug push]", `sin admins — error: ${adminsErr?.message ?? "ninguno"}`);
      return;
    }

    const { data: subs, error: subsErr } = await db
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .in(
        "employee_id",
        admins.map((a) => a.id)
      );
    if (subsErr || !subs || subs.length === 0) {
      await logAction(DEBUG_ADMIN_ID, "[debug push]", `sin suscripciones — error: ${subsErr?.message ?? "ninguna"}`);
      return;
    }

    await logAction(DEBUG_ADMIN_ID, "[debug push]", `intentando enviar a ${subs.length} suscripción(es): ${payload.title}`);

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webPush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload));
          await logAction(DEBUG_ADMIN_ID, "[debug push]", `OK · ${s.endpoint.slice(0, 40)}`);
        } catch (err) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          await logAction(DEBUG_ADMIN_ID, "[debug push]", `FAIL ${statusCode} · ${s.endpoint.slice(0, 40)} · ${err instanceof Error ? err.message : String(err)}`);
          if (statusCode === 404 || statusCode === 410) {
            await deletePushSubscription(s.endpoint);
          } else {
            console.error("[push] no se pudo enviar:", err instanceof Error ? err.message : err);
          }
        }
      })
    );
  } catch (err) {
    await logAction(DEBUG_ADMIN_ID, "[debug push]", `error inesperado: ${err instanceof Error ? err.message : String(err)}`);
    console.error("[push] error inesperado:", err instanceof Error ? err.message : err);
  }
}
