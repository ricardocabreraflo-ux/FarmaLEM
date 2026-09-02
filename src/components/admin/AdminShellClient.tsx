"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/admin/login/actions";
import { ThemeToggle } from "@/components/admin/ThemeToggle";
import type { ProfileRole } from "@/lib/admin-auth";
import type { ResolvedGroup, ResolvedNavEntry } from "@/lib/panel-modules";
import {
  IconAsistencia,
  IconAyuda,
  IconBalance,
  IconBonoExtra,
  IconBonoSemanal,
  IconCaja,
  IconCalendario,
  IconChevronDown,
  IconCompras,
  IconCortes,
  IconEmpleados,
  IconFinanzas,
  IconGastos,
  IconHistorial,
  IconInicio,
  IconInventario,
  IconLogout,
  IconMenu,
  IconMercancia,
  IconPedidos,
  IconProveedores,
  IconReloj,
  IconSalidas,
  IconSettings,
  IconSliders,
  IconSueldos,
  IconVentas,
} from "@/components/admin/nav-icons";

type IconComponent = (props: { className?: string }) => React.ReactElement;

const ICONS: Record<string, IconComponent> = {
  IconAsistencia,
  IconAyuda,
  IconBalance,
  IconBonoExtra,
  IconBonoSemanal,
  IconCaja,
  IconCalendario,
  IconCompras,
  IconCortes,
  IconEmpleados,
  IconFinanzas,
  IconGastos,
  IconHistorial,
  IconInicio,
  IconInventario,
  IconMercancia,
  IconPedidos,
  IconProveedores,
  IconReloj,
  IconSalidas,
  IconSettings,
  IconSliders,
  IconSueldos,
  IconVentas,
};

function iconFor(key: string): IconComponent {
  return ICONS[key] ?? IconSettings;
}

const AUTO_COLLAPSE_MS = 6000;
const MOBILE_BREAKPOINT = 1024;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function AdminShellClient({
  navItems,
  activeHref,
  userName,
  userRole,
  children,
}: {
  navItems: ResolvedNavEntry[];
  activeHref: string;
  userName: string;
  userRole: ProfileRole;
  children: React.ReactNode;
}) {
  const isAdmin = userRole === "admin";
  const activeGroup = navItems.find((e) => e.type === "group" && e.items.some((i) => i.href === activeHref)) as ResolvedGroup | undefined;

  const [collapsed, setCollapsed] = useState(false);
  // Acordeón: solo un grupo abierto a la vez.
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroup?.key ?? null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearAutoCollapse() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function scheduleAutoCollapse() {
    clearAutoCollapse();
    // Solo se auto-oculta en celular: en escritorio hay espacio de sobra y se
    // queda fija como el usuario la dejó.
    if (typeof window !== "undefined" && window.innerWidth >= MOBILE_BREAKPOINT) return;
    timerRef.current = setTimeout(() => setCollapsed(true), AUTO_COLLAPSE_MS);
  }

  useEffect(() => {
    if (!collapsed) scheduleAutoCollapse();
    else clearAutoCollapse();
    return clearAutoCollapse;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed]);

  function expand() {
    setCollapsed(false);
  }

  function selectGroup(id: string) {
    setOpenGroup((prev) => (prev === id ? null : id));
    expand();
  }

  function handleNavigate() {
    if (typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT) setCollapsed(true);
  }

  return (
    <div className="min-h-screen bg-admin-bg text-admin-ink">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-admin-border bg-admin-surface px-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => (collapsed ? expand() : setCollapsed(true))}
            aria-label={collapsed ? "Abrir menú" : "Cerrar menú"}
            aria-expanded={!collapsed}
            className="grid h-11 w-11 place-items-center rounded-lg text-admin-ink-soft hover:bg-admin-primary-soft"
          >
            <IconMenu className="h-7 w-7" />
          </button>
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="FarmaLEM" width={32} height={32} className="h-8 w-8 object-contain" priority />
            <strong className="font-display text-[1.05rem] text-admin-ink">FarmaLEM</strong>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[0.85rem]">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-admin-primary text-[0.78rem] font-bold text-white">{initials(userName)}</span>
            <span className="hidden text-admin-ink-soft sm:inline">
              {userName} &middot; {isAdmin ? "Administración" : "Equipo"}
            </span>
          </div>
          <ThemeToggle />
          <form action={logout}>
            <button
              type="submit"
              aria-label="Salir"
              title="Salir"
              className="grid h-10 w-10 place-items-center rounded-lg text-admin-bad-text hover:bg-admin-bad-bg"
            >
              <IconLogout className="h-5 w-5" />
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1180px] items-start">
        <nav
          aria-label="Navegación del panel"
          onMouseEnter={clearAutoCollapse}
          onMouseLeave={() => !collapsed && scheduleAutoCollapse()}
          className={`sticky top-16 flex h-[calc(100vh-4rem)] shrink-0 flex-col gap-1.5 overflow-x-hidden overflow-y-auto border-r border-admin-border bg-admin-bg py-4 transition-[width] duration-200 ${
            collapsed ? "w-[68px] items-center px-2" : "w-[248px] px-3"
          }`}
        >
          {navItems.map((entry) => {
            if (entry.type === "leaf") {
              const Icon = iconFor(entry.iconKey);
              const active = entry.href === activeHref;
              return (
                <Link
                  key={entry.key}
                  href={entry.href}
                  onClick={handleNavigate}
                  title={collapsed ? entry.label : undefined}
                  aria-label={entry.label}
                  className={
                    collapsed
                      ? `grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-colors ${
                          active ? "bg-admin-primary-soft text-admin-primary-deep" : "text-admin-ink-soft hover:bg-admin-primary-soft hover:text-admin-primary-deep"
                        }`
                      : `flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-[1.05rem] font-bold shadow-sm transition-all ${
                          active
                            ? "border-admin-primary bg-admin-primary-soft text-admin-primary-deep"
                            : "border-admin-border bg-admin-surface text-admin-ink hover:-translate-y-0.5 hover:shadow-md"
                        }`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && entry.label}
                </Link>
              );
            }

            const items = entry.items;
            const Icon = iconFor(entry.iconKey);
            const active = items.some((i) => i.href === activeHref);
            const open = !collapsed && openGroup === entry.key;

            if (collapsed) {
              return (
                <button
                  key={entry.key}
                  type="button"
                  onClick={() => selectGroup(entry.key)}
                  title={entry.label}
                  aria-label={entry.label}
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-colors ${
                    active ? "bg-admin-primary-soft text-admin-primary-deep" : "text-admin-ink-soft hover:bg-admin-primary-soft hover:text-admin-primary-deep"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </button>
              );
            }

            return (
              <div key={entry.key} className="w-full">
                <button
                  type="button"
                  onClick={() => selectGroup(entry.key)}
                  aria-expanded={open}
                  className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-[1.05rem] font-bold shadow-sm transition-all ${
                    open ? "border-admin-primary bg-admin-primary-soft text-admin-primary-deep" : "border-admin-border bg-admin-surface text-admin-ink hover:-translate-y-0.5 hover:shadow-md"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="flex-1 text-left">{entry.label}</span>
                  <IconChevronDown className={`h-5 w-5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {open && (
                  <div className="mt-1.5 mb-1 flex flex-col gap-1 pl-4">
                    {items.map((item) => {
                      const ItemIcon = iconFor(item.iconKey);
                      const itemActive = item.href === activeHref;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleNavigate}
                          className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[0.92rem] font-semibold transition-colors ${
                            itemActive ? "bg-admin-primary-soft text-admin-primary-deep" : "text-admin-ink-soft hover:bg-admin-primary-soft hover:text-admin-primary-deep"
                          }`}
                        >
                          <ItemIcon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <main className="min-w-0 flex-1 px-5 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
