import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  MapPin,
  Star,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  Heart,
} from "lucide-react";
import {
  Button,
  Card,
  ErrorMessage,
  Field,
  Forward,
  Page,
  Select,
  useAction,
} from "../componentes/interface";
import { service, recursos } from "../servicos/api";
import { useApp } from "../estado";
import type { Appointment, Doctor, Availability } from "../dominio/tipos";
export const dateLabel = (date: string) =>
  new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
export function nextDates() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
}
export function getTimes(v?: Availability) {
  if (v && (!Number.isFinite(v.duration) || v.duration <= 0)) return [];
  if (!v) return [];
  const start = Number(v.start.slice(0, 2)) * 60 + Number(v.start.slice(3));
  const end = Number(v.end.slice(0, 2)) * 60 + Number(v.end.slice(3));
  const times = [];
  for (let t = start; t + v.duration <= end; t += v.duration)
    times.push(
      `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`,
    );
  return times;
}
export function DoctorIdentity({ doctor }: { doctor: Doctor }) {
  return (
    <div className="doctor-identity">
      <div>
        <h2>{doctor.name}</h2>
        <p className="specialty-label">{doctor.specialty}</p>
        <p>
          <MapPin size={15} /> {doctor.clinic}
        </p>
        {doctor.rating !== undefined && doctor.reviews !== undefined && (
          <span className="rating">
            <Star size={15} fill="currentColor" /> {doctor.rating.toFixed(1)}{" "}
            <small>({doctor.reviews} avaliações)</small>
          </span>
        )}
      </div>
      {doctor.image ? (
        <img className="doctor-image" src={doctor.image} alt="" />
      ) : (
        <span className="avatar">{doctor.initials}</span>
      )}
    </div>
  );
}
export function Doctors() {
  const [q, setQ] = useSearchParams();
  const { profile } = useApp();
  const favoriteKey = `clinai:favorites:${profile?.id || "visitante"}`;
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const value = JSON.parse(localStorage.getItem(favoriteKey) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  });
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const toggleFavorite = (id: string) => {
    const value = favorites.includes(id)
      ? favorites.filter((v) => v !== id)
      : [...favorites, id];
    setFavorites(value);
    try {
      localStorage.setItem(favoriteKey, JSON.stringify(value));
    } catch {}
  };

  const [term, setTerm] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [plan, setPlan] = useState("Todos");
  const [sort, setSort] = useState("Nome");
  const [list, setList] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const { error, run } = useAction();
  const specialty = q.get("especialidade") || "Todas";
  const load = () =>
    run(async () => {
      setLoading(true);
      try {
        setList(await service.getDoctors());
      } finally {
        setLoading(false);
      }
    });
  useEffect(() => {
    void load();
  }, []);
  const results = list
    .filter(
      (d) =>
        (!onlyFavorites || favorites.includes(d.id)) &&
        (specialty === "Todas" || d.specialty === specialty) &&
        (plan === "Todos" || d.plans.includes(plan)) &&
        `${d.name} ${d.clinic} ${d.specialty}`
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .includes(
            term
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase(),
          ),
    )
    .sort((a, b) =>
      sort === "Menor valor particular"
        ? (a.price ?? Infinity) - (b.price ?? Infinity)
        : sort === "Mais bem avaliados"
          ? (b.rating ?? -1) - (a.rating ?? -1)
          : a.name.localeCompare(b.name, "pt-BR"),
    );
  return (
    <Page
      title="Encontrar atendimento"
      subtitle="Encontre profissionais por nome, clínica ou especialidade"
    >
      <Card className="filters">
        <div className="search-field">
          <Search size={20} />
          <Field
            label="Procure uma clínica ou médico"
            placeholder="Nome, clínica ou especialidade"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="filter-toggle"
          aria-expanded={filtersOpen}
          aria-controls="doctor-filters"
          onClick={() => setFiltersOpen(!filtersOpen)}
        >
          <SlidersHorizontal size={19} />
          <span>
            Filtros
            {specialty !== "Todas" || plan !== "Todos"
              ? ` (${Number(specialty !== "Todas") + Number(plan !== "Todos")})`
              : ""}
          </span>
          <ChevronDown size={18} />
        </button>
        <div
          id="doctor-filters"
          className={"filter-options" + (filtersOpen ? " is-open" : "")}
        >
          <Select
            label="Especialidade"
            value={specialty}
            onChange={(v) => setQ(v === "Todas" ? {} : { especialidade: v })}
            options={[
              "Todas",
              ...new Set([
                ...list.map((d) => d.specialty),
                ...(specialty !== "Todas" ? [specialty] : []),
              ]),
            ]}
          />
          <Select
            label="Convênio"
            value={plan}
            onChange={setPlan}
            options={["Todos", ...new Set(list.flatMap((d) => d.plans))]}
          />
        </div>
      </Card>
      <button
        className="favorite-filter"
        aria-pressed={onlyFavorites}
        onClick={() => setOnlyFavorites(!onlyFavorites)}
      >
        <Heart size={18} /> Meus favoritos ({favorites.length})
      </button>
      <div className="results-heading">
        <p>
          {error
            ? "A busca não pôde ser concluída"
            : loading
              ? "Buscando profissionais…"
              : `${results.length} ${results.length === 1 ? "profissional encontrado" : "profissionais encontrados"}`}
        </p>
        <Select
          label="Ordenar por"
          value={sort}
          onChange={setSort}
          options={[
            "Nome",
            ...(list.some((d) => d.rating !== undefined)
              ? ["Mais bem avaliados"]
              : []),
            ...(list.some((d) => d.price !== undefined)
              ? ["Menor valor particular"]
              : []),
          ]}
        />
      </div>
      <ErrorMessage message={error} />
      {error && <Button onClick={() => void load()}>Tentar novamente</Button>}
      <div className="doctors-grid">
        {results.map((d) => (
          <Card key={d.id}>
            <button
              className="favorite-toggle"
              aria-label={`Favoritar ${d.name}`}
              aria-pressed={favorites.includes(d.id)}
              onClick={() => toggleFavorite(d.id)}
            >
              <Heart
                size={20}
                fill={favorites.includes(d.id) ? "currentColor" : "none"}
              />
            </button>
            <DoctorIdentity doctor={d} />
            <div className="tags">
              {d.plans.map((p) => (
                <span key={p}>{p}</span>
              ))}
            </div>
            {d.price !== undefined && (
              <div className="doctor-price">
                <span>Consulta particular</span>
                <strong>
                  {d.price.toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </strong>
              </div>
            )}
            {recursos.agendamento ? (
              <Forward to={"/medicos/" + d.id}>Ver perfil e horários</Forward>
            ) : (
              <p className="availability-note">
                Agendamento online ainda indisponível.
              </p>
            )}
          </Card>
        ))}
      </div>
      {!loading && !results.length && !error && (
        <Card className="empty">
          <Search size={32} />
          <h2>Nenhum profissional encontrado</h2>
          <p>Tente outra especialidade ou remova os filtros.</p>
          <Button
            secondary
            onClick={() => {
              setQ({});
              setTerm("");
              setPlan("Todos");
              setOnlyFavorites(false);
            }}
          >
            Limpar filtros
          </Button>
        </Card>
      )}
    </Page>
  );
}
export function Book() {
  const { id } = useParams();

  const { profile, report, setReport } = useApp();
  const [doctor, setDoctor] = useState<Doctor>();
  const [loaded, setLoaded] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState("");
  const [refreshSlots, setRefreshSlots] = useState(0);
  const [date, setDate] = useState(nextDates()[0]);
  const [time, setTime] = useState("");
  const [plan, setPlan] = useState("Particular");
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState<Appointment>();
  const { busy, error, run } = useAction();
  useEffect(() => {
    void run(async () => {
      const doctors = await service.getDoctors();
      const found = doctors.find((d) => d.id === id);
      setDoctor(found);
      setPlan(found?.plans[0] || "Particular");
      setLoaded(true);
    });
  }, [id]);
  useEffect(() => {
    let current = true;
    setSlotsLoading(true);
    setSlotsError("");
    setSlots([]);
    setTime("");
    service
      .getSlots(id!, date)
      .then((value) => {
        if (current) setSlots(value);
      })
      .catch((e) => {
        if (current)
          setSlotsError(
            e instanceof Error
              ? e.message
              : "Não foi possível buscar os horários.",
          );
      })
      .finally(() => {
        if (current) setSlotsLoading(false);
      });
    return () => {
      current = false;
    };
  }, [id, date, refreshSlots]);
  if (!doctor)
    return (
      <Page
        title={
          loaded ? "Profissional não encontrado" : "Carregando profissional…"
        }
        back="/medicos"
      >
        <ErrorMessage message={error} />
        <Forward to="/medicos">Ver profissionais</Forward>
      </Page>
    );
  const reserved = (t: string) => !slots.includes(t);
  const submit = () =>
    run(async () => {
      let appointment: Appointment;
      try {
        appointment = await service.book({
          doctorId: doctor.id,
          patientName: profile!.name,
          date,
          time,
          plan,
          health: { ...profile!.health },
          report,
        });
      } catch (error) {
        setConfirm(false);
        setRefreshSlots((v) => v + 1);
        throw error;
      }
      setDone(appointment);
      setReport(undefined);
    });
  return (
    <Page
      title={
        done
          ? "Consulta agendada!"
          : confirm
            ? "Confirmar consulta"
            : doctor.name
      }
      subtitle={
        done
          ? "Tudo pronto para o próximo passo"
          : doctor.specialty + " • " + doctor.clinic
      }
      back="/medicos"
    >
      {done ? (
        <Card className="narrow success-card">
          <CheckCircle2 className="success-icon" />
          <h2>Seu horário está reservado</h2>
          <p>
            {dateLabel(done.date)} às <strong>{done.time}</strong>
          </p>
          <p>
            {doctor.name}
            <br />
            {doctor.clinic}
          </p>
          <span className="status scheduled">Agendada</span>

          <Forward to="/consultas">Ver minhas consultas</Forward>
        </Card>
      ) : (
        <div className="booking-grid booking-flow">
          <Card className="booking-profile">
            <DoctorIdentity doctor={doctor} />
            <details className="doctor-about">
              <summary>Sobre o atendimento e convênios</summary>
              <p>Consulta presencial em {doctor.clinic}.</p>
              <p>
                Atendimento em {doctor.specialty.toLowerCase()}, com escuta e
                acompanhamento individual.
              </p>
              <div className="tags">
                {doctor.plans.map((p) => (
                  <span key={p}>{p}</span>
                ))}
              </div>
              <div className="notice">
                <CalendarDays />
                <p>
                  Seu histórico e o relato de pré-triagem acompanharão esta
                  consulta.
                </p>
              </div>
            </details>
          </Card>
          <Card>
            {confirm ? (
              <>
                <h2>Confira os dados</h2>
                <dl className="summary">
                  <div>
                    <dt>Profissional</dt>
                    <dd>{doctor.name}</dd>
                  </div>
                  <div>
                    <dt>Data e horário</dt>
                    <dd>
                      {dateLabel(date)} às {time}
                    </dd>
                  </div>
                  <div>
                    <dt>Atendimento</dt>
                    <dd>Presencial · {doctor.clinic}</dd>
                  </div>
                  <div>
                    <dt>Pagamento</dt>
                    <dd>
                      {plan}
                      {plan === "Particular" && doctor.price !== undefined
                        ? ` · R$ ${doctor.price}`
                        : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>Resumo de saúde</dt>
                    <dd>
                      {report
                        ? "Histórico e relato atual"
                        : "Histórico de saúde"}
                    </dd>
                  </div>
                </dl>
                <ErrorMessage message={error} />
                <Button disabled={busy} onClick={() => void submit()}>
                  {busy ? "Reservando…" : "Confirmar agendamento"}
                </Button>
                <Button
                  secondary
                  disabled={busy}
                  onClick={() => setConfirm(false)}
                >
                  Alterar data ou horário
                </Button>
              </>
            ) : (
              <>
                <h2>Escolha um horário</h2>
                <p>Selecione o dia e o horário disponíveis.</p>
                <p className="mobile-hint">Deslize para ver mais dias</p>
                <div
                  className="date-grid"
                  role="group"
                  aria-label="Dias disponíveis"
                >
                  {nextDates().map((d) => (
                    <button
                      key={d}
                      aria-label={dateLabel(d)}
                      aria-pressed={date === d}
                      className={date === d ? "selected" : ""}
                      onClick={() => {
                        setDate(d);
                        setTime("");
                      }}
                    >
                      <small>
                        {new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
                          weekday: "short",
                        })}
                      </small>
                      <strong>{d.slice(-2)}</strong>
                      <small>
                        {new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
                          month: "short",
                        })}
                      </small>
                    </button>
                  ))}
                </div>
                <p className="date-caption">{dateLabel(date)}</p>
                <div
                  className="time-grid"
                  role="group"
                  aria-label="Horários disponíveis"
                >
                  {slots.map((t) => (
                    <button
                      disabled={reserved(t)}
                      aria-pressed={time === t}
                      className={time === t ? "selected" : ""}
                      key={t}
                      onClick={() => setTime(t)}
                    >
                      {t}
                      {reserved(t) && <small>Reservado</small>}
                    </button>
                  ))}
                </div>
                {slotsLoading && (
                  <p role="status">Buscando horários disponíveis…</p>
                )}
                <ErrorMessage message={slotsError} />
                {slotsError && (
                  <Button
                    secondary
                    onClick={() => setRefreshSlots((v) => v + 1)}
                  >
                    Buscar horários novamente
                  </Button>
                )}
                {!slotsLoading && !slotsError && !slots.length && (
                  <p role="status">
                    Nenhum horário disponível neste dia. Escolha outra data.
                  </p>
                )}
                <Select
                  label="Forma de atendimento"
                  value={plan}
                  onChange={setPlan}
                  options={doctor.plans}
                />
                <ErrorMessage message={error} />
                <div className="booking-action">
                  <p className="booking-selection" role="status">
                    {time
                      ? `${dateLabel(date)} · ${time}`
                      : "Selecione um horário para continuar"}
                  </p>
                  <Button
                    disabled={!time || reserved(time)}
                    onClick={() => setConfirm(true)}
                  >
                    Continuar com o agendamento
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </Page>
  );
}
export function Appointments() {
  const [list, setList] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filter, setFilter] = useState("Próximas");
  const [selected, setSelected] = useState<string | null>(null);
  const [cancel, setCancel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { busy, error, run } = useAction();
  const load = async () => {
    const [a, d] = await Promise.all([
      service.getAppointments(),
      service.getDoctors(),
    ]);
    setList(a);
    setDoctors(d);
    setLoading(false);
  };
  useEffect(() => {
    void run(load);
  }, []);
  const filtered = list
    .filter((a) =>
      filter === "Canceladas"
        ? a.status === "cancelled"
        : a.status !== "cancelled" &&
          (filter === "Anteriores"
            ? new Date(`${a.date}T${a.time}:00-03:00`).getTime() < Date.now()
            : new Date(`${a.date}T${a.time}:00-03:00`).getTime() >= Date.now()),
    )
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return (
    <Page title="Minhas consultas" subtitle="Seus próximos passos de cuidado">
      <div className="tabs">
        {["Próximas", "Anteriores", "Canceladas"].map((f) => (
          <button
            aria-pressed={filter === f}
            className={filter === f ? "active" : ""}
            key={f}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>
      <ErrorMessage message={error} />
      {error && (
        <Button secondary onClick={() => void run(load)}>
          Tentar novamente
        </Button>
      )}
      {error ? null : loading ? (
        <p role="status">Carregando consultas…</p>
      ) : filtered.length === 0 ? (
        <Card className="empty">
          <CalendarDays size={36} />
          <h2>
            {filter === "Canceladas"
              ? "Nenhuma consulta cancelada"
              : filter === "Anteriores"
                ? "Nenhuma consulta anterior"
                : "Nenhuma consulta agendada"}
          </h2>
          <p>Encontre um profissional e escolha o melhor horário para você.</p>
          <Forward to="/medicos">Encontrar atendimento</Forward>
        </Card>
      ) : (
        filtered.map((a) => {
          const d = doctors.find((d) => d.id === a.doctorId);
          return (
            <Card key={a.id}>
              <div className="appointment-top">
                <div className="date-tile">
                  <strong>{a.date.slice(-2)}</strong>
                  <small>
                    {new Date(a.date + "T12:00:00").toLocaleDateString(
                      "pt-BR",
                      { month: "short" },
                    )}
                  </small>
                </div>
                <div>
                  <span className={"status " + a.status}>
                    {a.status === "scheduled"
                      ? "Agendada"
                      : a.status === "confirmed"
                        ? "Presença confirmada"
                        : "Cancelada"}
                  </span>
                  <h2>{d?.name}</h2>
                  <p>
                    {d?.specialty} · {d?.clinic}
                    <br />
                    {dateLabel(a.date)} às {a.time}
                  </p>
                </div>
              </div>
              <div className="actions">
                <Button
                  secondary
                  onClick={() => setSelected(selected === a.id ? null : a.id)}
                >
                  {selected === a.id ? "Fechar detalhes" : "Ver detalhes"}
                </Button>
                {filter === "Próximas" && a.status === "scheduled" && (
                  <Button
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        await service.updateAppointment(a.id, {
                          status: "confirmed",
                        });
                        await load();
                      })
                    }
                  >
                    Confirmar presença
                  </Button>
                )}
                {filter === "Próximas" && a.status !== "cancelled" && (
                  <button
                    className="danger-link"
                    onClick={() => setCancel(a.id)}
                  >
                    Cancelar consulta
                  </button>
                )}
              </div>
              {selected === a.id && (
                <div className="details">
                  <p>
                    <strong>Paciente:</strong> {a.patientName}
                  </p>
                  <p>
                    <strong>Modalidade:</strong> Presencial
                  </p>
                  <p>
                    <strong>Convênio:</strong> {a.plan}
                  </p>
                  <p>
                    <strong>Informações compartilhadas:</strong> histórico de
                    saúde{a.report ? " e relato de pré-triagem" : ""}.
                  </p>
                </div>
              )}
              {cancel === a.id && (
                <div className="notice warning" role="alert">
                  <div>
                    <h3>Cancelar esta consulta?</h3>
                    <p>
                      O horário será liberado. Para voltar, faça um novo
                      agendamento.
                    </p>
                    <div className="actions">
                      <Button secondary onClick={() => setCancel(null)}>
                        Manter consulta
                      </Button>
                      <Button
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await service.updateAppointment(a.id, {
                              status: "cancelled",
                            });
                            setCancel(null);
                            await load();
                          })
                        }
                      >
                        Confirmar cancelamento
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })
      )}
    </Page>
  );
}
