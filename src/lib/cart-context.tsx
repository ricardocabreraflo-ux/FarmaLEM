"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Producto } from "@/lib/productos";

export interface CartItem {
  productId: string;
  nombre: string;
  marca: string;
  precio: number;
  cantidad: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (producto: Producto, cantidad?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, cantidad: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "farmalem-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // localStorage no existe en el servidor, así que el carrito no se puede
    // restaurar en un initializer perezoso sin desincronizar el HTML del
    // servidor del primer render del cliente. Esta sí es una sincronización
    // legítima desde un sistema externo (la excepción que la regla permite),
    // no un cálculo que debería vivir en el render.
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage no disponible (modo privado, etc.) — el carrito solo
      // vive en memoria durante la sesión.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ver comentario arriba
    }
  }, [items, hydrated]);

  const addItem = useCallback((producto: Producto, cantidad = 1) => {
    setItems((prev) => {
      const existing = prev.find((it) => it.productId === producto.id);
      if (existing) {
        return prev.map((it) =>
          it.productId === producto.id ? { ...it, cantidad: it.cantidad + cantidad } : it
        );
      }
      return [
        ...prev,
        {
          productId: producto.id,
          nombre: producto.nombre,
          marca: producto.marca,
          precio: producto.precio,
          cantidad,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((it) => it.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, cantidad: number) => {
    setItems((prev) => {
      if (cantidad <= 0) return prev.filter((it) => it.productId !== productId);
      return prev.map((it) => (it.productId === productId ? { ...it, cantidad } : it));
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const { count, subtotal } = useMemo(
    () => ({
      count: items.reduce((sum, it) => sum + it.cantidad, 0),
      subtotal: items.reduce((sum, it) => sum + it.cantidad * it.precio, 0),
    }),
    [items]
  );

  const value = useMemo(
    () => ({ items, addItem, removeItem, setQuantity, clear, count, subtotal }),
    [items, addItem, removeItem, setQuantity, clear, count, subtotal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}
