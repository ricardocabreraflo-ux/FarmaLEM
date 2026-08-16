"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/app/admin/actions";
import type { Order, OrderItemRow, OrderStatus } from "@/lib/orders";

const STATUS_LABEL: Record<OrderStatus, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  listo_para_recoger: "Listo para recoger",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  pendiente_pago: "bg-blue-pale text-blue",
  pagado: "bg-turquoise-soft text-turquoise-deep",
  listo_para_recoger: "bg-turquoise text-[#06322F]",
  entregado: "bg-blue-deep text-white",
  cancelado: "bg-urgency-soft text-urgency-strong",
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pagado: ["listo_para_recoger", "cancelado"],
  listo_para_recoger: ["entregado", "cancelado"],
  pendiente_pago: ["cancelado"],
};

type OrderWithItems = Order & { order_items: OrderItemRow[] };

export function OrdersList({ orders }: { orders: OrderWithItems[] }) {
  if (orders.length === 0) {
    return <p className="rounded-2xl border border-line bg-surface p-8 text-center text-ink-soft">Todavía no hay pedidos.</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </ul>
  );
}

function OrderCard({ order }: { order: OrderWithItems }) {
  const [pending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState(order.status);
  const nextOptions = NEXT_STATUS[optimisticStatus] ?? [];

  return (
    <li className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="font-data text-[0.72rem] text-ink-soft">
            #{order.id.slice(0, 8).toUpperCase()} &middot; {new Date(order.created_at).toLocaleString("es-MX")}
          </span>
          <h3 className="mt-0.5 font-body text-[1.02rem] font-bold text-ink">{order.customer_name}</h3>
          <a href={`tel:+52${order.customer_phone}`} className="text-[0.86rem] text-ink-soft hover:text-blue">
            {order.customer_phone}
          </a>
          {order.notes && <p className="mt-1 text-[0.82rem] italic text-ink-soft">“{order.notes}”</p>}
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-[0.76rem] font-semibold ${STATUS_STYLE[optimisticStatus]}`}>
          {STATUS_LABEL[optimisticStatus]}
        </span>
      </div>

      <ul className="mt-3 flex flex-col gap-1 border-t border-dashed border-line pt-3">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex justify-between text-[0.86rem]">
            <span className="text-ink">
              {item.cantidad}&times; {item.nombre}
            </span>
            <span className="font-data tabular-nums text-ink-soft">${item.subtotal.toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-line pt-3">
        <span className="font-data text-lg font-bold tabular-nums text-ink">${order.total.toFixed(2)}</span>
        {nextOptions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {nextOptions.map((status) => (
              <button
                key={status}
                type="button"
                disabled={pending}
                onClick={() => {
                  setOptimisticStatus(status);
                  startTransition(async () => {
                    await updateOrderStatus(order.id, status);
                  });
                }}
                className="rounded-full border border-line px-4 py-1.5 text-[0.8rem] font-semibold text-ink transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-60"
              >
                Marcar {STATUS_LABEL[status].toLowerCase()}
              </button>
            ))}
          </div>
        )}
      </div>
    </li>
  );
}
