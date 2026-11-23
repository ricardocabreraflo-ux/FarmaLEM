"use server";

import { revalidatePath } from "next/cache";
import { requireSession, requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { ackAnnouncement, getAnnouncementTitle } from "@/lib/announcements";
import { unmarkTaskDone } from "@/lib/operational-tasks";
import { logAction } from "@/lib/history";
import { sendPushToAdmins } from "@/lib/push";

export interface AckAnnouncementResult {
  ok: boolean;
  error?: string;
}

export async function ackAnnouncementAction(announcementId: string): Promise<AckAnnouncementResult> {
  const session = await requireSession();
  try {
    await ackAnnouncement(announcementId, session.uid);
    const [profile, title] = await Promise.all([getProfileById(session.uid), getAnnouncementTitle(announcementId)]);
    await sendPushToAdmins({
      title: "✅ Novedad confirmada",
      body: `${profile?.full_name ?? "Alguien"} ya vio: ${title ?? "un anuncio"}`,
      url: "/admin/inicio",
    });
    revalidatePath("/admin/inicio");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo guardar." };
  }
}

export interface UnmarkActivityResult {
  ok: boolean;
  error?: string;
}

/** Quita el "Hecho" de una actividad del día (se marcó por error) — vuelve a aparecer como pendiente para quien la confirma. */
export async function unmarkActivityAction(taskKey: string, checkDate: string, label: string): Promise<UnmarkActivityResult> {
  const session = await requireAdminSession();
  try {
    await unmarkTaskDone(taskKey, checkDate);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "No se pudo desmarcar." };
  }
  await logAction(session.uid, "Desmarcó actividad del día", `${label} · ${checkDate}`);
  revalidatePath("/admin/inicio");
  return { ok: true };
}
