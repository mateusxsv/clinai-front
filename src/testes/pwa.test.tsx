// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PwaProvider, InstalacaoPwa, AvisosPwa } from "../componentes/Pwa";
import { Provider, useApp } from "../estado";
import { service } from "../servicos/api";
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function montar() {
  return render(
    <PwaProvider>
      <InstalacaoPwa />
      <AvisosPwa />
    </PwaProvider>,
  );
}
it("oferece instalação apenas após o convite e não repete um convite consumido", async () => {
  montar();
  expect(screen.queryByRole("button", { name: "Instalar ClinAi" })).toBeNull();
  const evento = new Event("beforeinstallprompt", { cancelable: true });
  const prompt = vi.fn().mockResolvedValue(undefined);
  Object.assign(evento, {
    prompt,
    userChoice: Promise.resolve({ outcome: "dismissed" }),
  });
  act(() => window.dispatchEvent(evento));
  expect(evento.defaultPrevented).toBe(true);
  await userEvent.click(
    screen.getByRole("button", { name: "Instalar ClinAi" }),
  );
  expect(prompt).toHaveBeenCalledTimes(1);
  expect(screen.queryByRole("button", { name: "Instalar ClinAi" })).toBeNull();
  act(() => window.dispatchEvent(new Event("appinstalled")));
  expect(screen.getByText(/já está aberta como aplicativo/)).toBeTruthy();
});
it("mostra e remove o aviso conforme a conectividade", () => {
  const online = vi.spyOn(navigator, "onLine", "get");
  online.mockReturnValue(true);
  montar();
  online.mockReturnValue(false);
  act(() => window.dispatchEvent(new Event("offline")));
  expect(screen.getByRole("status").textContent).toContain("Sem conexão");
  online.mockReturnValue(true);
  act(() => window.dispatchEvent(new Event("online")));
  expect(screen.queryByRole("status")).toBeNull();
});
it("encerra a restauração de sessão mesmo sem backend", async () => {
  vi.spyOn(service, "getSession").mockRejectedValue(new Error("Sem rede"));
  function Estado() {
    const { ready, profile } = useApp();
    return <p>{ready && !profile ? "Pronto sem sessão" : "Carregando"}</p>;
  }
  render(
    <Provider>
      <Estado />
    </Provider>,
  );
  expect(await screen.findByText("Pronto sem sessão")).toBeTruthy();
});
