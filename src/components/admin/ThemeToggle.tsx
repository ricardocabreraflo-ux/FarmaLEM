"use client";

import { useEffect, useState } from "react";
import { IconMoon, IconSun } from "@/components/admin/nav-icons";

const STORAGE_KEY = "farmalem-admin-theme";

export function ThemeToggle() {
  // Se lee del DOM (ya lo dejó el script inline de layout.tsx antes del primer paint) en vez de useState+useEffect,
  // para no forzar un re-render que desincronice el ícono del tema real aplicado.
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const current = document.documentElement.dataset.theme;
    const resolved = current === "dark" ? "dark" : current === "light" ? "light" : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    // Lee el tema real (DOM / preferencia del sistema) tras montar — no se puede leer en el
    // initializer de useState sin desincronizar el render de servidor y causar un mismatch de hidratación.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(resolved);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Cambiar a modo día" : "Cambiar a modo noche"}
      title={theme === "dark" ? "Modo día" : "Modo noche"}
      className="grid h-10 w-10 place-items-center rounded-lg text-admin-ink-soft hover:bg-admin-primary-soft"
    >
      {theme === "dark" ? <IconSun className="h-5 w-5" /> : <IconMoon className="h-5 w-5" />}
    </button>
  );
}
