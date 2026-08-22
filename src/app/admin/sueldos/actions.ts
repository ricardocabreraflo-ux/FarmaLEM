"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { togglePayrollPaid } from "@/lib/payroll";
import { logAction } from "@/lib/history";

export async function togglePayrollAction(employeeId: string, month: string, currentlyPaid: boolean) {
  const session = await requireAdminSession();
  await togglePayrollPaid(employeeId, month, currentlyPaid, session.uid);
  await logAction(session.uid, "Cambió estado de nómina", `${month} · ${currentlyPaid ? "Pendiente" : "Pagado"}`);
  revalidatePath("/admin/sueldos");
}
