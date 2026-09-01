import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Correo o contraseña incorrectos");
    setBusy(false);
  }

  return (
    <div className="login card">
      <h1>FarmaLEM · Mercancías</h1>
      <p className="muted">Inicia sesión con tu cuenta del equipo.</p>
      {error && <div className="alert error">{error}</div>}
      <form onSubmit={submit} className="row" style={{ flexDirection: "column", alignItems: "stretch" }}>
        <div className="field"><label>Correo</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus /></div>
        <div className="field"><label>Contraseña</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <button className="btn primary" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
      </form>
    </div>
  );
}
