import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function PrivateRoute({ children, roles }) {
  const { user, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        Carregando…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
