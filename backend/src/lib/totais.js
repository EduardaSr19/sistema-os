// Calcula o total da OS a partir dos componentes financeiros.
// Subtotal = mercadorias + serviços.
// Desconto = valor fixo (R$) + percentual aplicado sobre o subtotal.
export function calcularTotais({
  valorMercadorias = 0,
  valorServicos = 0,
  descontoValor = 0,
  descontoPercentual = 0,
}) {
  const merc = Number(valorMercadorias) || 0;
  const serv = Number(valorServicos) || 0;
  const descV = Number(descontoValor) || 0;
  const descP = Number(descontoPercentual) || 0;

  const subtotal = merc + serv;
  const descontoPerc = subtotal * (descP / 100);
  const total = Math.max(0, subtotal - descV - descontoPerc);

  return { subtotal, total };
}
