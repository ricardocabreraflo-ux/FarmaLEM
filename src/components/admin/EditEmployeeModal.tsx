"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateEmployee, deleteEmployeeAction, type EmployeeFormState } from "@/app/admin/empleados/actions";
import type { Profile } from "@/lib/profiles";
import type { Role } from "@/lib/roles";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

interface Row extends Profile {
  referenceLetterUrl: string | null;
  sicadExamUrl: string | null;
}

export function EditEmployeeModal({
  profile,
  roles,
  pinConfigured,
  onClose,
}: {
  profile: Row;
  roles: Role[];
  pinConfigured: boolean;
  onClose: () => void;
}) {
  const boundAction = updateEmployee.bind(null, profile.id);
  const [state, formAction, pending] = useActionState<EmployeeFormState | undefined, FormData>(boundAction, undefined);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [dailyRate, setDailyRate] = useState(String(profile.daily_rate));
  const [password, setPassword] = useState("");
  const [clockPin, setClockPin] = useState("");
  const [confirmingCredentials, setConfirmingCredentials] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSaveClick() {
    if (!confirmingCredentials && (password || clockPin)) {
      setConfirmingCredentials(true);
      return;
    }
    formRef.current?.requestSubmit();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-2xl bg-admin-surface p-6 shadow-lg"
      >
        <h2 className="font-display text-lg text-admin-ink">Editar empleado</h2>

        <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre completo" htmlFor="fullName">
              <input id="fullName" name="fullName" required defaultValue={profile.full_name} className={inputClass} />
            </Field>
            <Field label="Usuario" htmlFor="username">
              <input id="username" name="username" required defaultValue={profile.username} className={inputClass} />
            </Field>
            <Field label="Nueva contraseña (déjala vacía para conservarla)" htmlFor="password">
              <RevealInput id="password" name="password" value={password} onChange={setPassword} />
            </Field>
            <Field label={profile.clock_pin_hash ? "Nuevo PIN del reloj checador (4 a 6 dígitos)" : "PIN del reloj checador (4 a 6 dígitos)"} htmlFor="clockPin">
              <RevealInput id="clockPin" name="clockPin" inputMode="numeric" pattern="\d{4,6}" value={clockPin} onChange={setClockPin} />
            </Field>
            <Field label="Turno" htmlFor="shift">
              <select id="shift" name="shift" defaultValue={profile.shift} className={inputClass}>
                <option>Matutino</option>
                <option>Vespertino</option>
                <option>Administración</option>
              </select>
            </Field>
            <Field label="Rol" htmlFor="role">
              <select id="role" name="role" defaultValue={profile.role} className={inputClass}>
                <option value="employee">Empleado</option>
                <option value="admin">Administración</option>
              </select>
            </Field>
            <Field label="Rol de permisos (qué ve en el menú)" htmlFor="roleId">
              <select id="roleId" name="roleId" defaultValue={profile.role_id ?? ""} className={inputClass}>
                <option value="">Sin asignar</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Estado" htmlFor="active">
              <select id="active" name="active" defaultValue={String(profile.active)} className={inputClass}>
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
                defaultValue={(profile.daily_rate * 7).toFixed(2)}
                onChange={(e) => setDailyRate((Number(e.target.value || 0) / 7).toFixed(2))}
                className={inputClass}
              />
              <span className="mt-1 block font-normal text-admin-ink-soft">La tarifa diaria se calcula sola (÷7).</span>
            </Field>
            <Field label="Tarifa diaria" htmlFor="dailyRate">
              <input
                id="dailyRate"
                name="dailyRate"
                type="number"
                readOnly
                value={dailyRate}
                className={`${inputClass} bg-admin-bg/60 text-admin-ink-soft`}
              />
            </Field>
            <Field label="Fecha de ingreso" htmlFor="hireDate">
              <input id="hireDate" name="hireDate" type="date" defaultValue={profile.hire_date ?? ""} className={inputClass} />
            </Field>
            <Field label="Teléfono" htmlFor="phone">
              <input id="phone" name="phone" defaultValue={profile.phone ?? ""} className={inputClass} />
            </Field>
            <Field label="CURP / RFC" htmlFor="curpRfc">
              <input id="curpRfc" name="curpRfc" defaultValue={profile.curp_rfc ?? ""} className={inputClass} />
            </Field>
            <Field label="Contacto de emergencia (nombre)" htmlFor="emergencyContactName">
              <input id="emergencyContactName" name="emergencyContactName" defaultValue={profile.emergency_contact_name ?? ""} className={inputClass} />
            </Field>
            <Field label="Contacto de emergencia (teléfono)" htmlFor="emergencyContactPhone">
              <input id="emergencyContactPhone" name="emergencyContactPhone" defaultValue={profile.emergency_contact_phone ?? ""} className={inputClass} />
            </Field>
            <Field label="Dirección" htmlFor="address">
              <input id="address" name="address" defaultValue={profile.address ?? ""} className={`${inputClass} sm:col-span-2`} />
            </Field>
            <Field label="Carta de recomendación (PDF o imagen)" htmlFor="referenceLetter">
              <input id="referenceLetter" name="referenceLetter" type="file" accept="application/pdf,image/*" className={`${inputClass} py-2`} />
              {profile.referenceLetterUrl && (
                <a href={profile.referenceLetterUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-[0.78rem] font-semibold text-admin-primary hover:underline">
                  Ver la que ya subiste
                </a>
              )}
            </Field>
            <Field label="Examen SICAD (PDF o imagen)" htmlFor="sicadExam">
              <input id="sicadExam" name="sicadExam" type="file" accept="application/pdf,image/*" className={`${inputClass} py-2`} />
              {profile.sicadExamUrl && (
                <a href={profile.sicadExamUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block text-[0.78rem] font-semibold text-admin-primary hover:underline">
                  Ver el que ya subiste
                </a>
              )}
            </Field>
          </div>

          {state?.error && (
            <p role="alert" className="rounded-lg bg-admin-bad-bg px-4 py-3 text-[0.85rem] text-admin-bad-text">
              {state.error}
            </p>
          )}

          {confirmingCredentials && (
            <div className="rounded-lg border border-admin-primary bg-admin-primary-soft px-4 py-3 text-[0.85rem] text-admin-primary-deep">
              <p className="font-semibold">Vas a guardar esto — anótalo antes de continuar, ya no se podrá volver a ver:</p>
              <ul className="mt-1.5 list-none space-y-0.5 font-data">
                {password && <li>Contraseña nueva: {password}</li>}
                {clockPin && <li>PIN nuevo: {clockPin}</li>}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="rounded-full border border-admin-bad-text px-5 py-2.5 text-[0.85rem] font-semibold text-admin-bad-text"
            >
              Eliminar empleado
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => (confirmingCredentials ? setConfirmingCredentials(false) : onClose())}
                className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink-soft"
              >
                {confirmingCredentials ? "Seguir editando" : "Cancelar"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleSaveClick}
                className="rounded-full bg-admin-primary px-6 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
              >
                {pending ? "Guardando…" : confirmingCredentials ? "Confirmar y guardar" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </form>

        {confirmingDelete && <DeleteConfirm profile={profile} pinConfigured={pinConfigured} onCancel={() => setConfirmingDelete(false)} onClose={onClose} />}
      </div>
    </div>
  );
}

function RevealInput({
  id,
  name,
  value,
  onChange,
  inputMode,
  pattern,
}: {
  id: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  inputMode?: "numeric";
  pattern?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        inputMode={inputMode}
        pattern={pattern}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} pr-14`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Ocultar" : "Mostrar"}
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md px-2 py-1 text-[0.72rem] font-semibold text-admin-ink-soft hover:bg-admin-bg"
      >
        {show ? "Ocultar" : "Ver"}
      </button>
    </div>
  );
}

function DeleteConfirm({ profile, pinConfigured, onCancel, onClose }: { profile: Row; pinConfigured: boolean; onCancel: () => void; onClose: () => void }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);
    const result = await deleteEmployeeAction(profile.id, profile.full_name, pin);
    setPending(false);
    if (result.ok) {
      onClose();
      router.refresh();
    } else {
      setError(result.error ?? "No se pudo eliminar.");
    }
  }

  return (
    <div className="mt-5 rounded-xl border border-admin-bad-text bg-admin-bad-bg p-4">
      <p className="text-[0.85rem] font-semibold text-admin-bad-text">
        Vas a eliminar a {profile.full_name} de forma permanente. Solo funciona si no tiene cortes, asistencia ni sueldos capturados.
      </p>
      {!pinConfigured ? (
        <p className="mt-2 text-[0.82rem] text-admin-bad-text">Primero configura el PIN de eliminación en Configuración.</p>
      ) : (
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="block text-[0.85rem] font-semibold text-admin-bad-text">
            PIN
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="mt-1.5 w-32 rounded-lg border border-admin-bad-text bg-admin-surface px-4 py-2.5 text-admin-ink outline-none"
            />
          </label>
          <button
            type="button"
            disabled={pending || !pin}
            onClick={handleDelete}
            className="rounded-full bg-admin-bad-text px-5 py-2.5 text-[0.85rem] font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Eliminando…" : "Confirmar eliminación"}
          </button>
          <button type="button" onClick={onCancel} className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink-soft">
            Cancelar
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-[0.82rem] font-semibold text-admin-bad-text">{error}</p>}
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block text-[0.85rem] font-semibold text-admin-ink">
      {label}
      {children}
    </label>
  );
}
