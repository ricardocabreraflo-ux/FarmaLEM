"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/admin/login/actions";
import type { ProfileRole } from "@/lib/admin-auth";
import {
  IconAsistencia,
  IconBonoExtra,
  IconBonoSemanal,
  IconCaja,
  IconChevronDown,
  IconCompras,
  IconCortes,
  IconEmpleados,
  IconFinanzas,
  IconHistorial,
  IconInventario,
  IconLogout,
  IconMenu,
  IconMercancia,
  IconPedidos,
  IconProveedores,
  IconSalidas,
  IconSettings,
  IconSueldos,
  IconVentas,
} from "@/components/admin/nav-icons";

type IconComponent = (props: { className?: string }) => React.ReactElement;

interface NavLeaf {
  type: "leaf";
  href: string;
  label: string;
  icon: IconComponent;
  adminOnly?: boolean;
}

interface NavGroup {
  type: "group";
  id: string;
  label: string;
  icon: IconComponent;
  items: NavLeaf[];
}

type NavEntry = NavLeaf | NavGroup;

const leaf = (href: string, label: string, icon: IconComponent, adminOnly?: boolean): NavLeaf => ({ type: "leaf", href, label, icon, adminOnly });

// Estructura del menú: entradas sueltas arriba y abajo, agrupaciones al centro.
// Conforme se agreguen más pantallas, solo hace falta sumarlas aquí.
const NAV: NavEntry[] = [
  leaf("/admin", "Pedidos", IconPedidos, true),
  {
    type: "group",
    id: "caja",
    label: "Caja",
    icon: IconCaja,
    items: [leaf("/admin/cortes", "Cortes", IconCortes), leaf("/admin/salidas", "Salidas de efectivo", IconSalidas)],
  },
  {
    type: "group",
    id: "personal",
    label: "Personal",
    icon: IconEmpleados,
    items: [
      leaf("/admin/asistencia", "Asistencia", IconAsistencia, true),
      leaf("/admin/bonos-extra", "Bonos extraordinarios", IconBonoExtra, true),
      leaf("/admin/bonos", "Bonos semanales", IconBonoSemanal, true),
      leaf("/admin/empleados", "Empleados", IconEmpleados, true),
      leaf("/admin/sueldos", "Sueldos y salarios", IconSueldos, true),
    ],
  },
  {
    type: "group",
    id: "mercancia",
    label: "Mercancía",
    icon: IconMercancia,
    items: [
      leaf("/admin/inventario", "Inventario", IconInventario, true),
      leaf("/admin/proveedores", "Proveedores", IconProveedores, true),
      leaf("/admin/compras", "Recepción de mercancía", IconCompras, true),
    ],
  },
  {
    type: "group",
    id: "finanzas",
    label: "Finanzas",
    icon: IconFinanzas,
    items: [leaf("/admin/ventas", "Comparativa de ventas", IconVentas, true), leaf("/admin/finanzas", "Estado de resultados", IconFinanzas, true)],
  },
  leaf("/admin/historial", "Historial", IconHistorial, true),
  leaf("/admin/configuracion", "Configuración", IconSettings, true),
];

const AUTO_COLLAPSE_MS = 6000;
const MOBILE_BREAKPOINT = 1024;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function visibleGroupItems(group: NavGroup, isAdmin: boolean): NavLeaf[] {
  return group.items.filter((item) => !item.adminOnly || isAdmin);
}

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
  const isAdmin = userRole === "admin";
  const activeGroupId = NAV.find((e) => e.type === "group" && e.items.some((i) => i.href === activeHref)) as NavGroup | undefined;

  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(activeGroupId ? [activeGroupId.id] : []));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearAutoCollapse() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  function scheduleAutoCollapse() {
    clearAutoCollapse();
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

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function openGroupAndExpand(id: string) {
    setOpenGroups((prev) => new Set(prev).add(id));
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
        <div className="flex shrink-0" onMouseEnter={clearAutoCollapse} onMouseLeave={() => !collapsed && scheduleAutoCollapse()}>
        {/* Riel: siempre visible, solo íconos */}
        <nav
          aria-label="Navegación del panel (íconos)"
          className="sticky top-16 flex h-[calc(100vh-4rem)] w-[68px] shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-admin-border bg-admin-surface py-4"
        >
          {NAV.map((entry) => {
            if (entry.type === "leaf") {
              if (entry.adminOnly && !isAdmin) return null;
              const Icon = entry.icon;
              const active = entry.href === activeHref;
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  onClick={handleNavigate}
                  title={entry.label}
                  aria-label={entry.label}
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-colors ${
                    active ? "bg-admin-primary-soft text-admin-primary-deep" : "text-admin-ink-soft hover:bg-admin-primary-soft hover:text-admin-primary-deep"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </Link>
              );
            }
            const items = visibleGroupItems(entry, isAdmin);
            if (items.length === 0) return null;
            const Icon = entry.icon;
            const active = items.some((i) => i.href === activeHref);
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => openGroupAndExpand(entry.id)}
                title={entry.label}
                aria-label={entry.label}
                className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition-colors ${
                  active ? "bg-admin-primary-soft text-admin-primary-deep" : "text-admin-ink-soft hover:bg-admin-primary-soft hover:text-admin-primary-deep"
                }`}
              >
                <Icon className="h-6 w-6" />
              </button>
            );
          })}
        </nav>

        {/* Panel expandido: aparece al abrir el menú y se cierra solo tras un rato sin usarse */}
        {!collapsed && (
          <nav aria-label="Navegación del panel" className="sticky top-16 flex h-[calc(100vh-4rem)] w-[240px] shrink-0 flex-col gap-2 overflow-y-auto border-r border-admin-border bg-admin-bg p-3">
            {NAV.map((entry) => {
              if (entry.type === "leaf") {
                if (entry.adminOnly && !isAdmin) return null;
                const Icon = entry.icon;
                const active = entry.href === activeHref;
                return (
                  <Link
                    key={entry.href}
                    href={entry.href}
                    onClick={handleNavigate}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-[1.05rem] font-bold shadow-sm transition-all ${
                      active
                        ? "border-admin-primary bg-admin-primary-soft text-admin-primary-deep"
                        : "border-admin-border bg-admin-surface text-admin-ink hover:-translate-y-0.5 hover:shadow-md"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {entry.label}
                  </Link>
                );
              }

              const items = visibleGroupItems(entry, isAdmin);
              if (items.length === 0) return null;
              const Icon = entry.icon;
              const open = openGroups.has(entry.id);
              return (
                <div key={entry.id}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(entry.id)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 rounded-2xl border border-admin-border bg-admin-surface px-4 py-3.5 text-[1.05rem] font-bold text-admin-ink shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="flex-1 text-left">{entry.label}</span>
                    <IconChevronDown className={`h-5 w-5 shrink-0 text-admin-ink-soft transition-transform ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && (
                    <div className="mt-1.5 mb-1 flex flex-col gap-1 pl-4">
                      {items.map((item) => {
                        const ItemIcon = item.icon;
                        const active = item.href === activeHref;
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleNavigate}
                            className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-[0.92rem] font-semibold transition-colors ${
                              active ? "bg-admin-primary-soft text-admin-primary-deep" : "text-admin-ink-soft hover:bg-admin-primary-soft hover:text-admin-primary-deep"
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
        )}
        </div>

        <main className="min-w-0 flex-1 px-5 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
