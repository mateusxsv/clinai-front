import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "../estado";

export function EntradaPublica({ children }: { children: ReactNode }) {
  const { ready, profile } = useApp();
  if (!ready) return <p role="status">Verificando acesso…</p>;
  if (profile)
    return (
      <Navigate
        to={profile.role === "doctor" ? "/medico" : "/inicio"}
        replace
      />
    );
  return children;
}
