import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const clienteSchema = z.object({
  nome: z.string().min(2),
  telefone: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
  cpfCnpj: z.string().optional(),
  endereco: z.string().optional(),
  bairro: z.string().optional(),
  cep: z.string().optional(),
});

export async function listar(req, res, next) {
  try {
    const { busca } = req.query;
    const clientes = await prisma.cliente.findMany({
      where: {
        lojaId: req.lojaId,
        ...(busca && {
          OR: [
            { nome: { contains: busca, mode: "insensitive" } },
            { telefone: { contains: busca, mode: "insensitive" } },
            { cpfCnpj: { contains: busca, mode: "insensitive" } },
          ],
        }),
      },
      orderBy: { nome: "asc" },
    });
    return res.json(clientes);
  } catch (err) {
    next(err);
  }
}

export async function buscarPorId(req, res, next) {
  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id: req.params.id, lojaId: req.lojaId },
      include: { ordens: { orderBy: { createdAt: "desc" }, take: 10 } },
    });
    if (!cliente) return res.status(404).json({ error: "Cliente não encontrado." });
    return res.json(cliente);
  } catch (err) {
    next(err);
  }
}

export async function criar(req, res, next) {
  try {
    const dados = clienteSchema.parse(req.body);
    const cliente = await prisma.cliente.create({ data: { ...dados, lojaId: req.lojaId } });
    return res.status(201).json(cliente);
  } catch (err) {
    next(err);
  }
}

export async function atualizar(req, res, next) {
  try {
    const dados = clienteSchema.partial().parse(req.body);
    const existe = await prisma.cliente.findFirst({ where: { id: req.params.id, lojaId: req.lojaId } });
    if (!existe) return res.status(404).json({ error: "Cliente não encontrado." });
    const cliente = await prisma.cliente.update({ where: { id: req.params.id }, data: dados });
    return res.json(cliente);
  } catch (err) {
    next(err);
  }
}

export async function remover(req, res, next) {
  try {
    const existe = await prisma.cliente.findFirst({ where: { id: req.params.id, lojaId: req.lojaId } });
    if (!existe) return res.status(404).json({ error: "Cliente não encontrado." });
    await prisma.cliente.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}
