import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Download, WifiOff, RefreshCw } from "lucide-react";
import { Card, Button } from "./interface";

type Convite = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
type Estado = {
  instalado: boolean;
  convite: Convite | null;
  registro: ServiceWorkerRegistration | null;
  aguardando: ServiceWorker | null;
  offline: boolean;
  erro: string;
};
const Contexto = createContext<{
  estado: Estado;
  instalar: () => Promise<void>;
  atualizar: () => void;
} | null>(null);
const jaInstalado = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;
export function PwaProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>(() => ({
    instalado: jaInstalado(),
    convite: null,
    registro: null,
    aguardando: null,
    offline: !navigator.onLine,
    erro: "",
  }));
  useEffect(() => {
    let ativo = true;
    let registro: ServiceWorkerRegistration | undefined;
    const ouvintes: Array<() => void> = [];
    const mudar = (parte: Partial<Estado>) => {
      if (ativo) setEstado((e) => ({ ...e, ...parte }));
    };
    const instalar = (e: Event) => {
      e.preventDefault();
      mudar({ convite: e as Convite });
    };
    const instalado = () => mudar({ instalado: true, convite: null });
    const controle = () => mudar({ aguardando: null });
    const rede = () => mudar({ offline: !navigator.onLine });
    const visivel = () => {
      if (document.visibilityState === "visible" && navigator.onLine)
        void registro?.update().catch(() => {});
    };
    window.addEventListener("beforeinstallprompt", instalar);
    window.addEventListener("appinstalled", instalado);
    window.addEventListener("online", rede);
    window.addEventListener("offline", rede);
    document.addEventListener("visibilitychange", visivel);
    const observar = () => {
      if (registro?.waiting) mudar({ aguardando: registro.waiting });
      const worker = registro?.installing;
      if (!worker) return;
      const mudou = () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller)
          mudar({ aguardando: registro?.waiting ?? worker });
      };
      worker.addEventListener("statechange", mudou);
      ouvintes.push(() => worker.removeEventListener("statechange", mudou));
    };
    if (
      import.meta.env.PROD &&
      "serviceWorker" in navigator &&
      window.isSecureContext
    ) {
      navigator.serviceWorker.addEventListener("controllerchange", controle);
      void navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`, {
          scope: import.meta.env.BASE_URL,
          updateViaCache: "none",
        })
        .then((r) => {
          if (!ativo) return;
          registro = r;
          mudar({ registro: r });
          observar();
          r.addEventListener("updatefound", observar);
        })
        .catch(() =>
          mudar({
            erro: "Não foi possível preparar o aplicativo. Tente novamente quando estiver conectado.",
          }),
        );
    }
    return () => {
      ativo = false;
      window.removeEventListener("beforeinstallprompt", instalar);
      window.removeEventListener("appinstalled", instalado);
      window.removeEventListener("online", rede);
      window.removeEventListener("offline", rede);
      document.removeEventListener("visibilitychange", visivel);
      registro?.removeEventListener("updatefound", observar);
      if ("serviceWorker" in navigator)
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          controle,
        );
      ouvintes.forEach((remover) => remover());
    };
  }, []);
  const instalar = async () => {
    const convite = estado.convite;
    if (!convite) return;
    setEstado((e) => ({ ...e, convite: null, erro: "" }));
    try {
      await convite.prompt();
      await convite.userChoice;
    } catch {
      setEstado((e) => ({
        ...e,
        erro: "Não foi possível abrir a instalação. Use o menu do navegador.",
      }));
    }
  };
  const atualizar = () => {
    if (!estado.aguardando || estado.offline) return;
    // Só esta aba, e apenas após o clique, recarrega. Nenhum formulário é descartado automaticamente.
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => window.location.reload(),
      { once: true },
    );
    estado.aguardando.postMessage({ type: "ATUALIZAR" });
  };
  return (
    <Contexto.Provider value={{ estado, instalar, atualizar }}>
      {children}
    </Contexto.Provider>
  );
}
export function AvisosPwa() {
  const contexto = useContext(Contexto);
  if (!contexto) return null;
  const { estado, atualizar } = contexto;
  return (
    <>
      {estado.offline && (
        <div className="pwa-aviso" role="status">
          <WifiOff size={20} aria-hidden="true" />
          <span>
            Sem conexão. Para acessar ou salvar informações, conecte-se à
            internet.
          </span>
        </div>
      )}
      {estado.aguardando && (
        <div className="pwa-aviso" role="status">
          <RefreshCw size={20} aria-hidden="true" />
          <span>
            Nova versão disponível. Conclua o que estiver preenchendo antes de
            atualizar.
          </span>
          <button type="button" onClick={atualizar} disabled={estado.offline}>
            Atualizar agora
          </button>
        </div>
      )}
    </>
  );
}
export function InstalacaoPwa() {
  const contexto = useContext(Contexto);
  if (!contexto) return null;
  const { estado, instalar } = contexto;
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return (
    <Card className="settings-card">
      <div className="section-title">
        <Download aria-hidden="true" />
        <h2>Aplicativo ClinAi</h2>
      </div>
      {estado.instalado ? (
        <p>A ClinAi já está aberta como aplicativo.</p>
      ) : (
        <>
          <p>Tenha a ClinAi na tela inicial e abra com um toque.</p>
          {estado.convite ? (
            <Button type="button" onClick={() => void instalar()}>
              Instalar ClinAi
            </Button>
          ) : (
            <p className="settings-hint">
              {ios
                ? "No menu de compartilhamento, escolha “Adicionar à Tela de Início”."
                : "Abra o menu do navegador e procure “Instalar aplicativo” ou “Adicionar à tela inicial”. A opção depende do navegador e do dispositivo."}
            </p>
          )}
        </>
      )}
      <p className="settings-hint">
        Acesso à conta, consultas e agendamentos precisam de internet.
      </p>
      {estado.erro && <p role="status">{estado.erro}</p>}
    </Card>
  );
}
