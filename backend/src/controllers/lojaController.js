import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const lojaSchema = z.object({
  nome: z.string().min(2),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  documento: z.string().optional(),
  responsavel: z.string().optional(),
  logo: z.string().optional().nullable(),
  ativa: z.boolean().optional(),
});

const userLojaSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  role: z.enum(["ADMIN_LOJA", "TECNICO"]).default("ADMIN_LOJA"),
});

export async function listar(_req, res, next) {
  try {
    const lojas = await prisma.loja.findMany({
      orderBy: { nome: "asc" },
      include: {
        _count: { select: { ordens: true, clientes: true, users: true } },
      },
    });
    return res.json(lojas);
  } catch (err) {
    next(err);
  }
}

export async function buscarPorId(req, res, next) {
  try {
    const loja = await prisma.loja.findUnique({
      where: { id: req.params.id },
      include: {
        users: { select: { id: true, nome: true, email: true, role: true } },
        _count: { select: { ordens: true, clientes: true } },
      },
    });
    if (!loja) return res.status(404).json({ error: "Loja não encontrada." });
    return res.json(loja);
  } catch (err) {
    next(err);
  }
}

export async function criar(req, res, next) {
  try {
    const dados = lojaSchema.parse(req.body);
    const loja = await prisma.loja.create({ data: dados });
    return res.status(201).json(loja);
  } catch (err) {
    next(err);
  }
}

export async function atualizar(req, res, next) {
  try {
    const dados = lojaSchema.partial().parse(req.body);
    const loja = await prisma.loja.update({ where: { id: req.params.id }, data: dados });
    return res.json(loja);
  } catch (err) {
    next(err);
  }
}

// Adiciona um usuário (ADMIN_LOJA ou TECNICO) a uma loja
export async function criarUsuario(req, res, next) {
  try {
    const { nome, email, senha, role } = userLojaSchema.parse(req.body);
    const hash = await bcrypt.hash(senha, 12);
    const user = await prisma.user.create({
      data: { nome, email, senha: hash, role, lojaId: req.params.id },
    });
    const { senha: _, ...semSenha } = user;
    return res.status(201).json(semSenha);
  } catch (err) {
    next(err);
  }
}

// Painel consolidado: resumo de todas as lojas ou de uma específica
export async function resumoGeral(_req, res, next) {
  try {
    const lojas = await prisma.loja.findMany({
      where: { ativa: true },
      select: {
        id: true,
        nome: true,
        _count: { select: { ordens: true, clientes: true } },
      },
      orderBy: { nome: "asc" },
    });

    // Totais financeiros e por status de cada loja
    const stats = await Promise.all(
      lojas.map(async (l) => {
        const porStatus = await prisma.ordemServico.groupBy({
          by: ["status"],
          where: { lojaId: l.id },
          _count: { _all: true },
        });

        const faturamento = await prisma.ordemServico.aggregate({
          where: { lojaId: l.id, status: "ENTREGUE" },
          _sum: { valorServicos: true, valorMercadorias: true },
        });

        const fat =
          Number(faturamento._sum.valorServicos || 0) +
          Number(faturamento._sum.valorMercadorias || 0);

        return {
          ...l,
          porStatus: porStatus.reduce((a, i) => ({ ...a, [i.status]: i._count._all }), {}),
          faturamentoTotal: fat,
        };
      })
    );

    const totais = stats.reduce(
      (a, l) => ({
        ordens: a.ordens + l._count.ordens,
        clientes: a.clientes + l._count.clientes,
        faturamento: a.faturamento + l.faturamentoTotal,
      }),
      { ordens: 0, clientes: 0, faturamento: 0 }
    );

    return res.json({ lojas: stats, totais });
  } catch (err) {
    next(err);
  }
}
