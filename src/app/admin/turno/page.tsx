import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { listProfiles } from "@/lib/profiles";
import { trustCookieName, verifyTrustToken } from "@/lib/admin-auth";
import { ShiftLoginScreen, type ShiftInfo } from "@/components/admin/ShiftLoginScreen";

export const metadata: Metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

const SHIFTS = ["Matutino", "Vespertino"] as const;

export default async function TurnoPage() {
  const [employees, store] = await Promise.all([listProfiles(), cookies()]);

  const shifts: ShiftInfo[] = SHIFTS.map((shift) => {
    const matches = employees.filter((e) => e.role === "employee" && e.active && e.shift === shift);
    const employee = matches.length === 1 ? matches[0] : null;
    const trust = verifyTrustToken(store.get(trustCookieName(shift))?.value);
    const trusted = Boolean(employee && trust && trust.employeeId === employee.id && employee.clock_pin_hash);
    return {
      shift,
      employeeId: employee?.id ?? null,
      firstName: employee ? employee.full_name.trim().split(/\s+/)[0] : null,
      trusted,
    };
  });

  return (
    <div className="min-h-screen bg-admin-bg">
      <ShiftLoginScreen shifts={shifts} />
      <p className="pb-8 text-center">
        <Link href="/admin/login" className="text-[0.8rem] font-semibold text-admin-ink-soft hover:underline">
          ¿Eres administración? Entra aquí
        </Link>
      </p>
    </div>
  );
}
