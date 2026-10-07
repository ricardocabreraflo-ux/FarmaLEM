"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { ackAnnouncement, getAnnouncementTitle } from "@/lib/announcements";
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
