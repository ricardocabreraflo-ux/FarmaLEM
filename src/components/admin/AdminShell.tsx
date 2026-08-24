"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/admin/login/actions";
import type { ProfileRole } from "@/lib/admin-auth";
import {
  IconAsistencia,
  IconBonoExtra,
  IconBonoSemanal,
  IconCompras,
  IconCortes,
  IconEmpleados,
  IconFinanzas,
  IconHistorial,
  IconInventario,
  IconLogout,
  IconPedidos,
  IconProveedores,
  IconSalidas,
  IconSueldos,
  IconVentas,
} from "@/components/admin/nav-icons";

interface NavItem {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactElement;
  adminOnly?: boolean;
}

// Según se vayan construyendo las demás fases (Cortes, Empleados, Sueldos...)
// solo hace falta agregar su entrada aquí para que aparezcan en el menú.
// Se mantiene en orden alfabético por label.
const NAV: NavItem[] = [
  { href: "/admin/asistencia", label: "Asistencia", icon: IconAsistencia, adminOnly: true },
  { href: "/admin/bonos-extra", label: "Bonos extraordinarios", icon: IconBonoExtra, adminOnly: true },
  { href: "/admin/bonos", label: "Bonos semanales", icon: IconBonoSemanal, adminOnly: true },
  { href: "/admin/ventas", label: "Comparativa de ventas", icon: IconVentas, adminOnly: true },
  { href: "/admin/cortes", label: "Cortes", icon: IconCortes },
  { href: "/admin/empleados", label: "Empleados", icon: IconEmpleados, adminOnly: true },
  { href: "/admin/finanzas", label: "Estado de resultados", icon: IconFinanzas, adminOnly: true },
  { href: "/admin/historial", label: "Historial", icon: IconHistorial, adminOnly: true },
  { href: "/admin/inventario", label: "Inventario", icon: IconInventario, adminOnly: true },
  { href: "/admin", label: "Pedidos", icon: IconPedidos, adminOnly: true },
  { href: "/admin/proveedores", label: "Proveedores", icon: IconProveedores, adminOnly: true },
  { href: "/admin/compras", label: "Recepción de mercancía", icon: IconCompras, adminOnly: true },
  { href: "/admin/salidas", label: "Salidas de efectivo", icon: IconSalidas },
  { href: "/admin/sueldos", label: "Sueldos y salarios", icon: IconSueldos, adminOnly: true },
];

export function AdminShell({
  activeHref,
  userName,
  userRole,
  children,
}: {
  activeHref: string;
  userName: string;
  userRole: ProfileRole;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const items = NAV.filter((item) => !item.adminOnly || userRole === "admin");

  return (
    <div className="min-h-screen bg-admin-bg text-admin-ink">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-admin-border bg-admin-surface px-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Abrir menú"
            className="grid h-9 w-9 place-items-center rounded-lg text-lg text-admin-ink-soft hover:bg-admin-primary-soft lg:hidden"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="FarmaLEM" width={32} height={32} className="h-8 w-8 object-contain" priority />
            <strong className="font-display text-[1.05rem] text-admin-ink">FarmaLEM</strong>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[0.85rem]">
          <span className="hidden text-admin-ink-soft sm:inline">
            {userName} &middot; {userRole === "admin" ? "Administración" : "Equipo"}
          </span>
          <form action={logout}>
            <button
              type="submit"
              aria-label="Salir"
              title="Salir"
              className="grid h-9 w-9 place-items-center rounded-lg text-admin-ink-soft hover:bg-admin-bad-bg hover:text-admin-bad-text"
            >
              <IconLogout className="h-5 w-5" />
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1180px] items-start">
        <nav
          aria-label="Navegación del panel"
          className={`${menuOpen ? "flex" : "hidden"} fixed inset-x-0 top-16 bottom-0 z-10 flex-col gap-3 overflow-y-auto border-r border-admin-border bg-admin-bg p-4 lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-4rem)] lg:w-[280px] lg:shrink-0`}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-[1.15rem] font-bold shadow-sm transition-all ${
                  active
                    ? "border-admin-primary bg-admin-primary-soft text-admin-primary-deep"
                    : "border-admin-border bg-admin-surface text-admin-ink hover:-translate-y-0.5 hover:shadow-md"
                }`}
              >
                <Icon className="h-6 w-6 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <main className="min-w-0 flex-1 px-5 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
