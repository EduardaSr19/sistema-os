import { createContext, useContext, useEffect, useState } from "react";
import { api, setToken, getToken } from "../api/axios.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      if (!getToken()) { setCarregando(false); return; }
      try {
        const { data } = await api.get("/auth/me");
        setUser(data);
      } catch {
        setToken(null);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  async function login(email, senha) {
    const { data } = await api.post("/auth/login", { email, senha });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() { setToken(null); setUser(null); }

  const isSuperAdmin = user?.role === "SUPERADMIN";
  const isAdminLoja  = user?.role === "ADMIN_LOJA";
  const isTecnico    = user?.role === "TECNICO";

  return (
    <AuthContext.Provider value={{ user, carregando, login, logout, isSuperAdmin, isAdminLoja, isTecnico }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>.");
  return ctx;
}
