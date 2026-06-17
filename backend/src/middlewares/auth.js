import jwt from "jsonwebtoken";

// Verifica o token JWT enviado no header Authorization: Bearer <token>.
// Em caso de sucesso, anexa os dados do usuário em req.user.
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "Token não informado." });
  }

  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "Formato de token inválido." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}

// Restringe a rota a determinados papéis (ex.: apenas ADMIN).
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: "Acesso negado." });
    }
    return next();
  };
}
