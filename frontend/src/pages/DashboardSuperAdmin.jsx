import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios.js";
import { STATUS_CONFIG } from "../lib/status.js";

const moeda = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);

export function DashboardSuperAdmin() {
  const [dados, setDados] = useState(null);

  useEffect(() => {
    api.get("/lojas/resumo-geral").then((r) => setDados(r.data));
  }, []);

  const totais = dados?.totais;
  const lojas  = dados?.lojas ?? [];

  const emAndamentoStatuses = ["EM_ANALISE","AGUARDANDO_APROVACAO","APROVADA","EM_REPARO"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Painel geral</h1>
        <Link to="/lojas" className="btn-primary">Gerenciar lojas</Link>
      </div>

      {/* Totais consolidados */}
      <div className="grid gap-4 sm:grid-cols-4">
        <CardMetrica titulo="Lojas ativas" valor={lojas.length} />
        <CardMetrica titulo="Total de ordens" valor={totais?.ordens ?? "—"} />
        <CardMetrica titulo="Clientes" valor={totais?.clientes ?? "—"} />
        <CardMetrica titulo="Faturamento total" valor={totais ? moeda(totais.faturamento) : "—"} destaque />
      </div>

      {/* Tabela de lojas */}
      <div className="card overflow-hidden">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-display text-lg font-semibold text-slate-900">Lojas</h2>
        </div>
        {lojas.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">
            Nenhuma loja cadastrada.{" "}
            <Link to="/lojas" className="text-marca-600 hover:underline">Criar primeira loja</Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Loja</th>
                  <th className="px-5 py-3 text-right">Clientes</th>
                  <th className="px-5 py-3 text-right">Ordens</th>
                  <th className="px-5 py-3 text-right">Em andamento</th>
                  <th className="px-5 py-3 text-right">Faturamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lojas.map((l) => {
                  const emAndamento = emAndamentoStatuses.reduce(
                    (acc, s) => acc + (l.porStatus?.[s] || 0), 0
                  );
                  return (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-900">{l.nome}</td>
                      <td className="px-5 py-3 text-right text-slate-600">{l._count.clientes}</td>
                      <td className="px-5 py-3 text-right text-slate-600">{l._count.ordens}</td>
                      <td className="px-5 py-3 text-right">
                        {emAndamento > 0 ? (
                          <span className="rounded-full bg-marca-100 px-2 py-0.5 text-xs font-semibold text-marca-700">
                            {emAndamento}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-slate-900">
                        {moeda(l.faturamentoTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status consolidado */}
      {lojas.length > 0 && (
        <div className="card p-5">
          <h2 className="mb-4 font-display text-lg font-semibold text-slate-900">
            Ordens por status (todas as lojas)
          </h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_CONFIG).map(([s, cfg]) => {
              const qtd = lojas.reduce((acc, l) => acc + (l.porStatus?.[s] || 0), 0);
              return (
                <div key={s} className={`rounded-lg px-3 py-2 text-sm ring-1 ${cfg.classe}`}>
                  <span className="font-semibold">{qtd}</span> {cfg.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CardMetrica({ titulo, valor, destaque }) {
  return (
    <div className={`card p-5 ${destaque ? "ring-2 ring-marca-500" : ""}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{titulo}</p>
      <p className="mt-2 font-display text-2xl font-bold text-slate-900">{valor}</p>
    </div>
  );
}
