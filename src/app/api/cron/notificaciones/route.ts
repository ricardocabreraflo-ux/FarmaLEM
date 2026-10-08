import { NextRequest, NextResponse } from "next/server";
import { notifyToldoAbrir, notifyToldoCerrar, notifyLuces, notifyBonoSemanal, notifyCaducidadMensual } from "@/lib/cron-notifications";

export const dynamic = "force-dynamic";

/**
 * A esta ruta le pega pg_cron (vía pg_net.http_post, ver migración de cron
 * jobs) para disparar los recordatorios programados — se reusa el propio
 * servidor de Next.js en vez de una Edge Function de Supabase porque aquí ya
 * están configuradas las llaves VAPID/web-push. Protegida con un secreto
 * compartido (CRON_SECRET) en vez de sesión, porque quien llama no es un
 * navegador con cookie.
 */
const HANDLERS: Record<string, () => Promise<void>> = {
  toldo_abrir: notifyToldoAbrir,
  toldo_cerrar: notifyToldoCerrar,
  luces: notifyLuces,
  bono_semanal: notifyBonoSemanal,
  caducidad_mensual: notifyCaducidadMensual,
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const kind = req.nextUrl.searchParams.get("kind") ?? "";
  const handler = HANDLERS[kind];
  if (!handler) return NextResponse.json({ error: "kind inválido" }, { status: 400 });

  try {
    await handler();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[cron]", kind, err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "error interno" }, { status: 500 });
  }
}
