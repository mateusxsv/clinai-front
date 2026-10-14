import {
  useEffect,
  useState,
  type ReactNode,
  type InputHTMLAttributes,
} from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Stethoscope,
  CalendarDays,
  UserRound,
  LogOut,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react";
import { useApp } from "../estado";
import { service } from "../servicos/api";
export function Button({
  children,
  onClick,
  secondary = false,
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  secondary?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      className={"button " + (secondary ? "secondary" : "")}
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
      {children}
    </button>
  );
}
export function Field({
  label,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="field">
      <span>{label}</span>
      <span className="input-wrap">
        <input
          autoCapitalize={props.type === "email" ? "none" : undefined}
          inputMode={
            props.type === "email"
              ? "email"
              : props.type === "tel"
                ? "tel"
                : undefined
          }
          {...props}
          type={props.type === "password" && visible ? "text" : props.type}
        />
        {props.type === "password" && (
          <button
            className="password-toggle"
            type="button"
            aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={visible}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </span>
    </label>
  );
}
export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  options: string[];
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={"card " + className}>{children}</section>;
}
export function Page({
  title,
  subtitle,
  back,
  children,
  narrow = false,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  children: ReactNode;
  narrow?: boolean;
}) {
  const location = useLocation();
  useEffect(() => {
    document.title = title + " • ClinAi";
    window.scrollTo(0, 0);
    document.getElementById("page-title")?.focus();
  }, [location.pathname, title]);
  return (
    <>
      <header className="page-head">
        {back && (
          <Link className="back" to={back}>
            <ArrowLeft size={17} /> Voltar
          </Link>
        )}
        <h1 tabIndex={-1} id="page-title">
          {title}
        </h1>
        {subtitle && <p>{subtitle}</p>}
      </header>
      <div className={"page-body " + (narrow ? "narrow" : "")}>{children}</div>
    </>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <div role="alert" className="error">
      {message}
    </div>
  ) : null;
}
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível continuar. Tente novamente.",
      );
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}
export function Layout({ children }: { children: ReactNode }) {
  const { profile, setProfile, setReport } = useApp();
  const { busy, error, run } = useAction();
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  const { pathname } = useLocation();
  const doctor = profile?.role === "doctor";
  const isActive = (url: string) =>
    pathname === url ||
    pathname.startsWith(url + "/") ||
    (url === "/perfil" && pathname === "/historico") ||
    (url === "/inicio" && pathname === "/triagem");
  const nav = doctor
    ? ([
        ["/medico", "Agenda", CalendarDays],
        ["/disponibilidade", "Disponibilidade", Stethoscope],
        ["/perfil", "Perfil", UserRound],
      ] as const)
    : ([
        ["/inicio", "Início", Home],
        ["/medicos", "Médicos", Stethoscope],
        ["/consultas", "Consultas", CalendarDays],
        ["/perfil", "Perfil", UserRound],
      ] as const);
  return (
    <>
      <a className="skip" href="#main">
        Pular para o conteúdo
      </a>
      <aside className="sidebar">
        <Link
          to={profile ? (doctor ? "/medico" : "/inicio") : "/"}
          className="brand"
        >
          <img
            className="brand-logo brand-logo-full"
            src="/assets/logo-white.png"
            alt="ClinAi"
          />
        </Link>
        <p className="sidebar-label">
          {doctor ? "ÁREA DO PROFISSIONAL" : "SEU ESPAÇO DE CUIDADO"}
        </p>
        {profile ? (
          <nav aria-label="Navegação principal">
            {nav.map(([url, label, Icon]) => (
              <Link
                className={isActive(url) ? "active" : ""}
                aria-current={isActive(url) ? "page" : undefined}
                key={url}
                to={url}
              >
                <Icon size={21} />
                {label}
              </Link>
            ))}
          </nav>
        ) : (
          <div className="side-intro">
            <h2>
              Seu cuidado
              <br />
              começa aqui.
            </h2>
            <p>
              Mais clareza antes da consulta. Mais tempo para cuidar de você.
            </p>
          </div>
        )}
        <div className="sidebar-bottom">
          <Link
            className="settings-link"
            to="/configuracoes"
            aria-current={
              pathname.startsWith("/configuracoes") ? "page" : undefined
            }
          >
            <Settings size={20} /> Configurações
          </Link>
          {profile && (
            <>
              <div className="user">
                <span className="avatar small">
                  {profile.name.replace(/^Dr\. /, "").slice(0, 1)}
                </span>
                <div>
                  <strong>{profile.name}</strong>
                  <small>{doctor ? "Médico" : "Paciente"}</small>
                </div>
              </div>
              <button
                className="logout"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await service.logout();
                    setProfile(null);
                    setReport(undefined);
                  })
                }
              >
                <LogOut size={18} />
                Sair da conta
              </button>
            </>
          )}
          <small>ClinAi • Seu espaço de cuidado</small>
        </div>
      </aside>
      <div className="workspace">
        <div className="topbar">
          <Link
            className="mobile-brand"
            to={profile ? (doctor ? "/medico" : "/inicio") : "/"}
            aria-label="ClinAi — início"
          >
            <img className="brand-logo" src="/assets/logo.png" alt="" />
            <span>ClinAi</span>
          </Link>
          <span className="portal-label">
            {doctor ? "Portal do profissional" : "Seu espaço de cuidado"}
          </span>
          <div className="topbar-actions">
            <Link
              className="settings-link"
              to="/configuracoes"
              aria-label="Configurações de aparência e acessibilidade"
            >
              <Settings size={20} />
              <span>Configurações</span>
            </Link>
          </div>
        </div>
        {!online && (
          <div className="connection-banner" role="status">
            Você está sem conexão. Reconecte-se para salvar alterações.
          </div>
        )}

        <ErrorMessage message={error} />
        <main id="main">{children}</main>
        <footer>ClinAi · Cuidado que começa com escuta.</footer>
      </div>
      {profile && (
        <nav className="mobile-nav" aria-label="Navegação no celular">
          {nav.map(([url, label, Icon]) => (
            <Link
              className={isActive(url) ? "active" : ""}
              aria-current={isActive(url) ? "page" : undefined}
              to={url}
              key={url}
            >
              <span className="nav-icon">
                <Icon size={21} aria-hidden="true" />
              </span>
              <span>{label === "Disponibilidade" ? "Horários" : label}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
export function Forward({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link className="button" to={to}>
      {children}
      <ArrowRight size={18} />
    </Link>
  );
}
