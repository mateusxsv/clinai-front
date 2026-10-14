// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { httpService, request, service } from "../servicos/api";
beforeEach(() => vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com"));
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("Contrato real do backend", () => {
  it("consulta /medicos e converte o cadastro sem inventar valores", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValue(
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
    expect(fetcher.mock.calls[0][0]).toBe("https://api.example.com/medicos");
    expect(fetcher.mock.calls[0][1].credentials).toBe("omit");
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
  it("não acessa rede nem cria sessão nos fluxos ausentes no servidor", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    expect(await service.getSession()).toBeNull();
    await expect(
      service.login("a@example.com", "senha", "patient"),
    ).rejects.toMatchObject({ status: 501 });
    await expect(service.getAppointments()).rejects.toMatchObject({
      status: 501,
    });
    await expect(service.getSlots("abc", "2026-11-02")).rejects.toMatchObject({
      status: 501,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("exige URL HTTP sem credenciais e nunca usa MongoDB no navegador", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    for (const url of [
      "",
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
    await expect(request("/medicos")).rejects.toThrow("Serviço indisponível");
    await expect(request("/medicos")).resolves.toBeUndefined();
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
