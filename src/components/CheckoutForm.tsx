"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { startCheckout } from "@/app/checkout/actions";

export function CheckoutForm() {
  const { items, subtotal } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <h2 className="font-display text-xl text-ink">No hay nada que cobrar todavía</h2>
        <p className="mt-2 max-w-[42ch] text-ink-soft">Agrega productos a tu carrito antes de pagar.</p>
        <Link
          href="/#promociones"
          className="mt-6 rounded-full bg-blue-strong px-6 py-3 font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          Ver promociones
        </Link>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await startCheckout({ customerName, customerPhone, notes, items });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
        <div>
          <label htmlFor="customerName" className="text-[0.85rem] font-semibold text-ink">
            Nombre completo
          </label>
          <input
            id="customerName"
            required
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-blue-pale px-4 py-2.5 text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
            placeholder="Como aparece en tu identificación"
          />
        </div>
        <div>
          <label htmlFor="customerPhone" className="text-[0.85rem] font-semibold text-ink">
            Teléfono (10 dígitos)
          </label>
          <input
            id="customerPhone"
            required
            inputMode="numeric"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-blue-pale px-4 py-2.5 text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
            placeholder="55 0000 0000"
          />
          <p className="mt-1 text-[0.76rem] text-ink-soft">Te avisamos por aquí cuando tu pedido esté listo.</p>
        </div>
        <div>
          <label htmlFor="notes" className="text-[0.85rem] font-semibold text-ink">
            Notas (opcional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-1.5 w-full resize-none rounded-lg border border-line bg-blue-pale px-4 py-2.5 text-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue"
            placeholder="Ej. sustituciones aceptadas, horario en que pasas por tu pedido…"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-urgency-soft px-4 py-3 text-[0.85rem] text-urgency-strong">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-full bg-turquoise py-3.5 font-bold text-[#06322F] transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
        >
          {pending ? "Preparando tu pago…" : "Pagar con Mercado Pago"}
        </button>
        <p className="text-center text-[0.76rem] text-ink-soft">
          Te llevamos a Mercado Pago para completar el pago de forma segura.
        </p>
      </form>

      <aside className="h-fit rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-display text-lg text-ink">Tu pedido</h2>
        <ul className="mt-4 flex flex-col gap-3 border-t border-dashed border-line pt-4">
          {items.map((item) => (
            <li key={item.productId} className="flex items-baseline justify-between gap-3 text-[0.86rem]">
              <span className="text-ink">
                {item.cantidad}&times; {item.nombre}
              </span>
              <span className="shrink-0 font-data tabular-nums text-ink-soft">
                ${(item.precio * item.cantidad).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t border-dashed border-line pt-4">
          <span className="text-ink-soft">Total</span>
          <span className="font-data text-xl font-bold tabular-nums text-ink">${subtotal.toFixed(2)}</span>
        </div>
      </aside>
    </div>
  );
}
