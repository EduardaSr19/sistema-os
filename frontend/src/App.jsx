import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { PrivateRoute } from "./routes/PrivateRoute.jsx";
import { Layout } from "./components/Layout.jsx";
import { Login } from "./pages/Login.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { Clientes } from "./pages/Clientes.jsx";
import { OrdensServico } from "./pages/OrdensServico.jsx";

// Envolve as páginas internas no layout com sidebar.
function ComLayout({ children }) {
  return (
    <PrivateRoute>
      <Layout>{children}</Layout>
    </PrivateRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ComLayout><Dashboard /></ComLayout>} />
          <Route path="/ordens" element={<ComLayout><OrdensServico /></ComLayout>} />
          <Route path="/clientes" element={<ComLayout><Clientes /></ComLayout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
