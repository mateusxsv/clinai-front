/// <reference types="vite/client" />
import type { ClinAiService, Doctor } from "../dominio/tipos";

// Capacidades conferidas em mateusxsv/clinai. Ative novos fluxos somente
// depois de implementar autenticação, autorização e o contrato no servidor.
export const recursos = { autenticacao: true, agendamento: true } as const;
export const mensagemAcesso =
  "O acesso às contas ainda não está disponível. Você pode consultar os profissionais cadastrados e personalizar o site.";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
function enderecoApi() {
  const value = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!value) {
    return "/api";
  }

  // Permite usar /api na Vercel
  if (value.startsWith("/")) {
    return value.replace(/\/$/, "");
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new ApiError("O endereço do serviço de atendimento é inválido.", 503);
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new ApiError("O endereço do serviço de atendimento é inválido.", 503);
  }

  return value.replace(/\/$/, "");
}

export async function request<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const base = enderecoApi();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${base}${path}`, {
      method,
      // A sessão usa cookie; respostas de saúde nunca devem ir para o cache HTTP.
      credentials: "include",
      cache: "no-store",
      headers:
        body === undefined
          ? { Accept: "application/json" }
          : { Accept: "application/json", "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      if (response.status === 401)
        window.dispatchEvent(new Event("clinai:expired"));
      throw new ApiError(
        typeof error?.mensagem === "string"
          ? error.mensagem
          : typeof error?.message === "string"
            ? error.message
            : `Não foi possível concluir a solicitação (${response.status}).`,
        response.status,
      );
    }
    if (response.status === 204) return undefined as T;
    try {
      return await response.json();
    } catch {
      throw new ApiError(
        "O serviço enviou uma resposta inválida. Tente novamente mais tarde.",
        502,
      );
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError")
      throw new Error("O servidor demorou para responder. Tente novamente.");
    if (error instanceof TypeError)
      throw new Error(
        "Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
interface MedicoApi {
  _id: string;
  nome: string;
  especialidade: string;
  clinica?: string;
  foto?: string;
}
function adaptarMedico(value: MedicoApi): Doctor {
  if (
    !value ||
    typeof value._id !== "string" ||
    typeof value.nome !== "string" ||
    typeof value.especialidade !== "string"
  )
    throw new ApiError(
      "O serviço enviou um cadastro de profissional inválido.",
      502,
    );
  let image: string | undefined;
  if (typeof value.foto === "string") {
    try {
      const url = new URL(value.foto);
      if (url.protocol === "https:") image = url.href;
    } catch {
      /* Sem foto pública válida: usar iniciais. */
    }
  }
  return {
    id: value._id,
    name: value.nome,
    specialty: value.especialidade,
    clinic: value.clinica || "Clínica não informada",
    image,
    initials: value.nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join(""),
    plans: [],
  };
}
async function indisponivel(): Promise<never> {
  throw new ApiError(
    "Este recurso ainda não está disponível no serviço de atendimento. Nenhuma alteração foi salva.",
    501,
  );
}
export const httpService: ClinAiService = {
  getSession: async () => {
    try {
      return await request("/me");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return null;
      }

      throw error;
    }
  },

  getDoctors: async () => {
    const values = await request<MedicoApi[]>("/doctors");

    if (!Array.isArray(values)) {
      throw new ApiError("Não foi possível ler a lista de profissionais.", 502);
    }

    return values.map(adaptarMedico);
  },

  getSlots: async (doctorId, date) => {
    const values = await request<unknown>(
      `/doctors/${encodeURIComponent(doctorId)}/slots?date=${encodeURIComponent(date)}`,
    );
    if (
      !Array.isArray(values) ||
      values.some(
        (v) => typeof v !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(v),
      )
    )
      throw new ApiError(
        "O serviço enviou horários inválidos. Tente novamente.",
        502,
      );
    return [...new Set(values as string[])]
      .filter((t) => Date.parse(`${date}T${t}:00-03:00`) > Date.now())
      .sort();
  },

  login: async (email, password, role) => {
    return await request("/auth/login", "POST", {
      email,
      password,
      role,
    });
  },

  register: async (profile, password) => {
    return await request("/auth/register", "POST", {
      ...profile,
      password,
    });
  },

  recover: indisponivel,

  saveProfile: indisponivel,

  getAppointments: async () => {
    return await request("/appointments");
  },

  book: async (input) => {
    return await request("/appointments", "POST", input);
  },

  updateAppointment: async (id, patch) => {
    return await request(`/appointments/${id}`, "PATCH", patch);
  },

  getAvailability: async () => request("/availability"),

  saveAvailability: async (value) => {
    await request("/availability", "POST", value);
  },

  logout: async () => {
    await request("/auth/logout", "POST");
  },
};
export const service = httpService;
