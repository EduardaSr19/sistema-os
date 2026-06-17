// Centraliza rótulos e estilos de cada status da ordem de serviço.
// Usado no badge, nos filtros e no seletor de status.
export const STATUS_CONFIG = {
  ABERTA: { label: "Aberta", classe: "bg-slate-100 text-slate-700 ring-slate-200" },
  EM_ANALISE: { label: "Em análise", classe: "bg-blue-50 text-blue-700 ring-blue-200" },
  AGUARDANDO_APROVACAO: { label: "Aguardando aprovação", classe: "bg-amber-50 text-amber-700 ring-amber-200" },
  APROVADA: { label: "Aprovada", classe: "bg-violet-50 text-violet-700 ring-violet-200" },
  EM_REPARO: { label: "Em reparo", classe: "bg-marca-100 text-marca-700 ring-marca-400" },
  CONCLUIDA: { label: "Concluída", classe: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  ENTREGUE: { label: "Entregue", classe: "bg-emerald-600 text-white ring-emerald-600" },
  CANCELADA: { label: "Cancelada", classe: "bg-rose-50 text-rose-700 ring-rose-200" },
};

export const STATUS_LIST = Object.keys(STATUS_CONFIG);
