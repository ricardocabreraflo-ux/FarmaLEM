"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { EmployeeFormState } from "@/app/admin/empleados/actions";
import type { Profile } from "@/lib/profiles";
import type { Role } from "@/lib/roles";

type Action = (prevState: EmployeeFormState | undefined, formData: FormData) => Promise<EmployeeFormState>;

export function EmployeeForm({ action, profile, roles }: { action: Action; profile?: Profile; roles: Role[] }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const isEdit = Boolean(profile);
  const [dailyRate, setDailyRate] = useState(String(profile?.daily_rate ?? 150));

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
        <Field label="Rol de permisos (qué ve en el menú)" htmlFor="roleId">
          <select id="roleId" name="roleId" defaultValue={profile?.role_id ?? ""} className={inputClass}>
            <option value="">Sin asignar</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Estado" htmlFor="active">
          <select id="active" name="active" defaultValue={profile ? String(profile.active) : "true"} className={inputClass}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </Field>
        <Field label="Sueldo semanal" htmlFor="weeklySalary">
          <input
            id="weeklySalary"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="Ej. 1700"
            defaultValue={profile ? (profile.daily_rate * 7).toFixed(2) : undefined}
            onChange={(e) => setDailyRate((Number(e.target.value || 0) / 7).toFixed(2))}
            className={inputClass}
          />
          <span className="mt-1 block font-normal text-admin-ink-soft">La tarifa diaria se calcula sola (÷7).</span>
        </Field>
        <Field label="Tarifa diaria" htmlFor="dailyRate">
          <input id="dailyRate" name="dailyRate" type="number" readOnly value={dailyRate} className={`${inputClass} bg-admin-bg/60 text-admin-ink-soft`} />
        </Field>
        <Field label="Fecha de ingreso" htmlFor="hireDate">
          <input id="hireDate" name="hireDate" type="date" defaultValue={profile?.hire_date ?? ""} className={inputClass} />
        </Field>
        <Field label="Teléfono" htmlFor="phone">
          <input id="phone" name="phone" defaultValue={profile?.phone ?? ""} className={inputClass} />
        </Field>
        <Field label="CURP / RFC" htmlFor="curpRfc">
          <input id="curpRfc" name="curpRfc" defaultValue={profile?.curp_rfc ?? ""} className={inputClass} />
        </Field>
        <Field label="Contacto de emergencia (nombre)" htmlFor="emergencyContactName">
          <input id="emergencyContactName" name="emergencyContactName" defaultValue={profile?.emergency_contact_name ?? ""} className={inputClass} />
        </Field>
        <Field label="Contacto de emergencia (teléfono)" htmlFor="emergencyContactPhone">
          <input id="emergencyContactPhone" name="emergencyContactPhone" defaultValue={profile?.emergency_contact_phone ?? ""} className={inputClass} />
        </Field>
        <Field label="Dirección" htmlFor="address">
          <input id="address" name="address" defaultValue={profile?.address ?? ""} className={`${inputClass} sm:col-span-2`} />
        </Field>
        <Field label="Carta de recomendación (PDF o imagen)" htmlFor="referenceLetter">
          <input id="referenceLetter" name="referenceLetter" type="file" accept="application/pdf,image/*" className={`${inputClass} py-2`} />
        </Field>
        <Field label="Examen SICAD (PDF o imagen)" htmlFor="sicadExam">
          <input id="sicadExam" name="sicadExam" type="file" accept="application/pdf,image/*" className={`${inputClass} py-2`} />
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
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-[0.85rem] font-semibold text-admin-ink">
      {label}
      {children}
    </label>
  );
}
