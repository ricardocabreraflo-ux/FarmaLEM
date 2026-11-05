// Service worker mínimo, solo para notificaciones push del panel — no cachea
// nada ni afecta el funcionamiento normal de la app.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "FarmaLEM";
  const url = data.url || "/admin";
  const taskKey = data.taskKey || null;
  const checkDate = data.checkDate || null;

  const options = {
    body: data.body || "",
    icon: "/icons/icon-192-admin.png",
    badge: "/icons/icon-192-admin.png",
    vibrate: [200, 100, 200],
    // Si trae tarea que confirmar, se queda en pantalla hasta que la toquen —
    // no se debe perder entre el montón de notificaciones del celular.
    requireInteraction: Boolean(taskKey),
    data: { url, taskKey, checkDate },
  };
  if (taskKey) {
    options.actions = [{ action: "done", title: "✅ Ya lo hice" }];
  }
  // Foto grande dentro de la notificación (p. ej. el producto de una promoción) — Chrome/Android la muestran, Safari/iOS la ignora sin romper nada.
  if (data.image) {
    options.image = data.image;
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  const { url, taskKey, checkDate } = event.notification.data || {};

  // Botón "Ya lo hice" directo desde la notificación, sin tener que abrir la app.
  if (event.action === "done" && taskKey) {
    event.notification.close();
    event.waitUntil(
      fetch("/api/tasks/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskKey, checkDate }),
      }).catch(() => {})
    );
    return;
  }

  event.notification.close();
  const target = url || "/admin";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(target) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    })
  );
});
