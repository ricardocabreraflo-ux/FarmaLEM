"use client";

import { useEffect, useState, useTransition } from "react";
import { savePushSubscriptionAction, deletePushSubscriptionAction, sendTestPushAction } from "@/app/admin/configuracion/actions";

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64Safe);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

type Status = "checking" | "unsupported" | "denied" | "off" | "on";

export function PushNotificationSettings() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);
  const [testSent, setTestSent] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setStatus("denied");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const existing = await registration.pushManager.getSubscription();
        if (!cancelled) setStatus(existing ? "on" : "off");
      } catch {
        if (!cancelled) setStatus("off");
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, []);

  async function activate() {
    setError(null);
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setError("Falta configurar las llaves de notificaciones en el servidor.");
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        if (permission === "denied") setError("Bloqueaste el permiso de notificaciones — actívalo desde los ajustes del navegador para este sitio.");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("El navegador no dio los datos completos de la suscripción.");

      startTransition(async () => {
        const res = await savePushSubscriptionAction({ endpoint: json.endpoint!, keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! } });
        if (res.ok) setStatus("on");
        else setError(res.error ?? "No se pudo activar.");
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo activar la notificación en este dispositivo.");
    }
  }

  async function deactivate() {
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        startTransition(async () => {
          await deletePushSubscriptionAction(endpoint);
          setStatus("off");
        });
      } else {
        setStatus("off");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo desactivar.");
    }
  }

  function sendTest() {
    setTestSent(false);
    startTransition(async () => {
      await sendTestPushAction();
      setTestSent(true);
    });
  }

  if (status === "checking") return <p className="text-[0.84rem] text-admin-ink-soft">Revisando este dispositivo…</p>;

  if (status === "unsupported") {
    return <p className="text-[0.84rem] text-admin-ink-soft">Este navegador no soporta notificaciones push.</p>;
  }

  if (status === "denied") {
    return (
      <p className="text-[0.84rem] text-admin-bad-text">
        Bloqueaste las notificaciones para este sitio. Actívalas desde los ajustes/permisos del navegador (el ícono de candado junto a la dirección) y
        vuelve a entrar aquí.
      </p>
    );
  }

  return (
    <div>
      <p className="text-[0.84rem] text-admin-ink-soft">
        {status === "on" ? "Activadas en este dispositivo." : "Actívalas para que te llegue un aviso aquí cuando alguien marque su entrada o salida."}
      </p>
      {error && <p className="mt-2 text-[0.82rem] font-semibold text-admin-bad-text">{error}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {status === "on" ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={sendTest}
              className="rounded-full border border-admin-border px-4 py-2 text-[0.82rem] font-semibold text-admin-ink disabled:opacity-60"
            >
              {pending ? "Enviando…" : "Enviar prueba"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={deactivate}
              className="text-[0.82rem] font-semibold text-admin-ink-soft hover:underline disabled:opacity-60"
            >
              Desactivar en este dispositivo
            </button>
            {testSent && <span className="text-[0.82rem] font-semibold text-admin-ok-text">Enviada — revisa este dispositivo.</span>}
          </>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={activate}
            className="rounded-full bg-admin-primary px-5 py-2.5 text-[0.85rem] font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Activando…" : "Activar notificaciones en este dispositivo"}
          </button>
        )}
      </div>
    </div>
  );
}
