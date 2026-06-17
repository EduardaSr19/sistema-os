import { ZodError } from "zod";

const isProd = process.env.NODE_ENV === "production";

export function errorHandler(err, req, res, _next) {
  // Validação Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Dados inválidos.",
      detalhes: err.flatten().fieldErrors,
    });
  }

  // Unique constraint Prisma (ex.: e-mail duplicado)
  if (err?.code === "P2002") {
    return res.status(409).json({
      error: `Já existe um registro com este ${err.meta?.target?.join(", ")}.`,
    });
  }

  // Registro não encontrado
  if (err?.code === "P2025") {
    return res.status(404).json({ error: "Registro não encontrado." });
  }

  // CORS bloqueado
  if (err?.message?.startsWith("Origem não permitida")) {
    return res.status(403).json({ error: err.message });
  }

  // Em produção não expõe stack; em dev ajuda a debugar
  if (!isProd) console.error(err);

  return res.status(500).json({
    error: "Erro interno do servidor.",
    ...(isProd ? {} : { detalhe: err?.message }),
  });
}
