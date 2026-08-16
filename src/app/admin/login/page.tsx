import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Acceso al panel" };

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-blue-pale px-6">
      <div className="w-full max-w-[360px] rounded-2xl border border-line bg-surface p-8 shadow-card">
        <h1 className="font-display text-xl text-ink">Panel de FarmaLEM</h1>
        <p className="mt-1.5 text-[0.86rem] text-ink-soft">Acceso solo para el equipo de la farmacia.</p>
        <LoginForm />
      </div>
    </main>
  );
}
