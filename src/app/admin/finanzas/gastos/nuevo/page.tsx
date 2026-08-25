import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/admin-auth";
import { getProfileById } from "@/lib/profiles";
import { AdminShell } from "@/components/admin/AdminShell";
import { ExpenseTemplateForm } from "@/components/admin/ExpenseTemplateForm";

export const metadata: Metadata = { title: "Nuevo gasto recurrente" };
export const dynamic = "force-dynamic";

export default async function NewExpenseTemplatePage() {
  const session = await requireAdminSession();
  const profile = await getProfileById(session.uid);

  return (
    <AdminShell activeHref="/admin/finanzas/gastos" userName={profile?.full_name ?? "Sin nombre"} userRole={session.role}>
      <h1 className="font-display text-2xl text-admin-ink">Nuevo gasto recurrente</h1>
      <ExpenseTemplateForm />
    </AdminShell>
  );
}
