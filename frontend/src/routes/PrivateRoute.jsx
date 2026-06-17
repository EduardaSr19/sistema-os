import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Bloqueia o acesso a páginas internas quando não há sessão ativa.
export function PrivateRoute({ children }) {
  const { user, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        Carregando…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
