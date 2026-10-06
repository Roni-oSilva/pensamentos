/* Service worker do app Igreja de Cristo.
 * - Páginas: sempre da rede (conteúdo e sessão atualizados); sem internet, mostra /offline.html.
 *   Páginas HTML NÃO são guardadas em cache, para não expor dados de uma conta a outra pessoa no mesmo aparelho.
 * - Arquivos estáticos com hash (/_next/static) e imagens públicas do app: cache, para abrir rápido.
 * - Nada de outros domínios (Supabase, analytics) passa por aqui.
 */
const VERSION = "v1";
const STATIC = `igreja-static-${VERSION}`;
const PRECACHE = ["/offline.html", "/pwa/icon-192.png", "/pwa/icon-512.png", "/pwa/apple-touch-icon.png"];

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
