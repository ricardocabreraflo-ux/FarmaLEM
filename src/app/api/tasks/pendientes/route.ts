import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { getPendingTasksNow } from "@/lib/operational-tasks";
import { getPendingActivityNow } from "@/lib/activity-reminders";
import { getPendingDeepCleanNow } from "@/lib/deep-clean";

export const dynamic = "force-dynamic";

/** El popup de tareas pendientes (PendingTaskPopup) la consulta cada rato desde cualquier pantalla del panel. */
export async function GET(): Promise<NextResponse> {
  const store = await cookies();
  const session = verifySessionToken(store.get(ADMIN_COOKIE_NAME)?.value);
  if (!session) return NextResponse.json({ pending: [] });

  const profile = await getProfileById(session.uid);
  const [tasks, activities, deepClean] = await Promise.all([
    getPendingTasksNow(profile?.shift),
    getPendingActivityNow(profile?.shift),
    getPendingDeepCleanNow(profile?.shift),
  ]);
  return NextResponse.json({ pending: [...tasks, ...activities, ...deepClean] });
}
