import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./lib/supabase";
import Login from "./pages/Login";
import Recepciones from "./pages/Recepciones";
import NuevaRecepcion from "./pages/NuevaRecepcion";
import RecepcionDetalle from "./pages/RecepcionDetalle";

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash || "#/");
  useEffect(() => {
    const onChange = () => setHash(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return hash.replace(/^#/, "");
}

export const navigate = (to: string) => { window.location.hash = to; };

export default function App() {
  const route = useHashRoute();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!supabaseConfigured) {
    return (
      <div className="page">
        <div className="alert error">
          Falta configurar <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> (ver <code>.env.example</code>).
        </div>
      </div>
    );
  }
  if (!ready) return <div className="page muted">Cargando…</div>;
  if (!session) return <Login />;

  let page;
  if (route.startsWith("/nueva")) page = <NuevaRecepcion />;
  else if (route.startsWith("/recepcion/")) page = <RecepcionDetalle id={route.split("/")[2]} />;
  else page = <Recepciones />;

  return (
    <>
      <header className="topbar">
        <span className="brand">FarmaLEM · Mercancías</span>
        <nav>
          <a href="#/" className={route === "/" ? "active" : ""}>Recepciones</a>
          <a href="#/nueva" className={route.startsWith("/nueva") ? "active" : ""}>Nueva recepción</a>
        </nav>
        <span className="spacer" />
        <span className="user">{session.user.email}</span>
        <button className="btn small" onClick={() => supabase.auth.signOut()}>Salir</button>
      </header>
      <main className="page">{page}</main>
    </>
  );
}
