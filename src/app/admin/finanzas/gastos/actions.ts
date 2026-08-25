"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/admin-auth";
import { createExpenseTemplate, setExpenseTemplateActive, type ExpenseTemplateType } from "@/lib/expense-templates";
import { createFinanceMovement } from "@/lib/finance-movements";
import { logAction } from "@/lib/history";

export interface ExpenseTemplateFormState {
  error?: string;
}

export async function createExpenseTemplateForm(_prevState: ExpenseTemplateFormState | undefined, formData: FormData): Promise<ExpenseTemplateFormState> {
  const session = await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "") as ExpenseTemplateType;
  const category = String(formData.get("category") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);

  if (!name || !type || !category) return { error: "Nombre, tipo y categoría son obligatorios." };
  if (!(amount >= 0)) return { error: "El monto no puede ser negativo." };

  try {
    await createExpenseTemplate({ name, type, category, amount, createdBy: session.uid });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "No se pudo guardar el gasto recurrente." };
  }

  await logAction(session.uid, "Creó gasto recurrente", `${name} · ${type}`);
  revalidatePath("/admin/finanzas/gastos");
  redirect("/admin/finanzas/gastos");
}

export async function toggleExpenseTemplateAction(id: string, name: string, active: boolean) {
  const session = await requireAdminSession();
  await setExpenseTemplateActive(id, active);
  await logAction(session.uid, active ? "Reactivó gasto recurrente" : "Desactivó gasto recurrente", name);
  revalidatePath("/admin/finanzas/gastos");
}

export async function captureExpenseTemplateAction(templateId: string, name: string, type: ExpenseTemplateType, category: string, amount: number, month: string) {
  const session = await requireAdminSession();
  await createFinanceMovement({
    movementDate: `${month}-01`,
    type,
    category,
    concept: name,
    amount,
    createdBy: session.uid,
    templateId,
  });
  await logAction(session.uid, "Registró gasto del mes", `${name} · $${amount.toFixed(2)}`);
  revalidatePath("/admin/finanzas/gastos");
  revalidatePath("/admin/finanzas");
}
