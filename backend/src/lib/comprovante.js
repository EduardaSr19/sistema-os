import PDFDocument from "pdfkit";
import { STATUS_LABEL } from "./status.js";
import { calcularTotais } from "./totais.js";

// Paleta alinhada à identidade do app (slate + âmbar).
const TINTA = "#0f172a";
const CINZA = "#64748b";
const AMBAR = "#f59e0b";
const LINHA = "#e2e8f0";

function moeda(v) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(v) || 0);
}

function dataBR(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function addMeses(data, meses) {
  const d = new Date(data);
  d.setMonth(d.getMonth() + Number(meses || 0));
  return d;
}

function dadosEmpresa(loja) {
  return {
    nome: loja?.nome || process.env.EMPRESA_NOME || "Assistência Técnica",
    telefone: loja?.telefone || process.env.EMPRESA_TELEFONE || "",
    endereco: loja?.endereco || process.env.EMPRESA_ENDERECO || "",
    documento: loja?.documento || process.env.EMPRESA_DOCUMENTO || "",
    responsavel: loja?.responsavel || process.env.EMPRESA_RESPONSAVEL || "",
  };
}

/**
 * Monta o comprovante e devolve o PDFDocument.
 * O controller faz doc.pipe(res) e doc.end().
 */
export function buildComprovante(ordem) {
  const empresa = dadosEmpresa(ordem.loja);
  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const { left } = doc.page.margins;
  const larguraUtil = doc.page.width - left - doc.page.margins.right;

  // ---------- Cabeçalho ----------
  doc.fillColor(TINTA).font("Helvetica-Bold").fontSize(8)
    .text("ORÇAMENTO / ORDEM DE SERVIÇO", left, 38);
  doc.fontSize(17).text(empresa.nome, left, 50);
  doc.font("Helvetica").fontSize(8.5).fillColor(CINZA);
  doc.text(empresa.endereco);
  doc.text(
    `Tel.: ${empresa.telefone}${empresa.documento ? `   ·   ${empresa.documento}` : ""}`
  );
  const resp = ordem.tecnico?.nome || empresa.responsavel;
  if (resp) doc.text(`Responsável: ${resp}`);

  const boxL = left + larguraUtil - 160;
  doc.roundedRect(boxL, 40, 160, 50, 6).fill(AMBAR);
  doc.fillColor(TINTA).font("Helvetica-Bold").fontSize(7.5)
    .text("ORDEM DE SERVIÇO", boxL, 47, { width: 160, align: "center" });
  doc.fontSize(20).text(`Nº ${ordem.numero}`, boxL, 58, { width: 160, align: "center" });
  doc.font("Helvetica").fontSize(7).fillColor(TINTA)
    .text(
      `Criação: ${dataBR(ordem.dataEntrada)}    Entrega: ${dataBR(ordem.dataEntrega)}`,
      boxL - 40,
      94,
      { width: 200, align: "right" }
    );

  doc.y = 116;
  regua(doc);

  // ---------- Destinatário ----------
  secao(doc, "Destinatário");
  duasColunas(
    doc,
    [
      ["Nome / Razão social", ordem.cliente?.nome],
      ["Telefone", ordem.cliente?.telefone],
      ["E-mail", ordem.cliente?.email || "—"],
    ],
    [
      ["CNPJ / CPF", ordem.cliente?.cpfCnpj || "—"],
      ["Endereço", ordem.cliente?.endereco || "—"],
      ["Bairro / CEP", [ordem.cliente?.bairro, ordem.cliente?.cep].filter(Boolean).join(" · ") || "—"],
    ]
  );
  if (ordem.informacoesAdicionais) {
    campoLargo(doc, "Informações adicionais", ordem.informacoesAdicionais);
  }

  regua(doc);

  // ---------- Objeto do conserto ----------
  secao(doc, "Objeto do conserto");
  duasColunas(
    doc,
    [
      ["Marca / Modelo", `${ordem.marca} ${ordem.modelo}`],
      ["Equipamento", ordem.equipamento || ordem.objetoConserto || "—"],
      ["Série", ordem.serie || "—"],
    ],
    [
      ["IMEI", ordem.imei || "—"],
      ["Acessórios", ordem.acessorios || "—"],
      ["Senha do aparelho", ordem.senhaAparelho || "—"],
    ]
  );
  if (ordem.condicoes) campoLargo(doc, "Condições", ordem.condicoes);
  campoLargo(doc, "Defeitos", ordem.defeitoRelatado);
  if (ordem.laudoTecnico) campoLargo(doc, "Laudo técnico", ordem.laudoTecnico);
  if (ordem.solucao) campoLargo(doc, "Solução", ordem.solucao);

  regua(doc);

  // ---------- Totais ----------
  secao(doc, "Totais");
  const { total } = calcularTotais(ordem);
  const tabelaW = 250;
  const tx = left + larguraUtil - tabelaW;
  linhaTotal(doc, tx, tabelaW, "Total de mercadorias", moeda(ordem.valorMercadorias));
  linhaTotal(doc, tx, tabelaW, "Total de serviços", moeda(ordem.valorServicos));
  linhaTotal(doc, tx, tabelaW, "Desconto (R$)", moeda(ordem.descontoValor));
  linhaTotal(doc, tx, tabelaW, "Desconto (%)", `${Number(ordem.descontoPercentual) || 0}%`);
  // Barra do total
  const yT = doc.y + 2;
  doc.roundedRect(tx, yT, tabelaW, 24, 4).fill(AMBAR);
  doc.fillColor(TINTA).font("Helvetica-Bold").fontSize(9)
    .text("TOTAL", tx + 10, yT + 7);
  doc.fontSize(12).text(moeda(total), tx, yT + 5, { width: tabelaW - 10, align: "right" });
  doc.y = yT + 32;

  // Status (à esquerda, alinhado com a tabela)
  doc.fillColor(CINZA).font("Helvetica").fontSize(7).text("STATUS", left, yT);
  doc.fillColor(TINTA).font("Helvetica-Bold").fontSize(11)
    .text(STATUS_LABEL[ordem.status] || ordem.status, left, yT + 9);

  regua(doc);

  // ---------- Garantia ----------
  const meses = ordem.garantiaMeses ?? 3;
  const baseGarantia = ordem.dataEntrega || ordem.dataEntrada;
  const termo =
    ordem.termoGarantia ||
    `${meses} meses de garantia contra defeito de fábrica na peça ou serviço realizado. ` +
      `A garantia não cobre aparelhos molhados ou danificados após o serviço.`;
  secao(doc, "Termo de garantia");
  doc.font("Helvetica").fontSize(8.5).fillColor(TINTA)
    .text(termo, left, doc.y, { width: larguraUtil, align: "justify", lineGap: 1 });
  doc.fillColor(CINZA).fontSize(8)
    .text(`Garantia válida até: ${dataBR(addMeses(baseGarantia, meses))}`, { lineGap: 1 });

  // ---------- Observações ----------
  if (ordem.observacoes) {
    secao(doc, "Observações");
    doc.font("Helvetica").fontSize(8.5).fillColor(TINTA)
      .text(ordem.observacoes, left, doc.y, { width: larguraUtil, align: "justify", lineGap: 1 });
  }

  // ---------- Assinaturas ----------
  doc.moveDown(2.5);
  const colW = (larguraUtil - 40) / 2;
  const yAss = doc.y + 10;
  linhaAssinatura(doc, left, yAss, colW, "Assinatura do cliente");
  linhaAssinatura(doc, left + colW + 40, yAss, colW, "Responsável técnico");

  doc.fontSize(7).fillColor(CINZA).text(
    `Emitido em ${new Date().toLocaleString("pt-BR")}`,
    left,
    yAss + 30,
    { width: larguraUtil, align: "center", lineBreak: false }
  );

  return doc;
}

// ----- helpers de layout -----

function regua(doc) {
  const { left } = doc.page.margins;
  const larguraUtil = doc.page.width - left - doc.page.margins.right;
  doc.moveDown(0.4);
  doc.moveTo(left, doc.y).lineTo(left + larguraUtil, doc.y).strokeColor(LINHA).stroke();
  doc.moveDown(0.2);
}

function secao(doc, titulo) {
  const { left } = doc.page.margins;
  doc.moveDown(0.3);
  doc.fillColor(AMBAR).font("Helvetica-Bold").fontSize(8)
    .text(titulo.toUpperCase(), left, doc.y, { characterSpacing: 0.5 });
  doc.moveDown(0.15);
}

function duasColunas(doc, esquerda, direita) {
  const { left } = doc.page.margins;
  const larguraUtil = doc.page.width - left - doc.page.margins.right;
  const colW = larguraUtil / 2;
  const yInicio = doc.y;
  let yEsq = yInicio;
  let yDir = yInicio;
  for (const [label, valor] of esquerda) yEsq = campo(doc, label, valor, left, yEsq, colW - 12);
  for (const [label, valor] of direita) yDir = campo(doc, label, valor, left + colW, yDir, colW - 12);
  doc.y = Math.max(yEsq, yDir);
}

function campo(doc, label, valor, x, y, w) {
  doc.fillColor(CINZA).font("Helvetica").fontSize(6.5).text(label.toUpperCase(), x, y, { width: w });
  doc.fillColor(TINTA).font("Helvetica").fontSize(9.5).text(valor ?? "—", x, doc.y, { width: w });
  return doc.y + 4;
}

function campoLargo(doc, label, valor) {
  const { left } = doc.page.margins;
  const larguraUtil = doc.page.width - left - doc.page.margins.right;
  doc.moveDown(0.2);
  doc.fillColor(CINZA).font("Helvetica").fontSize(6.5).text(label.toUpperCase(), left, doc.y, { width: larguraUtil });
  doc.fillColor(TINTA).font("Helvetica").fontSize(9.5).text(valor ?? "—", left, doc.y, { width: larguraUtil });
}

function linhaTotal(doc, x, w, label, valor) {
  const y = doc.y;
  doc.fillColor(CINZA).font("Helvetica").fontSize(8.5).text(label, x + 10, y, { width: w - 90 });
  doc.fillColor(TINTA).font("Helvetica").fontSize(8.5).text(valor, x, y, { width: w - 10, align: "right" });
  doc.moveTo(x, doc.y + 1).lineTo(x + w, doc.y + 1).strokeColor(LINHA).stroke();
  doc.y = doc.y + 4;
}

function linhaAssinatura(doc, x, y, w, label) {
  doc.moveTo(x, y).lineTo(x + w, y).strokeColor("#94a3b8").stroke();
  doc.fillColor(CINZA).font("Helvetica").fontSize(8).text(label, x, y + 4, { width: w, align: "center" });
}
