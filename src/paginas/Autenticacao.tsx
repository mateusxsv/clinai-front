import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Stethoscope,
  UserRound,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import {
  Button,
  Card,
  ErrorMessage,
  Field,
  Forward,
  Page,
  useAction,
} from "../componentes/interface";
import { service, recursos, mensagemAcesso } from "../servicos/api";
import { emptyHealth } from "../dominio/saude";
import { useApp } from "../estado";
import type { Health, Profile } from "../dominio/tipos";
export function Welcome() {
  return (
    <Page
      title="Bem-vindo à ClinAi"
      subtitle="Sua saúde, com mais praticidade"
      narrow
    >
      <div className="welcome">
        <div className="welcome-mark">
          <img
            className="welcome-logo logo-on-light"
            src="/assets/clinai-mark.png"
            alt="Logo ClinAi"
          />
          <img
            className="welcome-logo logo-on-dark"
            src="/assets/logo-white-clinai.png"
            alt="Logo ClinAi"
          />
        </div>
        <h2>Seu cuidado começa aqui.</h2>
        <p>
          Conte como você está e encontre um profissional para o próximo passo.
        </p>
        <Forward to="/medicos">Encontrar profissionais</Forward>
        <Link className="text-link" to="/acesso">
          Acessar minha conta
        </Link>
        <small>
          Encontre atendimento. Organize suas consultas. Cuide de você.
        </small>
      </div>
    </Page>
  );
}
export function Access() {
  return (
    <Page
      title="Eu sou..."
      subtitle="Escolha como deseja acessar"
      back="/"
      narrow
    >
      <Link className="card access-card" to="/entrar">
        <UserRound size={32} />
        <div>
          <h2>Paciente</h2>
          <p>Pré-triagem e agendamento.</p>
        </div>
      </Link>
      <Link className="card access-card" to="/entrar?perfil=medico">
        <Stethoscope size={32} />
        <div>
          <h2>Médico</h2>
          <p>Agenda e resumo do paciente.</p>
        </div>
      </Link>
    </Page>
  );
}
export function Login() {
  const [q] = useSearchParams();
  const role = q.get("perfil") === "medico" ? "doctor" : "patient";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setProfile } = useApp();
  const nav = useNavigate();
  const { busy, error, run } = useAction();
  const login = () =>
    run(async () => {
      setProfile(await service.login(email, password, role));
      nav(role === "doctor" ? "/medico" : "/inicio");
    });
  return (
    <Page
      title={role === "doctor" ? "Acesso do médico" : "Entrar"}
      subtitle={
        role === "doctor"
          ? "Acesse sua agenda e os resumos dos pacientes"
          : "Acesse sua conta de paciente"
      }
      back="/acesso"
      narrow
    >
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void login();
          }}
        >
          <Field
            label="E-mail"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Field
            label="Senha"
            type="password"
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Link className="text-link" to="/recuperar">
            Esqueci minha senha
          </Link>
          <ErrorMessage
            message={
              error ||
              (!recursos.autenticacao
                ? "O serviço de acesso está indisponível no momento. Tente novamente mais tarde."
                : "")
            }
          />
          <Button type="submit" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </Button>
        </form>
        {role === "patient" && (
          <p className="center">
            Ainda não tem uma conta?{" "}
            <Link className="text-link" to="/cadastro">
              Criar conta
            </Link>
          </p>
        )}
      </Card>
    </Page>
  );
}
export function Recover() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { busy, error, run } = useAction();
  if (!recursos.autenticacao)
    return (
      <Page
        title="Acesso à conta"
        subtitle="Seu espaço de cuidado"
        back="/acesso"
        narrow
      >
        <Card>
          <h2>Acesso indisponível no momento</h2>
          <p>{mensagemAcesso}</p>
          <Forward to="/medicos">Consultar profissionais</Forward>
          <Forward to="/configuracoes">Configurações de acessibilidade</Forward>
        </Card>
      </Page>
    );
  return (
    <Page
      title={sent ? "Solicitação registrada" : "Recuperar acesso"}
      back="/entrar"
      narrow
    >
      <Card>
        {sent ? (
          <>
            <CheckCircle2 className="success-icon" />
            <h2>Confira seu e-mail</h2>
            <p>
              Se o e-mail estiver cadastrado, você receberá instruções para
              recuperar seu acesso.
            </p>
            <Forward to="/entrar">Voltar para entrar</Forward>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await service.recover(email);
                setSent(true);
              });
            }}
          >
            <Field
              label="E-mail cadastrado"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <ErrorMessage message={error} />
            <Button type="submit" disabled={busy}>
              {busy ? "Enviando…" : "Solicitar recuperação"}
            </Button>
          </form>
        )}
      </Card>
    </Page>
  );
}
export const healthLabels: Record<keyof Health, string> = {
  chronic: "Doenças crônicas",
  allergies: "Alergias",
  reaction: "Reações alérgicas",
  medications: "Medicamentos de uso contínuo (nome, dose e frequência)",
  surgeries: "Cirurgias ou internações importantes",
  support: "Apoio necessário no atendimento",
};
export function HealthFields({
  value,
  onChange,
  keys = Object.keys(healthLabels) as (keyof Health)[],
}: {
  value: Health;
  onChange: (h: Health) => void;
  keys?: (keyof Health)[];
}) {
  return (
    <>
      {keys.map((key) => (
        <Field
          key={key}
          label={healthLabels[key]}
          value={value[key]}
          placeholder="Informe, ou responda Não / Não sei"
          onChange={(e) => onChange({ ...value, [key]: e.target.value })}
        />
      ))}
    </>
  );
}
export function HealthSummary({ health }: { health: Health }) {
  return (
    <dl className="summary">
      {Object.entries(healthLabels).map(([key, label]) => (
        <div key={key}>
          <dt>{label}</dt>
          <dd>{health[key as keyof Health] || "Não informado"}</dd>
        </div>
      ))}
    </dl>
  );
}
export function Register() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Omit<Profile, "id">>({
    name: "",
    birth: "",
    email: "",
    phone: "",
    role: "patient",
    health: { ...emptyHealth },
  });
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const { setProfile } = useApp();
  const nav = useNavigate();
  const { busy, error, run } = useAction();
  if (!recursos.autenticacao)
    return (
      <Page
        title="Acesso à conta"
        subtitle="Seu espaço de cuidado"
        back="/acesso"
        narrow
      >
        <Card>
          <h2>Acesso indisponível no momento</h2>
          <p>{mensagemAcesso}</p>
          <Forward to="/medicos">Consultar profissionais</Forward>
          <Forward to="/configuracoes">Configurações de acessibilidade</Forward>
        </Card>
      </Page>
    );
  return (
    <Page
      title={
        [
          "Criar conta",
          "Seu histórico",
          "Concluir cadastro",
          "Revisar e concluir",
        ][step]
      }
      subtitle={`${Math.min(step + 1, 3)} de 3 • ${["Seus dados", "Saúde", "Cuidados e privacidade", "Confira suas informações"][step]}`}
      back="/entrar"
      narrow
    >
      <div className="progress">
        <span style={{ width: `${(Math.min(step + 1, 3) / 3) * 100}%` }} />
      </div>
      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 3) {
              setStep(step + 1);
              return;
            }
            void run(async () => {
              setProfile(await service.register(data, password));
              setPassword("");
              nav("/inicio");
            });
          }}
        >
          {step === 0 && (
            <>
              <Field
                label="Nome completo"
                required
                minLength={3}
                autoComplete="name"
                value={data.name}
                onChange={(e) => setData({ ...data, name: e.target.value })}
              />
              <Field
                label="Data de nascimento"
                required
                type="date"
                max={new Date().toISOString().slice(0, 10)}
                value={data.birth}
                onChange={(e) => setData({ ...data, birth: e.target.value })}
              />
              <Field
                label="Telefone"
                required
                type="tel"
                minLength={10}
                value={data.phone}
                onChange={(e) => setData({ ...data, phone: e.target.value })}
              />
              <Field
                label="E-mail"
                required
                type="email"
                value={data.email}
                onChange={(e) => setData({ ...data, email: e.target.value })}
              />
              <Field
                label="Criar senha"
                required
                type="password"
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </>
          )}
          {step === 1 && (
            <>
              <p>
                Salvamos estas respostas para você não precisar repeti-las a
                cada atendimento.
              </p>
              <HealthFields
                value={data.health}
                onChange={(health) => setData({ ...data, health })}
                keys={["chronic", "allergies", "reaction", "medications"]}
              />
            </>
          )}
          {step === 2 && (
            <>
              <HealthFields
                value={data.health}
                onChange={(health) => setData({ ...data, health })}
                keys={["surgeries", "support"]}
              />
              <div className="notice">
                <ShieldCheck />
                <div>
                  <strong>Como usaremos seus dados</strong>
                  <p>
                    O histórico acompanha o resumo para o profissional
                    responsável pelo atendimento.{" "}
                  </p>
                </div>
              </div>
              <label className="checkbox">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                />
                Li e compreendi como meus dados serão usados no atendimento.
              </label>
            </>
          )}
          {step === 3 && (
            <>
              <h2>{data.name}</h2>
              <p>{data.email}</p>
              <HealthSummary health={data.health} />
              <p>Você pode atualizar as respostas no seu perfil.</p>
            </>
          )}
          <ErrorMessage message={error} />
          <Button type="submit" disabled={busy}>
            {busy
              ? "Salvando…"
              : step === 3
                ? "Concluir cadastro"
                : "Continuar"}
          </Button>
          {step > 0 && (
            <Button secondary onClick={() => setStep(step - 1)}>
              Voltar à etapa anterior
            </Button>
          )}
        </form>
      </Card>
    </Page>
  );
}
