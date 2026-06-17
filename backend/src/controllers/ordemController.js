import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { buildComprovante } from "../lib/comprovante.js";

const STATUS = [
  "ABERTA",
  "EM_ANALISE",
  "AGUARDANDO_APROVACAO",
  "APROVADA",
  "EM_REPARO",
  "CONCLUIDA",
  "ENTREGUE",
  "CANCELADA",
];

const opt = () => z.string().optional().or(z.literal(""));
const dinheiro = () => z.coerce.number().min(0).optional();

const ordemSchema = z.object({
  clienteId: z.string().uuid("Cliente inválido."),
  informacoesAdicionais: opt(),

  // Objeto do conserto
  objetoConserto: opt(),
  equipamento: opt(),
  acessorios: opt(),
  marca: z.string().min(1, "Informe a marca."),
  modelo: z.string().min(1, "Informe o modelo."),
  serie: opt(),
  imei: opt(),
  senhaAparelho: opt(),
  condicoes: opt(),

  // Serviço
  defeitoRelatado: z.string().min(3, "Descreva o defeito relatado."),
  laudoTecnico: opt(),
  solucao: opt(),

  // Garantia
  termoGarantia: opt(),
  garantiaMeses: z.coerce.number().int().min(0).optional(),

  // Totais
  valorMercadorias: dinheiro(),
  valorServicos: dinheiro(),
  descontoValor: dinheiro(),
  descontoPercentual: dinheiro(),

  observacoes: opt(),
  status: z.enum(STATUS).optional(),
  tecnicoId: z.string().uuid().optional().nullable(),
  dataPrevisao: z.coerce.date().optional().nullable(),
  dataEntrega: z.coerce.date().optional().nullable(),
});

const include = {
  cliente: { select: { id: true, nome: true, telefone: true } },
  tecnico: { select: { id: true, nome: true } },
};

export async function listar(req, res, next) {
  try {
    const { status, busca } = req.query;
    const ordens = await prisma.ordemServico.findMany({
      where: {
        status: status || undefined,
        cliente: busca
          ? { nome: { contains: busca, mode: "insensitive" } }
          : undefined,
      },
      include,
      orderBy: { createdAt: "desc" },
    });
    return res.json(ordens);
  } catch (err) {
    next(err);
  }
}

export async function buscarPorId(req, res, next) {
  try {
    const ordem = await prisma.ordemServico.findUnique({
      where: { id: req.params.id },
      include,
    });
    if (!ordem) {
      return res.status(404).json({ error: "Ordem de serviço não encontrada." });
    }
    return res.json(ordem);
  } catch (err) {
    next(err);
  }
}

export async function criar(req, res, next) {
  try {
    const dados = ordemSchema.parse(req.body);
    const ordem = await prisma.ordemServico.create({ data: dados, include });
    return res.status(201).json(ordem);
  } catch (err) {
    next(err);
  }
}

export async function atualizar(req, res, next) {
  try {
    const dados = ordemSchema.partial().parse(req.body);
    const ordem = await prisma.ordemServico.update({
      where: { id: req.params.id },
      data: dados,
      include,
    });
    return res.json(ordem);
  } catch (err) {
    next(err);
  }
}

export async function alterarStatus(req, res, next) {
  try {
    const { status } = z
      .object({ status: z.enum(STATUS) })
      .parse(req.body);

    // Quando entregue, registra a data de entrega automaticamente.
    const data = {
      status,
      dataEntrega: status === "ENTREGUE" ? new Date() : undefined,
    };

    const ordem = await prisma.ordemServico.update({
      where: { id: req.params.id },
      data,
      include,
    });
    return res.json(ordem);
  } catch (err) {
    next(err);
  }
}

export async function remover(req, res, next) {
  try {
    await prisma.ordemServico.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// Gera e devolve o comprovante da OS em PDF.
export async function comprovante(req, res, next) {
  try {
    const ordem = await prisma.ordemServico.findUnique({
      where: { id: req.params.id },
      include: { cliente: true, tecnico: { select: { nome: true } } },
    });
    if (!ordem) {
      return res.status(404).json({ error: "Ordem de serviço não encontrada." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="OS-${ordem.numero}.pdf"`
    );

    const doc = buildComprovante(ordem);
    doc.pipe(res);
    doc.end();
  } catch (err) {
    next(err);
  }
}

// Resumo para o dashboard: contagem por status e total.
export async function resumo(req, res, next) {
  try {
    const porStatus = await prisma.ordemServico.groupBy({
      by: ["status"],
      _count: { _all: true },
    });

    const total = await prisma.ordemServico.count();
    const clientes = await prisma.cliente.count();

    return res.json({
      total,
      clientes,
      porStatus: porStatus.reduce((acc, item) => {
        acc[item.status] = item._count._all;
        return acc;
      }, {}),
    });
  } catch (err) {
    next(err);
  }
}
