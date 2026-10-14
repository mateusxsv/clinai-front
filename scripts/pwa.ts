import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { Plugin } from "vite";

// Gera a lista exata de arquivos públicos: nenhum endpoint da API entra no cache.
export function pwa(): Plugin {
  let base = "/";
  return {
    name: "clinai-pwa",
    apply: "build",
    configResolved(config) {
      base = config.base;
    },
    generateBundle(_, bundle) {
      const arquivos = Object.keys(bundle).filter((p) =>
        /\.(js|css|woff2?)$/.test(p),
      );
      arquivos.push(
        "offline.html",
        "manifest.webmanifest",
        "pwa/icone-192.png",
        "pwa/icone-512.png",
        "pwa/icone-180.png",
      );
      const modelo = readFileSync(
        new URL("./service-worker.js", import.meta.url),
        "utf8",
      );
      const hash = createHash("sha256").update(modelo);
      for (const nome of Object.keys(bundle).sort()) {
        const item = bundle[nome];
        hash
          .update(nome)
          .update(item.type === "chunk" ? item.code : item.source);
      }
      for (const nome of arquivos.filter((p) => !bundle[p]))
        hash.update(
          readFileSync(new URL(`../public/${nome}`, import.meta.url)),
        );
      const versao = hash.digest("hex").slice(0, 16);
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: modelo
          .replace("__VERSAO__", JSON.stringify(versao))
          .replace("__BASE__", JSON.stringify(base))
          .replace("__ARQUIVOS__", JSON.stringify(arquivos)),
      });
    },
  };
}
