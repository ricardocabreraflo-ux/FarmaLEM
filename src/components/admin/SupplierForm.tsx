"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createSupplierForm, type SupplierFormState } from "@/app/admin/proveedores/actions";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

export function SupplierForm() {
  const [state, formAction, pending] = useActionState<SupplierFormState | undefined, FormData>(createSupplierForm, undefined);

  return (
    <form action={formAction} className="mt-6 flex max-w-[440px] flex-col gap-4">
      <label className="block text-[0.85rem] font-semibold text-admin-ink">
        Nombre
        <input name="name" required className={inputClass} />
      </label>
      <label className="block text-[0.85rem] font-semibold text-admin-ink">
        Contacto (opcional)
        <input name="contact" className={inputClass} />
      </label>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Link href="/admin/proveedores" className="rounded-full border border-admin-border px-5 py-2.5 text-[0.86rem] font-semibold text-admin-ink-soft">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-admin-primary px-6 py-2.5 text-[0.86rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}
