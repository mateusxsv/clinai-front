// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { EntradaPublica } from "../componentes/EntradaPublica";
import { Book } from "../paginas/Agendamento";
import { service } from "../servicos/api";
import { emptyHealth } from "../dominio/saude";
const state = vi.hoisted(() => ({
  ready: false,
  profile: null as any,
  report: undefined,
  setReport: vi.fn(),
}));
vi.mock("../estado", () => ({ useApp: () => state }));
const medico = {
  id: "medico-1",
  name: "Dra. Ana",
  specialty: "Clínica geral",
  clinic: "Central",
  initials: "AS",
  plans: [],
};
beforeEach(() => {
  window.scrollTo = vi.fn();
  state.ready = false;
  state.profile = null;
  state.setReport.mockClear();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function entrada() {
  return (
    <MemoryRouter>
      <Routes>
        <Route
          path="/"
          element={
            <EntradaPublica>
              <p>Bem-vindo</p>
            </EntradaPublica>
          }
        />
        <Route path="/inicio" element={<p>Área paciente</p>} />
        <Route path="/medico" element={<p>Área médico</p>} />
      </Routes>
    </MemoryRouter>
  );
}
it.each([
  ["patient", "Área paciente"],
  ["doctor", "Área médico"],
])("aguarda sessão e reabre na área de %s", async (role, text) => {
  const view = render(entrada());
  expect(screen.getByRole("status").textContent).toContain("Verificando");
  expect(screen.queryByText("Bem-vindo")).toBeNull();
  state.ready = true;
  state.profile = { role };
  view.rerender(entrada());
  await screen.findByText(text);
});
it("mantém a entrada pública quando não existe sessão", () => {
  state.ready = true;
  render(entrada());
  expect(screen.getByText("Bem-vindo")).toBeTruthy();
});
function booking() {
  state.ready = true;
  state.profile = { name: "Paciente", health: emptyHealth };
  return render(
    <MemoryRouter initialEntries={["/medicos/medico-1"]}>
      <Routes>
        <Route path="/medicos/:id" element={<Book />} />
      </Routes>
    </MemoryRouter>,
  );
}
it("permite tentar novamente ao falhar o carregamento do médico", async () => {
  vi.spyOn(service, "getDoctors")
    .mockRejectedValueOnce(new Error("Sem conexão"))
    .mockResolvedValue([medico]);
  vi.spyOn(service, "getSlots").mockResolvedValue([]);
  booking();
  await screen.findByText("Sem conexão");
  await userEvent.click(
    screen.getByRole("button", { name: "Tentar novamente" }),
  );
  await screen.findByRole("heading", { name: "Escolha um horário" });
  expect(
    (screen.getByLabelText("Forma de atendimento") as HTMLSelectElement).value,
  ).toBe("Particular");
});
it("atualiza horários após conflito e permite concluir uma nova tentativa", async () => {
  const user = userEvent.setup();
  vi.spyOn(service, "getDoctors").mockResolvedValue([medico]);
  const slots = vi
    .spyOn(service, "getSlots")
    .mockResolvedValueOnce(["09:00", "10:00"])
    .mockResolvedValue(["10:00"]);
  const book = vi
    .spyOn(service, "book")
    .mockRejectedValueOnce(new Error("Horário ocupado"))
    .mockImplementation(async (v) => ({
      ...v,
      id: "consulta-1",
      status: "scheduled",
      reviewed: false,
    }));
  booking();
  await user.click(await screen.findByRole("button", { name: "09:00" }));
  await user.click(
    screen.getByRole("button", { name: "Continuar com o agendamento" }),
  );
  await user.click(
    screen.getByRole("button", { name: "Confirmar agendamento" }),
  );
  await screen.findByText("Horário ocupado");
  await waitFor(() =>
    expect(
      slots.mock.calls.filter((call) => call[1] === slots.mock.calls[0][1]),
    ).toHaveLength(2),
  );
  expect(screen.queryByRole("button", { name: "09:00" })).toBeNull();
  expect(state.setReport).not.toHaveBeenCalled();
  await user.click(await screen.findByRole("button", { name: "10:00" }));
  await user.click(
    screen.getByRole("button", { name: "Continuar com o agendamento" }),
  );
  await user.dblClick(
    screen.getByRole("button", { name: "Confirmar agendamento" }),
  );
  await screen.findByText("Seu horário está reservado");
  expect(book).toHaveBeenCalledTimes(2);
  expect(book.mock.calls[1][0]).toMatchObject({
    time: "10:00",
    plan: "Particular",
  });
  expect(state.setReport).toHaveBeenCalledWith(undefined);
});

it("marca dias vazios em vermelho sem confundir falha de conexão com indisponibilidade", async () => {
  vi.spyOn(service, "getDoctors").mockResolvedValue([medico]);
  let count = 0;
  vi.spyOn(service, "getSlots").mockImplementation(async () => {
    count++;
    if (count === 2) throw new Error("Sem conexão");
    return count === 3 ? ["08:00", "08:30"] : [];
  });
  booking();
  await waitFor(() =>
    expect(
      screen.getAllByRole("button", { name: /Indisponível/ }).length,
    ).toBeGreaterThan(0),
  );
  expect(
    screen
      .getAllByRole("button", { name: /Indisponível/ })[0]
      .classList.contains("date-unavailable"),
  ).toBe(true);
  await screen.findByText("Verificar");
  expect(
    screen
      .getByText("Verificar")
      .closest("button")!
      .classList.contains("date-unavailable"),
  ).toBe(false);
  await screen.findByText("2 horários");
});
