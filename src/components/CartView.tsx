"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export function CartView() {
  const { items, setQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-14 w-14 text-ink-soft">
          <circle cx="9" cy="20" r="1.4" />
          <circle cx="17" cy="20" r="1.4" />
          <path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 7H5.2" />
        </svg>
        <h2 className="mt-5 font-display text-xl text-ink">Tu carrito está vacío</h2>
        <p className="mt-2 max-w-[42ch] text-ink-soft">
          Agrega productos desde las promociones activas para armar tu pedido.
        </p>
        <Link
          href="/#promociones"
          className="mt-6 rounded-full bg-blue-strong px-6 py-3 font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          Ver promociones
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-4"
          >
            <div className="min-w-0 flex-1">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wide text-ink-soft">
                {item.marca}
              </span>
              <h3 className="font-body text-[0.98rem] font-bold text-ink">{item.nombre}</h3>
              <span className="font-data text-[0.85rem] tabular-nums text-ink-soft">
                ${item.precio.toFixed(2)} c/u
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-line px-1">
              <button
                type="button"
                aria-label="Quitar una unidad"
                onClick={() => setQuantity(item.productId, item.cantidad - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-ink transition-transform duration-150 ease-out active:scale-[0.9]"
              >
                −
              </button>
              <span className="w-6 text-center font-data tabular-nums text-ink">{item.cantidad}</span>
              <button
                type="button"
                aria-label="Agregar una unidad"
                onClick={() => setQuantity(item.productId, item.cantidad + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-ink transition-transform duration-150 ease-out active:scale-[0.9]"
              >
                +
              </button>
            </div>

            <span className="font-data text-[1.02rem] font-bold tabular-nums text-ink">
              ${(item.precio * item.cantidad).toFixed(2)}
            </span>

            <button
              type="button"
              onClick={() => removeItem(item.productId)}
              aria-label={`Quitar ${item.nombre} del carrito`}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft transition-colors hover:text-urgency-strong"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13" strokeLinecap="round" />
              </svg>
            </button>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-display text-lg text-ink">Resumen</h2>
        <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-line pt-4">
          <span className="text-ink-soft">Subtotal</span>
          <span className="font-data text-xl font-bold tabular-nums text-ink">${subtotal.toFixed(2)}</span>
        </div>
        <p className="mt-2 text-[0.78rem] text-ink-soft">
          Pagas en línea y pasas a recoger tu pedido a la sucursal — no hay costo de envío.
        </p>
        <Link
          href="/checkout"
          className="mt-5 block rounded-full bg-turquoise py-3.5 text-center font-bold text-[#06322F] transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          Continuar al pago
        </Link>
      </aside>
    </div>
  );
}
