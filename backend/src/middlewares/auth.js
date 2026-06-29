import jwt from "jsonwebtoken";

// Verifica JWT e popula req.user com { id, role, lojaId }
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Token não informado." });

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token)
    return res.status(401).json({ error: "Formato de token inválido." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role, lojaId: payload.lojaId ?? null };
    return next();
  } catch {
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}

// Restringe a rota a determinados roles.
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role))
      return res.status(403).json({ error: "Acesso negado." });
    return next();
  };
}

// Middleware de tenant: injeta lojaId em todas as queries da loja.
// SUPERADMIN pode passar ?lojaId=xxx para inspecionar uma loja específica.
// Para rotas que precisam de loja obrigatória, use requireTenant.
export function tenantMiddleware(req, res, next) {
  if (req.user.role === "SUPERADMIN") {
    req.lojaId = req.query.lojaId || null;
  } else {
    req.lojaId = req.user.lojaId;
  }
  return next();
}

// Garante que há uma loja no contexto (bloqueia SUPERADMIN sem ?lojaId).
export function requireTenant(req, res, next) {
  if (!req.lojaId)
    return res.status(400).json({ error: "lojaId é obrigatório para esta operação." });
  return next();
}
