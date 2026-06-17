import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const clienteSchema = z.object({
  nome: z.string().min(2, "Nome muito curto."),
  telefone: z.string().min(8, "Telefone inválido."),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  cpfCnpj: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cep: z.string().optional(),
});

export async function listar(req, res, next) {
  try {
    const { busca } = req.query;
    const clientes = await prisma.cliente.findMany({
      where: busca
        ? {
            OR: [
              { nome: { contains: busca, mode: "insensitive" } },
              { telefone: { contains: busca, mode: "insensitive" } },
              { cpfCnpj: { contains: busca, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { nome: "asc" },
    });
    return res.json(clientes);
  } catch (err) {
    next(err);
  }
}

export async function buscarPorId(req, res, next) {
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: req.params.id },
      include: { ordens: { orderBy: { createdAt: "desc" } } },
    });
    if (!cliente) {
      return res.status(404).json({ error: "Cliente não encontrado." });
    }
    return res.json(cliente);
  } catch (err) {
    next(err);
  }
}

export async function criar(req, res, next) {
  try {
    const dados = clienteSchema.parse(req.body);
    const cliente = await prisma.cliente.create({ data: dados });
    return res.status(201).json(cliente);
  } catch (err) {
    next(err);
  }
}

export async function atualizar(req, res, next) {
  try {
    const dados = clienteSchema.partial().parse(req.body);
    const cliente = await prisma.cliente.update({
      where: { id: req.params.id },
      data: dados,
    });
    return res.json(cliente);
  } catch (err) {
    next(err);
  }
}

export async function remover(req, res, next) {
  try {
    await prisma.cliente.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}
