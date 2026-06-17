import axios from "axios";

// Em dev o Vite faz proxy de /api para o backend (ver vite.config.js).
// Em produção, defina VITE_API_URL no .env do frontend.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

const TOKEN_KEY = "os.token";

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Anexa o token em toda requisição.
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Se o token expirar, limpa a sessão e volta ao login.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && getToken()) {
      setToken(null);
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);
