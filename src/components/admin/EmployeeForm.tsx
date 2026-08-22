"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { EmployeeFormState } from "@/app/admin/empleados/actions";
import type { Profile } from "@/lib/profiles";

type Action = (prevState: EmployeeFormState | undefined, formData: FormData) => Promise<EmployeeFormState>;

export function EmployeeForm({ action, profile }: { action: Action; profile?: Profile }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isEdit = Boolean(profile);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nombre completo" htmlFor="fullName">
          <input id="fullName" name="fullName" required defaultValue={profile?.full_name} className={inputClass} />
        </Field>
        <Field label="Usuario" htmlFor="username">
          <input id="username" name="username" required defaultValue={profile?.username} className={inputClass} />
        </Field>
        <Field label={isEdit ? "Nueva contraseña (déjala vacía para conservarla)" : "Contraseña"} htmlFor="password">
          <input id="password" name="password" type="password" required={!isEdit} className={inputClass} />
        </Field>
        <Field label="Turno" htmlFor="shift">
          <select id="shift" name="shift" defaultValue={profile?.shift ?? "Matutino"} className={inputClass}>
            <option>Matutino</option>
            <option>Vespertino</option>
            <option>Administración</option>
          </select>
        </Field>
        <Field label="Rol" htmlFor="role">
          <select id="role" name="role" defaultValue={profile?.role ?? "employee"} className={inputClass}>
            <option value="employee">Empleado</option>
            <option value="admin">Administración</option>
          </select>
        </Field>
        <Field label="Estado" htmlFor="active">
          <select id="active" name="active" defaultValue={profile ? String(profile.active) : "true"} className={inputClass}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </Field>
        <Field label="Tarifa diaria" htmlFor="dailyRate">
          <input
            id="dailyRate"
            name="dailyRate"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={profile?.daily_rate ?? 150}
            className={inputClass}
          />
        </Field>
      </div>

      <p className="rounded-lg bg-admin-primary-soft px-4 py-3 text-[0.82rem] text-admin-primary-deep">
        Se paga por turno trabajado: esta tarifa es el valor que se sugiere en Asistencia, pero se puede ajustar día por día.
      </p>

      {state?.error && (
        <p role="alert" className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">
          {state.error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Link
          href="/admin/empleados"
          className="rounded-full border border-admin-border px-5 py-2.5 text-[0.86rem] font-semibold text-admin-ink-soft"
        >
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

const inputClass =
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-[0.85rem] font-semibold text-admin-ink">
      {label}
      {children}
    </label>
  );
}
