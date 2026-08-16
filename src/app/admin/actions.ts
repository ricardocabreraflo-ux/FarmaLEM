"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ADMIN_COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";
import { setOrderStatus, type OrderStatus } from "@/lib/orders";

async function assertAdmin() {
  const store = await cookies();
  if (!verifySessionToken(store.get(ADMIN_COOKIE_NAME)?.value)) {
    throw new Error("No autorizado.");
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await assertAdmin();
  await setOrderStatus(orderId, status);
  revalidatePath("/admin");
}
