"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateEmployee, deleteEmployeeAction, regenerateQuickLoginTokenAction, type EmployeeFormState } from "@/app/admin/empleados/actions";
import type { Profile } from "@/lib/profiles";

const inputClass =
  "mt-1.5 w-full rounded-lg border border-admin-border bg-admin-input-bg px-4 py-2.5 text-admin-ink outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-primary";

interface Row extends Profile {
  referenceLetterUrl: string | null;
  sicadExamUrl: string | null;
}

export function EditEmployeeModal({ profile, pinConfigured, onClose }: { profile: Row; pinConfigured: boolean; onClose: () => void }) {
  const boundAction = updateEmployee.bind(null, profile.id);
  const [state, formAction, pending] = useActionState<EmployeeFormState | undefined, FormData>(boundAction, undefined);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [dailyRate, setDailyRate] = useState(String(profile.daily_rate));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-[640px] overflow-y-auto rounded-2xl bg-admin-surface p-6 shadow-lg"
      >
        <h2 className="font-display text-lg text-admin-ink">Editar empleado</h2>

        <form action={formAction} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre completo" htmlFor="fullName">
              <input id="fullName" name="fullName" required defaultValue={profile.full_name} className={inputClass} />
            </Field>
            <Field label="Usuario" htmlFor="username">
              <input id="username" name="username" required defaultValue={profile.username} className={inputClass} />
            </Field>
            <Field label="Nueva contraseña (déjala vacía para conservarla)" htmlFor="password">
              <input id="password" name="password" type="password" className={inputClass} />
            </Field>
            <Field label={profile.clock_pin_hash ? "Nuevo PIN del reloj checador (4 a 6 dígitos)" : "PIN del reloj checador (4 a 6 dígitos)"} htmlFor="clockPin">
              <input id="clockPin" name="clockPin" type="password" inputMode="numeric" pattern="\d{4,6}" className={inputClass} />
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
            <Field label="Estado" htmlFor="active">
              <select id="active" name="active" defaultValue={String(profile.active)} className={inputClass}>
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </Field>
            <Field label="Sueldo semanal (opcional)" htmlFor="weeklySalary">
              <input
                id="weeklySalary"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej. 1700"
                onChange={(e) => {
                  const weekly = Number(e.target.value || 0);
                  if (weekly > 0) setDailyRate((weekly / 7).toFixed(2));
                }}
                className={inputClass}
              />
              <span className="mt-1 block font-normal text-admin-ink-soft">Captúralo y la tarifa diaria se calcula sola (÷7).</span>
            </Field>
            <Field label="Tarifa diaria" htmlFor="dailyRate">
              <input
                id="dailyRate"
                name="dailyRate"
                type="number"
                min="0"
                step="0.01"
                required
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                className={inputClass}
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

          <div className="flex flex-wrap justify-between gap-3">
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="rounded-full border border-admin-bad-text px-5 py-2.5 text-[0.85rem] font-semibold text-admin-bad-text"
            >
              Eliminar empleado
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="rounded-full border border-admin-border px-5 py-2.5 text-[0.85rem] font-semibold text-admin-ink-soft">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-admin-primary px-6 py-2.5 text-[0.85rem] font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-60"
              >
                {pending ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </form>

        <QuickLoginLink profile={profile} />

        {confirmingDelete && <DeleteConfirm profile={profile} pinConfigured={pinConfigured} onCancel={() => setConfirmingDelete(false)} onClose={onClose} />}
      </div>
    </div>
  );
}

function QuickLoginLink({ profile }: { profile: Row }) {
  const [token, setToken] = useState(profile.quick_login_token);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = origin && token ? `${origin}/admin/switch/${token}` : "";

  function generate() {
    setError(null);
    startTransition(async () => {
      const result = await regenerateQuickLoginTokenAction(profile.id);
      if (result.token) setToken(result.token);
      else setError(result.error ?? "No se pudo generar el enlace.");
    });
  }

  async function copy() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-5 rounded-xl border border-admin-border bg-admin-bg p-4">
      <p className="text-[0.85rem] font-semibold text-admin-ink">Acceso directo (cambiar de usuario)</p>
      <p className="mt-1 text-[0.8rem] text-admin-ink-soft">
        Entra directo como {profile.full_name.split(" ")[0]} en la computadora de la farmacia, sin escribir contraseña. Guárdalo como acceso directo solo en un
        equipo de confianza.
      </p>
      {url ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input readOnly value={url} onFocus={(e) => e.target.select()} className="min-w-0 flex-1 rounded-lg border border-admin-border bg-admin-input-bg px-3 py-2 text-[0.8rem] text-admin-ink" />
          <button type="button" onClick={copy} className="rounded-full border border-admin-border px-4 py-2 text-[0.8rem] font-semibold text-admin-ink">
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      ) : null}
      <div className="mt-3">
        <button
          type="button"
          disabled={pending}
          onClick={generate}
          className="rounded-full border border-admin-border px-4 py-2 text-[0.8rem] font-semibold text-admin-ink disabled:opacity-60"
        >
          {pending ? "Generando…" : token ? "Regenerar enlace" : "Generar enlace"}
        </button>
        {token && <span className="ml-2 text-[0.78rem] text-admin-ink-soft">Regenerarlo invalida el anterior.</span>}
      </div>
      {error && <p className="mt-2 text-[0.82rem] font-semibold text-admin-bad-text">{error}</p>}
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
