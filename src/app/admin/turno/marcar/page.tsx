import type { Metadata } from "next";
import { cookies } from "next/headers";
import { listProfiles } from "@/lib/profiles";
import { trustCookieName, verifyTrustToken } from "@/lib/admin-auth";
import { MarcarKiosk, type MarcarShiftInfo } from "@/components/admin/MarcarKiosk";

export const metadata: Metadata = { title: "Marcar entrada/salida" };
export const dynamic = "force-dynamic";

const SHIFTS = ["Matutino", "Vespertino"] as const;

export default async function MarcarPage() {
  const [employees, store] = await Promise.all([listProfiles(), cookies()]);

  const shifts: MarcarShiftInfo[] = SHIFTS.map((shift) => {
    const matches = employees.filter((e) => e.role === "employee" && e.active && e.shift === shift);
    const employee = matches.length === 1 ? matches[0] : null;
    const trust = verifyTrustToken(store.get(trustCookieName(shift))?.value);
    const trusted = Boolean(employee && trust && trust.employeeId === employee.id);
    return {
      shift,
      firstName: employee ? employee.full_name.trim().split(/\s+/)[0] : null,
      ready: Boolean(employee && trusted && employee.clock_pin_hash),
    };
  });

  return (
    <div className="min-h-screen bg-admin-bg">
      <MarcarKiosk shifts={shifts} />
    </div>
  );
}
