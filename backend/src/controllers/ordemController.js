import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { buildComprovante } from "../lib/comprovante.js";

const STATUS = ["ABERTA","EM_ANALISE","AGUARDANDO_APROVACAO","APROVADA","EM_REPARO","CONCLUIDA","ENTREGUE","CANCELADA"];
const opt = () => z.string().optional().or(z.literal(""));
const dinheiro = () => z.coerce.number().min(0).optional();

const ordemSchema = z.object({
  clienteId: z.string().uuid(),
  informacoesAdicionais: opt(),
  objetoConserto: opt(), equipamento: opt(), acessorios: opt(),
  marca: z.string().min(1), modelo: z.string().min(1),
  serie: opt(), imei: opt(), senhaAparelho: opt(), condicoes: opt(),
  defeitoRelatado: z.string().min(3),
  laudoTecnico: opt(), solucao: opt(),
  termoGarantia: opt(),
  garantiaMeses: z.coerce.number().int().min(0).optional(),
  valorMercadorias: dinheiro(), valorServicos: dinheiro(),
  descontoValor: dinheiro(), descontoPercentual: dinheiro(),
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

// Gera o próximo número sequencial para a loja (dentro de uma transação)
async function proximoNumero(tx, lojaId) {
  const last = await tx.ordemServico.findFirst({
    where: { lojaId },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  return (last?.numero ?? 0) + 1;
}

export async function listar(req, res, next) {
  try {
    const { status, busca } = req.query;
    const ordens = await prisma.ordemServico.findMany({
      where: {
        lojaId: req.lojaId,
        ...(status && { status }),
        ...(busca && { cliente: { nome: { contains: busca, mode: "insensitive" } } }),
      },
      include,
      orderBy: { createdAt: "desc" },
    });
    return res.json(ordens);
  } catch (err) { next(err); }
}

export async function buscarPorId(req, res, next) {
  try {
    const ordem = await prisma.ordemServico.findFirst({
      where: { id: req.params.id, lojaId: req.lojaId },
      include,
    });
    if (!ordem) return res.status(404).json({ error: "Ordem não encontrada." });
    return res.json(ordem);
  } catch (err) { next(err); }
}

export async function criar(req, res, next) {
  try {
    const dados = ordemSchema.parse(req.body);
    const ordem = await prisma.$transaction(async (tx) => {
      const numero = await proximoNumero(tx, req.lojaId);
      return tx.ordemServico.create({ data: { ...dados, lojaId: req.lojaId, numero }, include });
    });
    return res.status(201).json(ordem);
  } catch (err) { next(err); }
}

export async function atualizar(req, res, next) {
  try {
    const dados = ordemSchema.partial().parse(req.body);
    const existe = await prisma.ordemServico.findFirst({ where: { id: req.params.id, lojaId: req.lojaId } });
    if (!existe) return res.status(404).json({ error: "Ordem não encontrada." });
    const ordem = await prisma.ordemServico.update({ where: { id: req.params.id }, data: dados, include });
    return res.json(ordem);
  } catch (err) { next(err); }
}

export async function alterarStatus(req, res, next) {
  try {
    const { status } = z.object({ status: z.enum(STATUS) }).parse(req.body);
    const existe = await prisma.ordemServico.findFirst({ where: { id: req.params.id, lojaId: req.lojaId } });
    if (!existe) return res.status(404).json({ error: "Ordem não encontrada." });
    const ordem = await prisma.ordemServico.update({
      where: { id: req.params.id },
      data: { status, dataEntrega: status === "ENTREGUE" ? new Date() : undefined },
      include,
    });
    return res.json(ordem);
  } catch (err) { next(err); }
}

export async function remover(req, res, next) {
  try {
    const existe = await prisma.ordemServico.findFirst({ where: { id: req.params.id, lojaId: req.lojaId } });
    if (!existe) return res.status(404).json({ error: "Ordem não encontrada." });
    await prisma.ordemServico.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  } catch (err) { next(err); }
}

export async function comprovante(req, res, next) {
  try {
    const ordem = await prisma.ordemServico.findFirst({
      where: { id: req.params.id, lojaId: req.lojaId },
      include: { cliente: true, tecnico: { select: { nome: true } }, loja: true },
    });
    if (!ordem) return res.status(404).json({ error: "Ordem não encontrada." });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="OS-${ordem.numero}.pdf"`);
    const doc = buildComprovante(ordem);
    doc.pipe(res);
    doc.end();
  } catch (err) { next(err); }
}

export async function resumo(req, res, next) {
  try {
    const lojaId = req.lojaId;
    const where = lojaId ? { lojaId } : {};

    const [porStatus, total, clientes] = await Promise.all([
      prisma.ordemServico.groupBy({ by: ["status"], where, _count: { _all: true } }),
      prisma.ordemServico.count({ where }),
      prisma.cliente.count({ where: lojaId ? { lojaId } : {} }),
    ]);

    return res.json({
      total,
      clientes,
      porStatus: porStatus.reduce((a, i) => ({ ...a, [i.status]: i._count._all }), {}),
    });
  } catch (err) { next(err); }
}
