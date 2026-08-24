import "server-only";
import { listCuts } from "@/lib/cuts";
import { listWithdrawals } from "@/lib/withdrawals";
import { listPurchases } from "@/lib/purchases";
import { listFinanceMovementsForMonth } from "@/lib/finance-movements";
import { listAttendanceForMonth } from "@/lib/attendance";
import { listBonusWeeks, listBonusTiers, earnedBonus } from "@/lib/bonuses";
import { listExtraBonuses } from "@/lib/extra-bonuses";
import { listProfiles } from "@/lib/profiles";

const PAID_ATTENDANCE = new Set(["Asistió", "Cubrió turno"]);

export interface MonthlyFinancials {
  sales: number;
  otherIncome: number;
  purchaseCosts: number;
  manualCosts: number;
  cogs: number;
  gross: number;
  cashExpenses: number;
  manualExpenses: number;
  salaries: number;
  bonuses: number;
  extraBonusesTotal: number;
  /** Sueldos + bonos + gastos de caja + otros gastos operativos: los "costos fijos" del mes para el punto de equilibrio. */
  operating: number;
  shrinkage: number;
  netBeforeShrinkage: number;
  net: number;
}

/** Calcula el estado de resultados del mes. Fuente única para /admin/finanzas y /admin/punto-equilibrio. */
export async function getMonthlyFinancials(month: string): Promise<MonthlyFinancials> {
  const [employees, allCuts, allWithdrawals, allPurchases, movements, attendance, weeks, tiers, extraBonuses] = await Promise.all([
    listProfiles(),
    listCuts(),
    listWithdrawals(),
    listPurchases(),
    listFinanceMovementsForMonth(month),
    listAttendanceForMonth(month),
    listBonusWeeks(month),
    listBonusTiers(month),
    listExtraBonuses(),
  ]);
  const monthExtraBonuses = extraBonuses.filter((b) => b.month === month);

  const approvedCuts = allCuts.filter((c) => c.status === "Aprobado" && c.cut_date.startsWith(month));
  const authorizedWithdrawals = allWithdrawals.filter((w) => w.authorized_by && w.withdrawal_date.startsWith(month));
  const monthPurchases = allPurchases.filter((p) => p.purchase_date.startsWith(month));
  const activeEmployees = employees.filter((e) => e.role === "employee" && e.active);

  const sales = approvedCuts.reduce((sum, c) => sum + c.total, 0);
  const otherIncome = movements.filter((m) => m.type === "Ingreso").reduce((sum, m) => sum + m.amount, 0);
  const purchaseCosts = monthPurchases.reduce((sum, p) => sum + p.quantity * p.cost, 0);
  const manualCosts = movements.filter((m) => m.type === "Costo de venta").reduce((sum, m) => sum + m.amount, 0);
  const cogs = purchaseCosts + manualCosts;
  const cashExpenses = authorizedWithdrawals.filter((w) => w.type === "Gasto" || w.type === "Otro").reduce((sum, w) => sum + w.amount, 0);
  const manualExpenses = movements.filter((m) => m.type === "Gasto operativo").reduce((sum, m) => sum + m.amount, 0);
  const salaries = activeEmployees.reduce(
    (sum, e) => sum + attendance.filter((a) => a.employee_id === e.id && PAID_ATTENDANCE.has(a.status)).reduce((s, a) => s + a.rate, 0),
    0
  );
  const bonuses = weeks.reduce((sum, w) => sum + earnedBonus(w, tiers), 0);
  const extraBonusesTotal = monthExtraBonuses.reduce((sum, b) => sum + b.amount, 0);
  const shrinkage = movements.filter((m) => m.type === "Merma").reduce((sum, m) => sum + m.amount, 0);

  const gross = sales + otherIncome - cogs;
  const operating = cashExpenses + manualExpenses + salaries + bonuses + extraBonusesTotal;
  const netBeforeShrinkage = gross - operating;
  const net = netBeforeShrinkage - shrinkage;

  return { sales, otherIncome, purchaseCosts, manualCosts, cogs, gross, cashExpenses, manualExpenses, salaries, bonuses, extraBonusesTotal, operating, shrinkage, netBeforeShrinkage, net };
}
