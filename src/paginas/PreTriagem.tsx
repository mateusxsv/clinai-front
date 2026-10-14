import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Button,
  Card,
  Field,
  Forward,
  Page,
  Select,
} from "../componentes/interface";
import { useApp } from "../estado";
import { HealthSummary } from "./Autenticacao";
import type { Report } from "../dominio/tipos";
export function ReportSummary({ report }: { report: Report }) {
  return (
    <dl className="summary">
      {Object.entries({
        Incômodo: report.complaint,
        Início: report.onset,
        Local: report.location,
        Evolução: report.evolution,
        Intensidade: `${report.pain}/10`,
        "Outros sintomas": report.other,
        "Medicamento para o incômodo": report.medication,
        Gestação: report.pregnancy,
      }).map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v || "Não informado"}</dd>
        </div>
      ))}
    </dl>
  );
}
export function Triage() {
  const { profile, setReport, report } = useApp();
  const [step, setStep] = useState(0);
  const [urgent, setUrgent] = useState(false);
  const [data, setData] = useState<Report>(
    report || {
      complaint: "",
      onset: "",
      location: "",
      evolution: "Continua igual",
      pain: 0,
      other: "",
      medication: "",
      pregnancy: "Não informado",
    },
  );
  const update = (key: keyof Report, value: string | number) =>
    setData({ ...data, [key]: value });
  return (
    <Page
      title={
        urgent
          ? "Procure ajuda agora"
          : [
              "Antes de começar",
              "Como você está agora?",
              "O que você sente?",
              "Mais alguns detalhes",
              "Revise seu relato",
              "Próximo passo",
            ][step]
      }
      subtitle={
        urgent
          ? "Sinais de alerta"
          : step < 5
            ? "Pré-triagem • seu relato para o profissional"
            : "Relato organizado • pendente de avaliação profissional"
      }
      back="/inicio"
      narrow
    >
      {urgent ? (
        <Card className="urgent">
          <AlertTriangle size={36} />
          <h2>Não aguarde um agendamento.</h2>
          <p>
            Se você apresenta um dos sinais de alerta, procure atendimento de
            urgência ou ligue para o SAMU.
          </p>
          <a className="button" href="tel:192">
            Ligar para o SAMU • 192
          </a>
          <Button secondary onClick={() => setUrgent(false)}>
            Voltar aos sinais de alerta
          </Button>
        </Card>
      ) : (
        <>
          <div className="progress">
            <span style={{ width: `${((step + 1) / 6) * 100}%` }} />
          </div>
          <Card>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (step === 4) setReport(data);
                setStep(step + 1);
              }}
            >
              {step === 0 && (
                <>
                  <h2>Já sabemos sobre você</h2>
                  <HealthSummary health={profile!.health} />
                  <Link className="text-link" to="/historico">
                    Alguma informação mudou? Atualizar histórico
                  </Link>
                </>
              )}
              {step === 1 && (
                <>
                  <h2>Você apresenta algum destes sinais agora?</h2>
                  <div className="notice warning">
                    <AlertTriangle />
                    <ul>
                      <li>Falta de ar intensa</li>
                      <li>Dor no peito de início súbito</li>
                      <li>Desmaio ou perda de consciência</li>
                      <li>
                        Dificuldade súbita para falar ou perda de força de um
                        lado
                      </li>
                    </ul>
                  </div>
                  <Button secondary onClick={() => setUrgent(true)}>
                    Sim, tenho um desses sinais
                  </Button>
                  <p>Esta verificação não descarta uma emergência.</p>
                </>
              )}
              {step === 2 && (
                <>
                  <label className="field">
                    <span>Descreva o principal incômodo</span>
                    <textarea
                      required
                      minLength={5}
                      rows={4}
                      value={data.complaint}
                      onChange={(e) => update("complaint", e.target.value)}
                      placeholder="Conte com suas palavras o que está sentindo"
                    />
                  </label>
                  <Field
                    label="Quando começou?"
                    required
                    value={data.onset}
                    onChange={(e) => update("onset", e.target.value)}
                  />
                  <Field
                    label="Onde sente o incômodo?"
                    required
                    value={data.location}
                    onChange={(e) => update("location", e.target.value)}
                  />
                  <Select
                    label="Como está evoluindo?"
                    value={data.evolution}
                    options={[
                      "Continua igual",
                      "Está melhorando",
                      "Está piorando",
                      "Não sei",
                    ]}
                    onChange={(v) => update("evolution", v)}
                  />
                </>
              )}
              {step === 3 && (
                <>
                  <Field
                    label={`Intensidade da dor: ${data.pain} de 10`}
                    type="range"
                    min={0}
                    max={10}
                    value={data.pain}
                    onChange={(e) => update("pain", Number(e.target.value))}
                  />
                  <Field
                    label="Há outros sintomas ou lesão recente?"
                    value={data.other}
                    onChange={(e) => update("other", e.target.value)}
                  />
                  <Field
                    label="Tomou algo para este incômodo?"
                    value={data.medication}
                    onChange={(e) => update("medication", e.target.value)}
                  />
                  <Select
                    label="Gestação atual ou possível?"
                    value={data.pregnancy}
                    options={[
                      "Não informado",
                      "Sim",
                      "Não",
                      "Não sei",
                      "Não se aplica",
                    ]}
                    onChange={(v) => update("pregnancy", v)}
                  />
                </>
              )}
              {step === 4 && (
                <>
                  <ReportSummary report={data} />
                  <p>Confira antes de compartilhar com o profissional.</p>
                  <Button secondary onClick={() => setStep(2)}>
                    Editar respostas
                  </Button>
                </>
              )}
              {step === 5 ? (
                <>
                  <CheckCircle2 className="success-icon" />
                  <h2>Seu relato está organizado</h2>
                  <p>
                    Seu relato será enviado com o histórico ao confirmar um
                    agendamento. Até lá, ele permanece somente nesta página.
                  </p>
                  <p className="notice">
                    A pré-triagem não realiza diagnóstico nem classificação
                    automática de risco. A avaliação será feita por um
                    profissional.
                  </p>
                  <Forward to="/medicos">Encontrar atendimento</Forward>
                </>
              ) : (
                <Button type="submit">
                  {step === 0
                    ? "Confirmar histórico e continuar"
                    : step === 1
                      ? "Não tenho esses sinais"
                      : step === 4
                        ? "Concluir relato"
                        : "Continuar"}
                </Button>
              )}
              {step > 0 && step < 5 && (
                <Button secondary onClick={() => setStep(step - 1)}>
                  Voltar à etapa anterior
                </Button>
              )}
            </form>
          </Card>
        </>
      )}
    </Page>
  );
}
