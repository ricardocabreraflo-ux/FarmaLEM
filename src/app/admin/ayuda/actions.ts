"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { setTutorialVisibility, getTutorial } from "@/lib/tutorials";
import { logAction } from "@/lib/history";

export async function toggleTutorialVisibility(slug: string, visible: boolean) {
  const session = await requireAdminSession();
  await setTutorialVisibility(slug, visible);
  const tutorial = await getTutorial(slug);
  await logAction(session.uid, visible ? "Mostró tutorial al equipo" : "Ocultó tutorial del equipo", tutorial?.title ?? slug);
  revalidatePath("/admin/ayuda");
}
