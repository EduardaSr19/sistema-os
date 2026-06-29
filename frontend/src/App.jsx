import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import { PrivateRoute } from "./routes/PrivateRoute.jsx";
import { Layout } from "./components/Layout.jsx";
import { Login } from "./pages/Login.jsx";
import { DashboardSuperAdmin } from "./pages/DashboardSuperAdmin.jsx";
import { Lojas } from "./pages/Lojas.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Clientes } from "./pages/Clientes.jsx";
import { OrdensServico } from "./pages/OrdensServico.jsx";

function Privada({ children, roles }) {
  return (
    <PrivateRoute roles={roles}>
      <Layout>{children}</Layout>
    </PrivateRoute>
  );
}

// Redireciona para o painel certo após login
function HomeRedirect() {
  const { user, carregando } = useAuth();
  if (carregando) return <div className="flex h-screen items-center justify-center text-slate-400">Carregando…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "SUPERADMIN") return <Navigate to="/painel-geral" replace />;
  return <Navigate to="/painel" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomeRedirect />} />

          {/* SUPERADMIN */}
          <Route path="/painel-geral" element={<Privada roles={["SUPERADMIN"]}><DashboardSuperAdmin /></Privada>} />
          <Route path="/lojas" element={<Privada roles={["SUPERADMIN"]}><Lojas /></Privada>} />

          {/* Loja */}
          <Route path="/painel" element={<Privada roles={["ADMIN_LOJA","TECNICO"]}><Dashboard /></Privada>} />
          <Route path="/ordens" element={<Privada roles={["ADMIN_LOJA","TECNICO"]}><OrdensServico /></Privada>} />
          <Route path="/clientes" element={<Privada roles={["ADMIN_LOJA","TECNICO"]}><Clientes /></Privada>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
