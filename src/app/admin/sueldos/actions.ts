"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/admin-auth";
import { togglePayrollPaid } from "@/lib/payroll";

export async function togglePayrollAction(employeeId: string, month: string, currentlyPaid: boolean) {
  const session = await requireAdminSession();
  await togglePayrollPaid(employeeId, month, currentlyPaid, session.uid);
  revalidatePath("/admin/sueldos");
}
