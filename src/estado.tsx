import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Profile, Report } from "./dominio/tipos";
import { service } from "./servicos/api";
import { VLibras } from "./componentes/VLibras";
export type Theme = "system" | "light" | "dark";
export interface Acessibilidade {
  ativa: boolean;
  textoAmpliado: boolean;
  altoContraste: boolean;
  reduzirMovimento: boolean;
  libras: boolean;
}
const padrao: Acessibilidade = {
  ativa: false,
  textoAmpliado: false,
  altoContraste: false,
  reduzirMovimento: false,
  libras: false,
};
function ler(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem("clinai:" + key) || "null");
  } catch {
    return null;
  }
}
function preferencias(): Acessibilidade {
  const valor = ler("acessibilidade");
  if (!valor || typeof valor !== "object") {
    const ampliado = ler("large") === true;
    return { ...padrao, ativa: ampliado, textoAmpliado: ampliado };
  }
  const resultado = { ...padrao };
  for (const chave of Object.keys(padrao) as (keyof Acessibilidade)[])
    resultado[chave] = (valor as Record<string, unknown>)[chave] === true;
  return resultado;
}
const Context = createContext<{
  theme: Theme;
  setTheme: (value: Theme) => void;
  ready: boolean;
  profile: Profile | null;
  setProfile: (p: Profile | null) => void;
  report: Report | undefined;
  setReport: (r: Report | undefined) => void;
  acessibilidade: Acessibilidade;
  setAcessibilidade: (v: Acessibilidade) => void;
} | null>(null);
export function Provider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [report, setReport] = useState<Report>();
  const [acessibilidade, setAcessibilidade] = useState(preferencias);
  const [theme, setTheme] = useState<Theme>(() => {
    const value = ler("theme");
    return value === "dark" || value === "light" ? value : "system";
  });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let atual = true;
    void service
      .getSession()
      .then((p) => {
        if (atual) setProfile(p);
      })
      .finally(() => {
        if (atual) setReady(true);
      });
    // Limpa os dados da antiga demonstração, sem tocar nas preferências.
    try {
      for (const chave of Object.keys(sessionStorage))
        if (chave.startsWith("clinai:")) sessionStorage.removeItem(chave);
    } catch {}
    const expirar = () => {
      setProfile(null);
      setReport(undefined);
    };
    window.addEventListener("clinai:expired", expirar);
    return () => {
      atual = false;
      window.removeEventListener("clinai:expired", expirar);
    };
  }, []);
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const aplicar = () => {
      const dark = theme === "dark" || (theme === "system" && media?.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", dark ? "#101e22" : "#f2f4f3");
    };
    aplicar();
    media?.addEventListener("change", aplicar);
    try {
      localStorage.setItem("clinai:theme", JSON.stringify(theme));
    } catch {}
    return () => media?.removeEventListener("change", aplicar);
  }, [theme]);
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.dataset.contraste = String(
      acessibilidade.ativa && acessibilidade.altoContraste,
    );
    raiz.dataset.movimentoReduzido = String(
      acessibilidade.ativa && acessibilidade.reduzirMovimento,
    );
    try {
      localStorage.setItem(
        "clinai:acessibilidade",
        JSON.stringify(acessibilidade),
      );
    } catch {}
  }, [acessibilidade]);
  return (
    <Context.Provider
      value={{
        profile,
        setProfile,
        report,
        setReport,
        theme,
        setTheme,
        ready,
        acessibilidade,
        setAcessibilidade,
      }}
    >
      <div
        className={
          acessibilidade.ativa && acessibilidade.textoAmpliado
            ? "app large"
            : "app"
        }
      >
        {children}
      </div>
      <VLibras ativo={acessibilidade.ativa && acessibilidade.libras} />
    </Context.Provider>
  );
}
export function useApp() {
  return useContext(Context)!;
}
