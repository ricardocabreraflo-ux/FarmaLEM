"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import type { Producto } from "@/lib/productos";

export function AddToCartButton({ producto }: { producto: Producto }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const disabled = producto.precio <= 0;

  if (disabled) {
    return (
      <span className="rounded-lg border border-line py-2 text-center text-[0.78rem] text-ink-soft">
        Próximamente
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        addItem(producto);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1400);
      }}
      className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-strong py-2 text-[0.82rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
      aria-live="polite"
    >
      {added ? (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-3.5 w-3.5">
            <path d="M5 12.5 10 17l9-10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Agregado
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="17" cy="20" r="1.4" />
            <path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 7H5.2" />
          </svg>
          Agregar
        </>
      )}
    </button>
  );
}
