"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/lib/cart-context";

/** Vacía el carrito una vez que el pedido ya quedó registrado (evita duplicarlo si el cliente regresa). */
export function ClearCartOnMount() {
  const { clear } = useCart();
  const cleared = useRef(false);

  useEffect(() => {
    if (cleared.current) return;
    cleared.current = true;
    clear();
  }, [clear]);

  return null;
}
