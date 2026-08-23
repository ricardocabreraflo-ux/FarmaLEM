"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/admin/login/actions";
import type { ProfileRole } from "@/lib/admin-auth";

interface NavItem {
  href: string;
  label: string;
  adminOnly?: boolean;
}

// Según se vayan construyendo las demás fases (Cortes, Empleados, Sueldos...)
// solo hace falta agregar su entrada aquí para que aparezcan en el menú.
const NAV: NavItem[] = [
  { href: "/admin", label: "Pedidos", adminOnly: true },
  { href: "/admin/cortes", label: "Cortes" },
  { href: "/admin/salidas", label: "Salidas de efectivo" },
  { href: "/admin/proveedores", label: "Proveedores", adminOnly: true },
  { href: "/admin/asistencia", label: "Asistencia", adminOnly: true },
  { href: "/admin/sueldos", label: "Sueldos y salarios", adminOnly: true },
  { href: "/admin/bonos", label: "Bonos semanales", adminOnly: true },
  { href: "/admin/bonos-extra", label: "Bonos extraordinarios", adminOnly: true },
  { href: "/admin/compras", label: "Recepción de mercancía", adminOnly: true },
  { href: "/admin/inventario", label: "Inventario", adminOnly: true },
  { href: "/admin/ventas", label: "Comparativa de ventas", adminOnly: true },
  { href: "/admin/finanzas", label: "Estado de resultados", adminOnly: true },
  { href: "/admin/empleados", label: "Empleados", adminOnly: true },
  { href: "/admin/historial", label: "Historial", adminOnly: true },
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
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-admin-primary text-base font-bold text-white">+</span>
            <strong className="font-display text-[1.05rem] text-admin-ink">FarmaLEM</strong>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[0.85rem]">
          <span className="hidden text-admin-ink-soft sm:inline">
            {userName} &middot; {userRole === "admin" ? "Administración" : "Equipo"}
          </span>
          <form action={logout}>
            <button type="submit" className="font-semibold text-admin-ink-soft hover:text-admin-primary">
              Salir
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1180px] items-start">
        <nav
          aria-label="Navegación del panel"
          className={`${menuOpen ? "flex" : "hidden"} fixed inset-x-0 top-16 bottom-0 z-10 flex-col gap-1 overflow-y-auto border-r border-admin-border bg-admin-surface p-4 lg:sticky lg:top-16 lg:flex lg:h-[calc(100vh-4rem)] lg:w-[220px] lg:shrink-0`}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`rounded-lg px-3.5 py-2.5 text-[0.9rem] font-semibold transition-colors ${
                item.href === activeHref ? "bg-admin-primary-soft text-admin-primary-deep" : "text-admin-ink-soft hover:bg-admin-primary-soft hover:text-admin-primary-deep"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="min-w-0 flex-1 px-5 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
