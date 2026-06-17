import { ZodError } from "zod";

// Tratamento centralizado de erros. Deve ser o último middleware registrado.
export function errorHandler(err, req, res, _next) {
  // Erros de validação do Zod
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Dados inválidos.",
      detalhes: err.flatten().fieldErrors,
    });
  }

  // Violação de constraint única no Prisma (ex.: e-mail duplicado)
  if (err?.code === "P2002") {
    return res.status(409).json({
      error: `Já existe um registro com este ${err.meta?.target?.join(", ")}.`,
    });
  }

  // Registro não encontrado no Prisma
  if (err?.code === "P2025") {
    return res.status(404).json({ error: "Registro não encontrado." });
  }

  console.error(err);
  return res.status(500).json({ error: "Erro interno do servidor." });
}
