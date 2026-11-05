import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";
import { listRecurringPopupPromotionsWithImages } from "@/lib/promotions";

export const dynamic = "force-dynamic";

/** El popup de promociones (PromotionPopup) la consulta cada rato desde cualquier pantalla del panel. */
export async function GET(): Promise<NextResponse> {
  const store = await cookies();
  const session = verifySessionToken(store.get(ADMIN_COOKIE_NAME)?.value);
  if (!session) return NextResponse.json({ promotions: [] });

  const promotions = await listRecurringPopupPromotionsWithImages();
  return NextResponse.json({
    promotions: promotions.map((p) => ({ id: p.id, title: p.title, description: p.description, imageUrl: p.imageUrl })),
  });
}
