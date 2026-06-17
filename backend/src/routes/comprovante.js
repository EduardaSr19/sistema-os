import PDFDocument from "pdfkit";
import { STATUS_LABEL } from "./status.js";

// Paleta alinhada à identidade do app (slate + âmbar).
const TINTA = "#0f172a";
const CINZA = "#64748b";
const AMBAR = "#f59e0b";
const LINHA = "#e2e8f0";

function moeda(v) {
  if (v === null || v === undefined || v === "") return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(v));
}

function dataBR(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Dados da empresa (configuráveis por variáveis de ambiente).
function dadosEmpresa() {
  return {
    nome: process.env.EMPRESA_NOME || "Sua Assistência Técnica",
    telefone: process.env.EMPRESA_TELEFONE || "(00) 0000-0000",
    endereco: process.env.EMPRESA_ENDERECO || "Rua Exemplo, 123 — Sua Cidade/UF",
    documento: process.env.EMPRESA_DOCUMENTO || "",
  };
}

/**
 * Monta o comprovante e devolve o PDFDocument.
 * O controller faz doc.pipe(res) e doc.end().
 */
export function buildComprovante(ordem) {
  const empresa = dadosEmpresa();
  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const { left, right } = doc.page.margins;
  const larguraUtil = doc.page.width - left - right;

  // ---------- Cabeçalho ----------
  doc.fillColor(TINTA).font("Helvetica-Bold").fontSize(18).text(empresa.nome, left, 50);
  doc.font("Helvetica").fontSize(9).fillColor(CINZA);
  doc.text(empresa.endereco);
  doc.text(`Tel.: ${empresa.telefone}${empresa.documento ? `  ·  ${empresa.documento}` : ""}`);

  // Caixa com o número da OS (canto superior direito)
  const boxL = left + larguraUtil - 170;
  doc.roundedRect(boxL, 48, 170, 56, 6).fill(AMBAR);
  doc.fillColor(TINTA).font("Helvetica-Bold").fontSize(8)
    .text("ORDEM DE SERVIÇO", boxL, 56, { width: 170, align: "center" });
  doc.fontSize(22).text(`Nº ${ordem.numero}`, boxL, 68, { width: 170, align: "center" });

  doc.moveTo(left, 118).lineTo(left + larguraUtil, 118).strokeColor(LINHA).stroke();
  doc.y = 132;

  // ---------- Cliente ----------
  secao(doc, "Cliente");
  duasColunas(
    doc,
    [
      ["Nome", ordem.cliente?.nome],
      ["Telefone", ordem.cliente?.telefone],
    ],
    [
      ["E-mail", ordem.cliente?.email || "—"],
      ["CPF", ordem.cliente?.cpf || "—"],
    ]
  );

  // ---------- Aparelho ----------
  secao(doc, "Aparelho");
  duasColunas(
    doc,
    [
      ["Marca / Modelo", `${ordem.marca} ${ordem.modelo}`],
      ["IMEI", ordem.imei || "—"],
    ],
    [
      ["Acessórios entregues", ordem.acessorios || "—"],
      ["Entrada", dataBR(ordem.dataEntrada)],
    ]
  );

  // ---------- Serviço ----------
  secao(doc, "Defeito relatado");
  paragrafo(doc, ordem.defeitoRelatado);

  if (ordem.diagnostico) {
    secao(doc, "Diagnóstico técnico");
    paragrafo(doc, ordem.diagnostico);
  }
  if (ordem.servicoRealizado) {
    secao(doc, "Serviço realizado");
    paragrafo(doc, ordem.servicoRealizado);
  }

  // ---------- Status e valor ----------
  doc.moveDown(0.5);
  const yBarra = doc.y;
  doc.roundedRect(left, yBarra, larguraUtil, 40, 6).fillAndStroke("#f8fafc", LINHA);
  doc.fillColor(CINZA).font("Helvetica").fontSize(8)
    .text("STATUS", left + 14, yBarra + 8);
  doc.fillColor(TINTA).font("Helvetica-Bold").fontSize(12)
    .text(STATUS_LABEL[ordem.status] || ordem.status, left + 14, yBarra + 19);
  doc.fillColor(CINZA).font("Helvetica").fontSize(8)
    .text("VALOR", left, yBarra + 8, { width: larguraUtil - 14, align: "right" });
  doc.fillColor(TINTA).font("Helvetica-Bold").fontSize(14)
    .text(moeda(ordem.valor), left, yBarra + 18, { width: larguraUtil - 14, align: "right" });
  doc.y = yBarra + 56;

  // ---------- Termos ----------
  doc.font("Helvetica").fontSize(7.5).fillColor(CINZA).text(
    "Aparelhos não retirados em até 90 dias após o aviso de conclusão poderão ser " +
      "cobrados por armazenamento. Orçamento aprovado verbalmente ou por mensagem tem " +
      "validade contratual. A empresa não se responsabiliza por dados não copiados pelo cliente.",
    { align: "justify", lineGap: 1 }
  );

  // ---------- Assinaturas ----------
  const yAss = doc.page.height - doc.page.margins.bottom - 50;
  const colW = (larguraUtil - 40) / 2;
  linhaAssinatura(doc, left, yAss, colW, "Assinatura do cliente");
  linhaAssinatura(doc, left + colW + 40, yAss, colW, "Responsável técnico");

  doc.fontSize(7).fillColor(CINZA).text(
    `Emitido em ${new Date().toLocaleString("pt-BR")}`,
    left,
    doc.page.height - doc.page.margins.bottom - 12,
    { width: larguraUtil, align: "center", lineBreak: false }
  );

  return doc;
}

// ----- helpers de layout -----

function secao(doc, titulo) {
  const { left } = doc.page.margins;
  doc.moveDown(0.6);
  doc.fillColor(AMBAR).font("Helvetica-Bold").fontSize(8)
    .text(titulo.toUpperCase(), left, doc.y, { characterSpacing: 0.5 });
  doc.moveDown(0.2);
}

function duasColunas(doc, esquerda, direita) {
  const { left } = doc.page.margins;
  const larguraUtil = doc.page.width - left - doc.page.margins.right;
  const colW = larguraUtil / 2;
  const yInicio = doc.y;
  let yEsq = yInicio;
  let yDir = yInicio;

  for (const [label, valor] of esquerda) {
    yEsq = campo(doc, label, valor, left, yEsq, colW - 10);
  }
  for (const [label, valor] of direita) {
    yDir = campo(doc, label, valor, left + colW, yDir, colW - 10);
  }
  doc.y = Math.max(yEsq, yDir);
}

function campo(doc, label, valor, x, y, w) {
  doc.fillColor(CINZA).font("Helvetica").fontSize(7).text(label.toUpperCase(), x, y, { width: w });
  doc.fillColor(TINTA).font("Helvetica").fontSize(10).text(valor ?? "—", x, doc.y, { width: w });
  return doc.y + 6;
}

function paragrafo(doc, texto) {
  const { left } = doc.page.margins;
  const larguraUtil = doc.page.width - left - doc.page.margins.right;
  doc.fillColor(TINTA).font("Helvetica").fontSize(10)
    .text(texto, left, doc.y, { width: larguraUtil, align: "justify" });
}

function linhaAssinatura(doc, x, y, w, label) {
  doc.moveTo(x, y).lineTo(x + w, y).strokeColor("#94a3b8").stroke();
  doc.fillColor(CINZA).font("Helvetica").fontSize(8)
    .text(label, x, y + 4, { width: w, align: "center" });
}
