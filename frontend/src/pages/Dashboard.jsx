import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/axios.js";
import { STATUS_CONFIG, STATUS_LIST } from "../lib/status.js";

export function Dashboard() {
  const [resumo, setResumo] = useState(null);
  const [recentes, setRecentes] = useState([]);

  useEffect(() => {
    api.get("/ordens/resumo").then((r) => setResumo(r.data));
    api.get("/ordens").then((r) => setRecentes(r.data.slice(0, 5)));
  }, []);

  // Status considerados "em andamento" para o destaque principal.
  const emAndamento = resumo
    ? ["EM_ANALISE", "AGUARDANDO_APROVACAO", "APROVADA", "EM_REPARO"].reduce(
        (acc, s) => acc + (resumo.porStatus[s] || 0),
        0
      )
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Painel</h1>
        <Link to="/ordens" className="btn-primary">
          Nova ordem
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card titulo="Em andamento" valor={emAndamento} destaque />
        <Card titulo="Total de ordens" valor={resumo?.total ?? "—"} />
        <Card titulo="Clientes" valor={resumo?.clientes ?? "—"} />
      </div>

      <div className="card p-5">
        <h2 className="mb-4 font-display text-lg font-semibold text-slate-900">
          Por status
        </h2>
        <div className="flex flex-wrap gap-2">
          {STATUS_LIST.map((s) => (
            <div
              key={s}
              className={`rounded-lg px-3 py-2 text-sm ring-1 ${STATUS_CONFIG[s].classe}`}
            >
              <span className="font-semibold">{resumo?.porStatus[s] || 0}</span>{" "}
              {STATUS_CONFIG[s].label}
            </div>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Ordens recentes
          </h2>
          <Link to="/ordens" className="text-sm font-medium text-marca-600">
            Ver todas
          </Link>
        </div>
        {recentes.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">
            Nenhuma ordem cadastrada ainda.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentes.map((o) => (
              <li key={o.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    #{o.numero} · {o.marca} {o.modelo}
                  </p>
                  <p className="text-xs text-slate-500">{o.cliente?.nome}</p>
                </div>
                <span className="text-xs text-slate-500">
                  {STATUS_CONFIG[o.status]?.label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Card({ titulo, valor, destaque }) {
  return (
    <div
      className={`card p-5 ${destaque ? "ring-2 ring-marca-500" : ""}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </p>
      <p className="mt-2 font-display text-3xl font-bold text-slate-900">{valor}</p>
    </div>
  );
}
