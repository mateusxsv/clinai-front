import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
// Executa o worker compilado com Cache API controlada, sem depender de backend.
const eventos = {};
const conteudo = new Map();
const removidos = [];
let versao,
  chamadas = 0,
  assumiu = false,
  ativou = false;
const cache = {
  async addAll(requests) {
    for (const req of requests) {
      const caminho = new URL(req.url).pathname;
      assert(existsSync(`dist${caminho}`), `Arquivo ausente: ${caminho}`);
      assert.equal(req.credentials, "omit");
      conteudo.set(req.url, new Response(readFileSync(`dist${caminho}`)));
    }
  },
  async match(req) {
    return conteudo.get(typeof req === "string" ? req : req.url)?.clone();
  },
};
const contexto = {
  URL,
  Request,
  Response,
  Set,
  self: {
    location: { origin: "https://clinai.test" },
    addEventListener: (nome, fn) => (eventos[nome] = fn),
    clients: {
      claim: async () => {
        assumiu = true;
      },
    },
    skipWaiting: () => {
      ativou = true;
    },
  },
  caches: {
    open: async (nome) => {
      versao = nome;
      return cache;
    },
    keys: async () => [versao, "clinai-pwa:/:antigo", "outro-app"],
    delete: async (nome) => removidos.push(nome),
  },
  fetch: async () => {
    chamadas++;
    throw new TypeError("Sem internet");
  },
};
vm.runInNewContext(readFileSync("dist/sw.js", "utf8"), contexto);
let tarefa;
eventos.install({ waitUntil: (p) => (tarefa = p) });
await tarefa;
assert.equal(ativou, false, "Não deve atualizar sem consentimento");
eventos.activate({ waitUntil: (p) => (tarefa = p) });
await tarefa;
assert(assumiu);
assert.deepEqual(removidos, ["clinai-pwa:/:antigo"]);
function requisitar(
  path,
  { method = "GET", mode = "cors", headers = {} } = {},
) {
  let resposta;
  eventos.fetch({
    request: {
      url: new URL(path, "https://clinai.test").href,
      method,
      mode,
      headers: new Headers(headers),
    },
    respondWith: (p) => (resposta = p),
  });
  return resposta;
}
for (const path of [
  "/api/me",
  "/api/appointments",
  "/api/auth/login",
  "https://api.exemplo.com/me",
  "/foto-paciente.png",
]) {
  assert.equal(requisitar(path), undefined, `Não deve interceptar ${path}`);
}
assert.equal(requisitar("/api/me", { mode: "navigate" }), undefined);
assert.equal(requisitar("/offline.html", { method: "POST" }), undefined);
assert.equal(
  requisitar("/offline.html", { headers: { Authorization: "Bearer teste" } }),
  undefined,
);
const pagina = await requisitar("/consultas", { mode: "navigate" });
assert((await pagina.text()).includes("Você está sem conexão"));
const antes = chamadas;
assert.equal((await requisitar("/pwa/icone-192.png")).status, 200);
assert.equal(chamadas, antes);
assert(![...conteudo.keys()].some((url) => url.includes("/api/")));
eventos.message({ data: { type: "ATUALIZAR" } });
assert(ativou);
const manifest = JSON.parse(readFileSync("dist/manifest.webmanifest", "utf8"));
assert.equal(manifest.display, "standalone");
for (const size of [192, 512])
  assert(manifest.icons.some((i) => i.sizes === `${size}x${size}`));
console.log(
  "PWA validado: arquivos, instalação, cache restrito, API excluída, fallback offline e atualização voluntária.",
);
