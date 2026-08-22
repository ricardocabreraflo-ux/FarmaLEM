"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { setOrderStatus, type OrderStatus } from "@/lib/orders";

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  await requireAdminSession();
  await setOrderStatus(orderId, status);
  revalidatePath("/admin");
}
