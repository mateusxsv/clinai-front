import { useEffect, useState } from "react";

/** O script oficial inicializa o widget. Carregamos apenas após a escolha do usuário. */
export function VLibras({ ativo }: { ativo: boolean }) {
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    document.documentElement.dataset.libras = String(ativo);
    if (!ativo) return;
    let script = document.getElementById(
      "clinai-vlibras",
    ) as HTMLScriptElement | null;
    if (script) return;
    setErro(false);
    script = document.createElement("script");
    script.id = "clinai-vlibras";
    script.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    script.async = true;
    script.onerror = () => {
      script?.remove();
      setErro(true);
    };
    document.body.appendChild(script);
    // O widget permanece carregado ao desativar; o CSS remove-o da interação.
    // Evita instâncias duplicadas ao alternar preferências ou usar StrictMode.
  }, [ativo, tentativa]);
  return ativo && erro ? (
    <div className="libras-error" role="alert">
      <p>Não foi possível carregar o tradutor de Libras.</p>
      <button onClick={() => setTentativa((v) => v + 1)}>
        Tentar novamente
      </button>
    </div>
  ) : null;
}
