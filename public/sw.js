/* Service worker do app Igreja de Cristo.
 * - Páginas: sempre da rede (conteúdo e sessão atualizados); sem internet, mostra /offline.html.
 *   Páginas HTML NÃO são guardadas em cache, para não expor dados de uma conta a outra pessoa no mesmo aparelho.
 * - Arquivos estáticos com hash (/_next/static) e imagens públicas do app: cache, para abrir rápido.
 * - Nada de outros domínios (Supabase, analytics) passa por aqui.
 */
const VERSION = "v3"; // v3: notificações push
const STATIC = `igreja-static-${VERSION}`;
const PRECACHE = ["/offline.html", "/pwa/v2/icon-192.png", "/pwa/v2/icon-512.png", "/pwa/v2/apple-touch-icon.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("igreja-") && k !== STATIC).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isStaticAsset = (url) =>
  url.pathname.startsWith("/_next/static/") ||
  url.pathname.startsWith("/pwa/") ||
  url.pathname.startsWith("/share/") ||
  url.pathname.startsWith("/hero/");

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navegação: rede primeiro; sem conexão, página offline.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match("/offline.html")));
    return;
  }

  // Estáticos: cache primeiro e atualização em segundo plano.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(STATIC).then(async (cache) => {
        const hit = await cache.match(req);
        const network = fetch(req).then((res) => {
          if (res.ok && res.type === "basic") cache.put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || network;
      }),
    );
  }
});

// ---------- Notificações push (apitam mesmo com o app fechado) ----------
self.addEventListener("push", (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch { d = { body: event.data ? event.data.text() : "" }; }
  const title = d.title || "Igreja de Cristo";
  event.waitUntil(self.registration.showNotification(title, {
    body: d.body || "",
    icon: "/pwa/v2/icon-192.png",
    badge: "/pwa/v2/icon-192.png",
    tag: d.tag || undefined,
    renotify: !!d.tag,            // mesmo assunto de novo: apita outra vez
    vibrate: [120, 60, 120],
    data: { url: typeof d.url === "string" && d.url.startsWith("/") ? d.url : "/" },
  }));
});

// Tocar na notificação: abre (ou traz para frente) o app na tela certa.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin).href;
  event.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      if (new URL(w.url).origin === self.location.origin) { await w.focus(); return w.navigate(url).catch(() => undefined); }
    }
    return self.clients.openWindow(url);
  })());
});
