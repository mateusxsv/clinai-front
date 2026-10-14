// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { httpService, request, service } from "../servicos/api";
beforeEach(() => vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com"));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Contrato real do backend", () => {
  it("consulta /doctors e converte o cadastro sem inventar valores", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            _id: "abc",
            nome: "Ana Silva",
            especialidade: "Cardiologia",
            clinica: "Clínica Central",
          },
        ]),
      ),
    );
    vi.stubGlobal("fetch", fetcher);
    const [medico] = await service.getDoctors();
    expect(fetcher.mock.calls[0][0]).toBe("https://api.example.com/doctors");
    expect(fetcher.mock.calls[0][1].credentials).toBe("include");
    expect(medico).toMatchObject({
      id: "abc",
      name: "Ana Silva",
      specialty: "Cardiologia",
      plans: [],
    });
    expect(medico.rating).toBeUndefined();
    expect(medico.price).toBeUndefined();
    expect(service).toBe(httpService);
  });
  it("preserva lista vazia e rejeita respostas incompatíveis", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(new Response("[]"))
        .mockResolvedValueOnce(new Response("{}")),
    );
    expect(await service.getDoctors()).toEqual([]);
    await expect(service.getDoctors()).rejects.toMatchObject({ status: 502 });
  });
  it("restaura a sessão pela API e mantém recursos não implementados indisponíveis", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", fetcher);
    expect(await service.getSession()).toBeNull();
    expect(fetcher.mock.calls[0][0]).toBe("https://api.example.com/me");
    expect(fetcher.mock.calls[0][1].cache).toBe("no-store");
    await expect(service.recover("a@example.com")).rejects.toMatchObject({
      status: 501,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("usa o proxy local quando não há URL configurada", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    const fetcher = vi.fn().mockResolvedValue(new Response("[]"));
    vi.stubGlobal("fetch", fetcher);
    await service.getDoctors();
    expect(fetcher.mock.calls[0][0]).toBe("/api/doctors");
  });
  it("exige URL HTTP sem credenciais e nunca usa MongoDB no navegador", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    for (const url of [
      "mongodb+srv://exemplo.invalid",
      "https://usuario:senha@example.com",
    ]) {
      vi.stubEnv("VITE_API_BASE_URL", url);
      await expect(service.getDoctors()).rejects.toMatchObject({ status: 503 });
    }
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("entende mensagens em português e respostas sem corpo", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response('{"mensagem":"Serviço indisponível"}', { status: 503 }),
        )
        .mockResolvedValueOnce(new Response(null, { status: 204 })),
    );
    await expect(request("/doctors")).rejects.toThrow("Serviço indisponível");
    await expect(request("/doctors")).resolves.toBeUndefined();
  });
  it("trata falha de rede e JSON inválido como erro, sem resultados locais", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError("Failed to fetch"))
        .mockResolvedValueOnce(new Response("<html>erro</html>")),
    );
    await expect(service.getDoctors()).rejects.toThrow(
      "Não foi possível conectar",
    );
    await expect(service.getDoctors()).rejects.toMatchObject({ status: 502 });
  });
});

it("valida horários e remove duplicados e horários passados", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(new Response('["10:00","09:00","10:00"]'))
      .mockResolvedValueOnce(new Response('["25:00"]'))
      .mockResolvedValueOnce(new Response('["10:00"]')),
  );
  expect(await service.getSlots("abc", "2099-05-10")).toEqual([
    "09:00",
    "10:00",
  ]);
  await expect(service.getSlots("abc", "2099-05-10")).rejects.toMatchObject({
    status: 502,
  });
  expect(await service.getSlots("abc", "2000-05-10")).toEqual([]);
});
it("consulta e salva disponibilidade usando a sessão", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce(new Response("[]"))
    .mockResolvedValueOnce(new Response("{}"));
  vi.stubGlobal("fetch", fetcher);
  expect(await service.getAvailability()).toEqual([]);
  const value = {
    date: "2099-05-10",
    start: "08:00",
    end: "12:00",
    duration: 30,
  };
  await service.saveAvailability(value);
  expect(fetcher.mock.calls[1][0]).toBe("https://api.example.com/availability");
  expect(fetcher.mock.calls[1][1]).toMatchObject({
    method: "POST",
    credentials: "include",
    body: JSON.stringify(value),
  });
});
