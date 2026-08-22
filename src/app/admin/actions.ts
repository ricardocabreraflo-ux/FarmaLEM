"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { setOrderStatus, type OrderStatus } from "@/lib/orders";
import { logAction } from "@/lib/history";

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const session = await requireAdminSession();
  await setOrderStatus(orderId, status);
  await logAction(session.uid, "Cambió estado de pedido", `#${orderId.slice(0, 8).toUpperCase()} → ${status}`);
  revalidatePath("/admin");
}
