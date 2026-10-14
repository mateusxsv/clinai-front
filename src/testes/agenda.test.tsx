// @vitest-environment jsdom
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { DoctorAgenda, getNextAppointment } from "../paginas/Medico";
import { service } from "../servicos/api";
import { emptyHealth } from "../dominio/saude";
import type { Appointment } from "../dominio/tipos";
vi.mock("../estado", () => ({
  useApp: () => ({
    profile: { id: "medico-1", name: "Dra. Ana", role: "doctor" },
  }),
}));
const now = Date.parse("2099-05-10T10:00:00-03:00");
function consulta(id: string, patch: Partial<Appointment> = {}): Appointment {
  return {
    id,
    doctorId: "medico-1",
    patientName: id,
    date: "2099-05-11",
    time: "09:00",
    status: "scheduled",
    reviewed: false,
    plan: "",
    health: emptyHealth,
    ...patch,
  };
}
beforeEach(() => {
  window.scrollTo = vi.fn();
  vi.spyOn(Date, "now").mockReturnValue(now);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("seleciona só a próxima consulta do médico, respeitando UTC−3 e descartando canceladas", () => {
  const proxima = consulta("Próxima", {
    date: "2099-05-10",
    time: "10:30",
    status: "confirmed",
  });
  expect(
    getNextAppointment(
      [
        consulta("Outro médico", {
          doctorId: "medico-2",
          date: "2099-05-10",
          time: "10:01",
        }),
        consulta("Cancelada", {
          date: "2099-05-10",
          time: "10:02",
          status: "cancelled",
        }),
        consulta("Passada", { date: "2099-05-10", time: "09:59" }),
        consulta("Inválida", { date: "inválida" }),
        consulta("Amanhã"),
        proxima,
      ],
      "medico-1",
      now,
    ),
  ).toBe(proxima);
  expect(getNextAppointment([], "medico-1", now)).toBeUndefined();
});
it("abre o resumo e muda a data da agenda para o próximo atendimento", async () => {
  vi.spyOn(service, "getAppointments").mockResolvedValue([
    consulta("Paciente da próxima consulta"),
  ]);
  const user = userEvent.setup();
  render(
    <MemoryRouter>
      <DoctorAgenda />
    </MemoryRouter>,
  );
  await user.click(await screen.findByRole("button", { name: "Abrir resumo" }));
  expect(
    (screen.getByLabelText("Data da agenda") as HTMLInputElement).value,
  ).toBe("2099-05-11");
  const resumo = screen.getByRole("heading", {
    name: "Resumo de Paciente da próxima consulta",
  });
  await waitFor(() => expect(document.activeElement).toBe(resumo));
});
it("não apresenta agenda vazia quando o serviço falha", async () => {
  vi.spyOn(service, "getAppointments").mockRejectedValue(
    new Error("Falha de conexão"),
  );
  render(
    <MemoryRouter>
      <DoctorAgenda />
    </MemoryRouter>,
  );
  await screen.findByText("Falha de conexão");
  expect(
    screen.getByText("Não foi possível consultar o próximo atendimento."),
  ).toBeTruthy();
  expect(screen.queryByText("Não há consultas futuras agendadas.")).toBeNull();
});
