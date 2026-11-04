import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";
import { confirmOperationalTask } from "@/lib/operational-tasks";
import { mexicoCityToday } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * A esta ruta le pega el botón "Ya lo hice" de la notificación (desde el
 * service worker, ver sw.js) — por eso usa la cookie de sesión normal en vez
 * de requireSession(), que redirige en vez de regresar un error cuando no
 * hay un navegador detrás esperando esa redirección.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const store = await cookies();
  const session = verifySessionToken(store.get(ADMIN_COOKIE_NAME)?.value);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const taskKey = String(body.taskKey ?? "");
  const checkDate = String(body.checkDate ?? "").trim() || mexicoCityToday();

  const result = await confirmOperationalTask(taskKey, checkDate, session.uid);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
