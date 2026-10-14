import { EntradaPublica } from "./componentes/EntradaPublica";
import { PwaProvider, AvisosPwa } from "./componentes/Pwa";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "@fontsource/poppins/latin-400.css";
import "@fontsource/poppins/latin-500.css";
import "@fontsource/poppins/latin-600.css";
import "@fontsource/poppins/latin-700.css";
import "./estilos.css";
import { Provider, useApp } from "./estado";
import { Layout, Page, Forward } from "./componentes/interface";
import {
  Welcome,
  Access,
  Login,
  Recover,
  Register,
} from "./paginas/Autenticacao";
import { Home, Profile, History } from "./paginas/Paciente";
import { Doctors, Book, Appointments } from "./paginas/Agendamento";
import { Triage } from "./paginas/PreTriagem";
import { Configuracoes } from "./paginas/Configuracoes";
import { DoctorAgenda, AvailabilityPage } from "./paginas/Medico";
function Protected({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: "patient" | "doctor";
}) {
  const { profile, ready } = useApp();
  if (!ready) return <p role="status">Verificando acesso…</p>;
  if (!profile) return <Navigate to="/entrar" replace />;
  if (role && profile.role !== role)
    return (
      <Navigate
        to={profile.role === "doctor" ? "/medico" : "/inicio"}
        replace
      />
    );
  return children;
}
function App() {
  return (
    <Layout>
      <AvisosPwa />
      <Routes>
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route
          path="/configuracoes/acessibilidade"
          element={<Configuracoes />}
        />
        <Route
          path="/"
          element={
            <EntradaPublica>
              <Welcome />
            </EntradaPublica>
          }
        />
        <Route
          path="/acesso"
          element={
            <EntradaPublica>
              <Access />
            </EntradaPublica>
          }
        />
        <Route
          path="/entrar"
          element={
            <EntradaPublica>
              <Login />
            </EntradaPublica>
          }
        />
        <Route
          path="/recuperar"
          element={
            <EntradaPublica>
              <Recover />
            </EntradaPublica>
          }
        />
        <Route
          path="/cadastro"
          element={
            <EntradaPublica>
              <Register />
            </EntradaPublica>
          }
        />
        <Route
          path="/inicio"
          element={
            <Protected role="patient">
              <Home />
            </Protected>
          }
        />
        <Route
          path="/perfil"
          element={
            <Protected>
              <Profile />
            </Protected>
          }
        />
        <Route
          path="/historico"
          element={
            <Protected role="patient">
              <History />
            </Protected>
          }
        />
        <Route
          path="/triagem"
          element={
            <Protected role="patient">
              <Triage />
            </Protected>
          }
        />
        <Route path="/medicos" element={<Doctors />} />
        <Route
          path="/medicos/:id"
          element={
            <Protected role="patient">
              <Book />
            </Protected>
          }
        />
        <Route
          path="/consultas"
          element={
            <Protected role="patient">
              <Appointments />
            </Protected>
          }
        />
        <Route
          path="/medico"
          element={
            <Protected role="doctor">
              <DoctorAgenda />
            </Protected>
          }
        />
        <Route
          path="/disponibilidade"
          element={
            <Protected role="doctor">
              <AvailabilityPage />
            </Protected>
          }
        />
        <Route
          path="*"
          element={
            <Page title="Página não encontrada">
              <Forward to="/">Voltar ao início</Forward>
            </Page>
          }
        />
      </Routes>
    </Layout>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <PwaProvider>
        <Provider>
          <App />
        </Provider>
      </PwaProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
