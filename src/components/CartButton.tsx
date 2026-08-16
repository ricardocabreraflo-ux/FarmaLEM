"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

export function CartButton() {
  const { count } = useCart();

  return (
    <Link
      href="/carrito"
      aria-label={count > 0 ? `Carrito, ${count} producto${count === 1 ? "" : "s"}` : "Carrito"}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-strong text-white transition-transform duration-150 ease-out active:scale-[0.94]"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="17" cy="20" r="1.4" />
        <path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L20 7H5.2" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-urgency-strong px-1 font-data text-[0.65rem] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
