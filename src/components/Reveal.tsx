"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Envuelve cualquier bloque para que aparezca con fade-up al entrar en
 * pantalla. Con prefers-reduced-motion activo, el CSS (globals.css) nunca
 * llega a ocultar el bloque, así que este componente no necesita saber
 * nada sobre esa preferencia — evita descoordinar el HTML del servidor
 * con el del cliente en el primer render.
 */
export function Reveal({
  children,
  className = "",
  as: Tag = "div",
  style,
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!("IntersectionObserver" in window)) {
      el.classList.add("is-visible");
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Component = Tag;
  return (
    <Component
      ref={ref as never}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={style}
    >
      {children}
    </Component>
  );
}
