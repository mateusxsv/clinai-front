/* Gerado no build; somente arquivos públicos conhecidos podem entrar no cache. */
const VERSAO = __VERSAO__;
const BASE = __BASE__;
const PREFIXO = `clinai-pwa:${BASE}:`;
const CACHE = PREFIXO + VERSAO;
const ARQUIVOS = __ARQUIVOS__.map(
  (p) => new URL(BASE + p, self.location.origin).href,
);
const PUBLICOS = new Set(ARQUIVOS);
const OFFLINE = new URL(BASE + "offline.html", self.location.origin).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Sem cookies e sem aproveitar respostas antigas do cache HTTP.
      await cache.addAll(
        ARQUIVOS.map(
          (url) => new Request(url, { cache: "reload", credentials: "omit" }),
        ),
      );
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith(PREFIXO) && key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});
// A versão nova só assume o controle após a escolha explícita do usuário.
self.addEventListener("message", (event) => {
  if (event.data?.type === "ATUALIZAR") self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (
    req.method !== "GET" ||
    url.origin !== self.location.origin ||
    req.headers.has("authorization") ||
    req.headers.has("range")
  )
    return;
  // API, sessão, prontuários e imagens remotas nunca recebem fallback nem cache.
  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) return;
  if (PUBLICOS.has(url.href)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        return (await cache.match(req)) || fetch(req);
      })(),
    );
    return;
  }
  if (req.mode === "navigate" && url.pathname.startsWith(BASE)) {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open(CACHE);
        return (
          (await cache.match(OFFLINE)) ||
          new Response(
            "Sem conexão. Tente novamente quando a internet voltar.",
            {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            },
          )
        );
      }),
    );
  }
});
