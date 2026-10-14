import {
  Accessibility,
  Palette,
  Check,
  Type,
  Contrast,
  Hand,
  Eye,
} from "lucide-react";
import { Card, Page } from "../componentes/interface";
import { useApp, type Acessibilidade } from "../estado";
const opcoes = [
  [
    "textoAmpliado",
    "Ampliar o texto",
    "Letras maiores para facilitar a leitura.",
    Type,
  ],
  [
    "altoContraste",
    "Aumentar o contraste",
    "Bordas e cores mais definidas para distinguir os elementos.",
    Contrast,
  ],
  [
    "reduzirMovimento",
    "Reduzir animações",
    "Uma navegação com menos movimentos e transições.",
    Eye,
  ],
  [
    "libras",
    "Ativar tradução em Libras",
    "Carrega o tradutor VLibras, um serviço externo, quando ativado.",
    Hand,
  ],
] as const;
export function Configuracoes() {
  const { theme, setTheme, acessibilidade, setAcessibilidade } = useApp();
  const alterar = (chave: keyof Acessibilidade, valor: boolean) =>
    setAcessibilidade({ ...acessibilidade, [chave]: valor });
  return (
    <Page
      title="Configurações"
      subtitle="Deixe a ClinAi mais confortável para você."
    >
      <div className="settings-grid">
        <Card className="settings-card">
          <div className="section-title">
            <Palette aria-hidden="true" />
            <h2>Aparência</h2>
          </div>
          <p>Escolha o tema que prefere usar.</p>
          <div className="theme-options" role="group" aria-label="Tema">
            {(
              [
                ["system", "Automático"],
                ["light", "Claro"],
                ["dark", "Escuro"],
              ] as const
            ).map(([valor, nome]) => (
              <button
                key={valor}
                aria-pressed={theme === valor}
                onClick={() => setTheme(valor)}
              >
                {nome}
              </button>
            ))}
          </div>
          <p className="settings-hint">
            O tema automático acompanha a preferência do seu dispositivo.
          </p>
        </Card>
        <Card className="settings-card accessibility-card">
          <div className="section-title">
            <Accessibility aria-hidden="true" />
            <h2>Acessibilidade</h2>
          </div>
          <p>Ative os recursos extras e ajuste cada opção abaixo.</p>
          <label className="preference-row preference-master">
            <input
              type="checkbox"
              checked={acessibilidade.ativa}
              onChange={(e) => alterar("ativa", e.target.checked)}
              aria-controls="opcoes-acessibilidade"
            />
            <span>
              <strong>Quero usar recursos de acessibilidade</strong>
              <small>Suas opções ficam guardadas ao desativar.</small>
            </span>
          </label>
          <fieldset id="opcoes-acessibilidade" disabled={!acessibilidade.ativa}>
            <legend className="sr-only">Recursos de acessibilidade</legend>
            {opcoes.map(([chave, titulo, descricao, Icone]) => (
              <label className="preference-row" key={chave}>
                <Icone size={22} aria-hidden="true" />
                <span>
                  <strong>{titulo}</strong>
                  <small>{descricao}</small>
                </span>
                <input
                  type="checkbox"
                  checked={acessibilidade[chave]}
                  onChange={(e) => alterar(chave, e.target.checked)}
                />
              </label>
            ))}
          </fieldset>
          <p className="settings-hint">
            Navegação pelo teclado, leitores de tela e zoom continuam
            disponíveis em qualquer configuração.
          </p>
        </Card>
      </div>
      <p className="preference-saved">
        <Check size={18} aria-hidden="true" /> Preferências aplicadas
        automaticamente neste navegador.
      </p>
    </Page>
  );
}
