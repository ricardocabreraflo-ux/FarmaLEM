import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Acceso al panel" };

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-admin-bg px-6">
      <div className="w-full max-w-[360px] rounded-2xl border border-admin-border bg-admin-surface p-8 shadow-[0_20px_60px_-30px_rgb(23_33_27_/_0.4)]">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-admin-primary text-xl font-bold text-white">+</div>
        <h1 className="mt-3.5 font-display text-xl text-admin-ink">Panel de FarmaLEM</h1>
        <p className="mt-1.5 text-[0.86rem] text-admin-ink-soft">Cortes, sueldos, bonos y pedidos — acceso solo para el equipo.</p>
        <LoginForm />
      </div>
    </main>
  );
}
