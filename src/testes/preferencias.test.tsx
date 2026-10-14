// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "../estado";
import { Configuracoes } from "../paginas/Configuracoes";
import { Login } from "../paginas/Autenticacao";
import { Doctors } from "../paginas/Agendamento";
import { service } from "../servicos/api";
import { Field } from "../componentes/interface";
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.scrollTo = vi.fn();
  vi.stubEnv("VITE_API_BASE_URL", "https://api.example.com");
  document.getElementById("clinai-vlibras")?.remove();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function mount(children = <Configuracoes />) {
  return render(
    <MemoryRouter>
      <Provider>{children}</Provider>
    </MemoryRouter>,
  );
}
it("ativa recursos, persiste escolhas e suspende seus efeitos ao desmarcar", async () => {
  const user = userEvent.setup();
  const view = mount();
  expect(
    (screen.getByLabelText(/Ampliar o texto/) as HTMLInputElement).closest(
      "fieldset",
    )?.disabled,
  ).toBe(true);
  await user.click(screen.getByLabelText(/Quero usar recursos/));
  await user.click(screen.getByLabelText(/Ampliar o texto/));
  await user.click(screen.getByLabelText(/Aumentar o contraste/));
  await user.click(screen.getByRole("button", { name: "Escuro" }));
  expect(document.querySelector(".app.large")).toBeTruthy();
  expect(document.documentElement.dataset.contraste).toBe("true");
  view.unmount();
  mount();
  expect(
    (screen.getByLabelText(/Ampliar o texto/) as HTMLInputElement).checked,
  ).toBe(true);
  expect(document.documentElement.dataset.theme).toBe("dark");
  await user.click(screen.getByLabelText(/Quero usar recursos/));
  expect(document.querySelector(".app.large")).toBeNull();
  expect(document.documentElement.dataset.contraste).toBe("false");
  await user.click(screen.getByLabelText(/Quero usar recursos/));
  expect(document.querySelector(".app.large")).toBeTruthy();
});
it("carrega Libras somente ao optar e não duplica o script", async () => {
  const user = userEvent.setup();
  mount();
  expect(document.getElementById("clinai-vlibras")).toBeNull();
  await user.click(screen.getByLabelText(/Quero usar recursos/));
  await user.click(screen.getByLabelText(/Ativar tradução em Libras/));
  expect(document.querySelectorAll("#clinai-vlibras").length).toBe(1);
  await user.click(screen.getByLabelText(/Quero usar recursos/));
  expect(document.documentElement.dataset.libras).toBe("false");
  await user.click(screen.getByLabelText(/Quero usar recursos/));
  expect(document.querySelectorAll("#clinai-vlibras").length).toBe(1);
});
it("tolera preferências inválidas e remove a sessão da antiga demonstração", async () => {
  localStorage.setItem("clinai:acessibilidade", '{"ativa":"false"}');
  sessionStorage.setItem("clinai:session", '{"name":"Identidade local"}');
  mount();
  expect(
    (screen.getByLabelText(/Quero usar recursos/) as HTMLInputElement).checked,
  ).toBe(false);
  await waitFor(() =>
    expect(sessionStorage.getItem("clinai:session")).toBeNull(),
  );
});
it("mantém o login padrão com aviso quando a integração está indisponível", () => {
  mount(<Login />);
  expect(screen.getByLabelText("E-mail")).toBeTruthy();
  expect(screen.getByLabelText("Senha")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Entrar" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Esqueci minha senha" })).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toContain("serviço de acesso está indisponível");
  expect(screen.queryByRole("link", { name: "Consultar profissionais" })).toBeNull();
  expect(screen.queryByText(/Entrar na demonstração/)).toBeNull();
});
it("mostra a falha do serviço dentro do formulário e preserva os campos", async () => {
  const user = userEvent.setup();
  const login = vi.spyOn(service, "login").mockRejectedValue(new Error("Não foi possível conectar ao serviço."));
  mount(<Login />);
  await user.type(screen.getByLabelText("E-mail"), "paciente@example.com");
  await user.type(screen.getByLabelText("Senha"), "senha123");
  await user.click(screen.getByRole("button", { name: "Entrar" }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toBe("Não foi possível conectar ao serviço."));
  expect(login).toHaveBeenCalledWith("paciente@example.com", "senha123", "patient");
  expect((screen.getByLabelText("E-mail") as HTMLInputElement).value).toBe("paciente@example.com");
  expect((screen.getByLabelText("Senha") as HTMLInputElement).type).toBe("password");
  expect((screen.getByRole("button", { name: "Entrar" }) as HTMLButtonElement).disabled).toBe(false);
});
it("exibe médicos reais sem avaliações e preços fictícios", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response(
          '[{"_id":"abc","nome":"Ana Silva","especialidade":"Cardiologia"}]',
        ),
      ),
  );
  mount(<Doctors />);
  await screen.findByRole("heading", { name: "Ana Silva" });
  expect(screen.queryByText(/avaliações/)).toBeNull();
  expect(screen.queryByText(/R\$/)).toBeNull();
  expect(
    screen.getByText("Agendamento online ainda indisponível."),
  ).toBeTruthy();
});
it("permite revelar e ocultar senha preservando o valor", async () => {
  const user = userEvent.setup();
  render(<Field label="Senha" type="password" defaultValue="exemplo123" />);
  await user.click(screen.getByRole("button", { name: "Mostrar senha" }));
  expect((screen.getByLabelText("Senha") as HTMLInputElement).type).toBe(
    "text",
  );
  await user.click(screen.getByRole("button", { name: "Ocultar senha" }));
  expect((screen.getByLabelText("Senha") as HTMLInputElement).value).toBe(
    "exemplo123",
  );
});
