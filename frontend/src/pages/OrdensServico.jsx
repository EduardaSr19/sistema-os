import { useEffect, useState } from "react";
import { api } from "../api/axios.js";
import { Modal } from "../components/Modal.jsx";
import { STATUS_CONFIG, STATUS_LIST } from "../lib/status.js";

const TERMO_PADRAO =
  "3 meses de garantia contra defeito de fábrica na peça ou serviço realizado. " +
  "A garantia não cobre aparelhos molhados ou danificados após o serviço.";
const OBS_PADRAO =
  "Aparelhos não retirados dentro do prazo de 90 dias estarão sujeitos a desmontagem, reciclagem e venda!";

const VAZIO = {
  clienteId: "",
  informacoesAdicionais: "",
  objetoConserto: "",
  equipamento: "",
  acessorios: "",
  marca: "",
  modelo: "",
  serie: "",
  imei: "",
  senhaAparelho: "",
  condicoes: "",
  defeitoRelatado: "",
  laudoTecnico: "",
  solucao: "",
  termoGarantia: TERMO_PADRAO,
  garantiaMeses: 3,
  valorMercadorias: "",
  valorServicos: "",
  descontoValor: "",
  descontoPercentual: "",
  observacoes: OBS_PADRAO,
};

// Mesma lógica de totais usada no backend (subtotal − R$ − %).
function calcularTotal(f) {
  const subtotal = (Number(f.valorMercadorias) || 0) + (Number(f.valorServicos) || 0);
  const desc = (Number(f.descontoValor) || 0) + subtotal * ((Number(f.descontoPercentual) || 0) / 100);
  return Math.max(0, subtotal - desc);
}

const moeda = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);

export function OrdensServico() {
  const [ordens, setOrdens] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState("");

  async function carregar() {
    const { data } = await api.get("/ordens", {
      params: { status: filtroStatus || undefined },
    });
    setOrdens(data);
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroStatus]);

  useEffect(() => {
    api.get("/clientes").then((r) => setClientes(r.data));
  }, []);

  function abrirNovo() {
    setEditando(null);
    setForm(VAZIO);
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(o) {
    setEditando(o.id);
    setForm({
      clienteId: o.clienteId,
      informacoesAdicionais: o.informacoesAdicionais || "",
      objetoConserto: o.objetoConserto || "",
      equipamento: o.equipamento || "",
      acessorios: o.acessorios || "",
      marca: o.marca,
      modelo: o.modelo,
      serie: o.serie || "",
      imei: o.imei || "",
      senhaAparelho: o.senhaAparelho || "",
      condicoes: o.condicoes || "",
      defeitoRelatado: o.defeitoRelatado,
      laudoTecnico: o.laudoTecnico || "",
      solucao: o.solucao || "",
      termoGarantia: o.termoGarantia || TERMO_PADRAO,
      garantiaMeses: o.garantiaMeses ?? 3,
      valorMercadorias: o.valorMercadorias ?? "",
      valorServicos: o.valorServicos ?? "",
      descontoValor: o.descontoValor ?? "",
      descontoPercentual: o.descontoPercentual ?? "",
      observacoes: o.observacoes || "",
    });
    setErro("");
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro("");
    const payload = {
      ...form,
      garantiaMeses: Number(form.garantiaMeses) || 0,
      valorMercadorias: Number(form.valorMercadorias) || 0,
      valorServicos: Number(form.valorServicos) || 0,
      descontoValor: Number(form.descontoValor) || 0,
      descontoPercentual: Number(form.descontoPercentual) || 0,
    };
    try {
      if (editando) {
        await api.put(`/ordens/${editando}`, payload);
      } else {
        await api.post("/ordens", payload);
      }
      setModalAberto(false);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao salvar a ordem.");
    }
  }

  async function mudarStatus(id, status) {
    try {
      await api.patch(`/ordens/${id}/status`, { status });
      carregar();
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao alterar status.");
    }
  }

  // Busca o PDF com o token e abre em nova aba para visualizar/imprimir.
  async function abrirComprovante(id) {
    try {
      const { data } = await api.get(`/ordens/${id}/comprovante`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(data);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      alert("Não foi possível gerar o comprovante.");
    }
  }

  function alterar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-slate-900">
          Ordens de serviço
        </h1>
        <button onClick={abrirNovo} className="btn-primary">
          Nova ordem
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFiltroStatus("")}
          className={`rounded-full px-3 py-1 text-sm ring-1 ${
            filtroStatus === ""
              ? "bg-tinta-900 text-white ring-tinta-900"
              : "bg-white text-slate-600 ring-slate-200"
          }`}
        >
          Todas
        </button>
        {STATUS_LIST.map((s) => (
          <button
            key={s}
            onClick={() => setFiltroStatus(s)}
            className={`rounded-full px-3 py-1 text-sm ring-1 ${
              filtroStatus === s
                ? "bg-tinta-900 text-white ring-tinta-900"
                : "bg-white text-slate-600 ring-slate-200"
            }`}
          >
            {STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        {ordens.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">
            Nenhuma ordem encontrada.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Nº</th>
                <th className="px-5 py-3">Aparelho</th>
                <th className="px-5 py-3">Cliente</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ordens.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono text-slate-500">#{o.numero}</td>
                  <td className="px-5 py-3 font-medium text-slate-900">
                    {o.marca} {o.modelo}
                    <p className="text-xs font-normal text-slate-500">
                      {o.defeitoRelatado}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{o.cliente?.nome}</td>
                  <td className="px-5 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => mudarStatus(o.id, e.target.value)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                    >
                      {STATUS_LIST.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_CONFIG[s].label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => abrirComprovante(o.id)}
                      className="text-slate-600 hover:underline"
                    >
                      Comprovante
                    </button>
                    <button
                      onClick={() => abrirEdicao(o)}
                      className="ml-4 text-marca-600 hover:underline"
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        aberto={modalAberto}
        titulo={editando ? `Ordem de serviço` : "Nova ordem de serviço"}
        onFechar={() => setModalAberto(false)}
      >
        <form onSubmit={salvar} className="space-y-5">
          {erro && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
              {erro}
            </div>
          )}

          {/* Destinatário */}
          <Secao titulo="Destinatário">
            <Campo label="Cliente *">
              <select
                className="input"
                value={form.clienteId}
                onChange={(e) => alterar("clienteId", e.target.value)}
                required
              >
                <option value="">Selecione…</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} — {c.telefone}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo label="Informações adicionais">
              <input
                className="input"
                value={form.informacoesAdicionais}
                onChange={(e) => alterar("informacoesAdicionais", e.target.value)}
              />
            </Campo>
          </Secao>

          {/* Objeto do conserto */}
          <Secao titulo="Objeto do conserto">
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="Marca *">
                <input className="input" value={form.marca} required
                  onChange={(e) => alterar("marca", e.target.value)} />
              </Campo>
              <Campo label="Modelo *">
                <input className="input" value={form.modelo} required
                  onChange={(e) => alterar("modelo", e.target.value)} />
              </Campo>
              <Campo label="Equipamento">
                <input className="input" value={form.equipamento}
                  placeholder="Ex.: Smartphone, tablet…"
                  onChange={(e) => alterar("equipamento", e.target.value)} />
              </Campo>
              <Campo label="Série">
                <input className="input" value={form.serie}
                  onChange={(e) => alterar("serie", e.target.value)} />
              </Campo>
              <Campo label="IMEI">
                <input className="input" value={form.imei}
                  onChange={(e) => alterar("imei", e.target.value)} />
              </Campo>
              <Campo label="Senha do aparelho">
                <input className="input" value={form.senhaAparelho}
                  onChange={(e) => alterar("senhaAparelho", e.target.value)} />
              </Campo>
            </div>
            <Campo label="Acessórios entregues">
              <input className="input" value={form.acessorios}
                placeholder="Ex.: capa, carregador…"
                onChange={(e) => alterar("acessorios", e.target.value)} />
            </Campo>
            <Campo label="Condições">
              <input className="input" value={form.condicoes}
                placeholder="Ex.: tela quebrada, riscos…"
                onChange={(e) => alterar("condicoes", e.target.value)} />
            </Campo>
          </Secao>

          {/* Serviço */}
          <Secao titulo="Serviço">
            <Campo label="Defeitos relatados *">
              <textarea className="input" rows={2} value={form.defeitoRelatado} required
                onChange={(e) => alterar("defeitoRelatado", e.target.value)} />
            </Campo>
            <Campo label="Laudo técnico">
              <textarea className="input" rows={2} value={form.laudoTecnico}
                onChange={(e) => alterar("laudoTecnico", e.target.value)} />
            </Campo>
            <Campo label="Solução">
              <textarea className="input" rows={2} value={form.solucao}
                onChange={(e) => alterar("solucao", e.target.value)} />
            </Campo>
          </Secao>

          {/* Totais */}
          <Secao titulo="Totais">
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="Total de mercadorias (R$)">
                <input type="number" step="0.01" min="0" className="input"
                  value={form.valorMercadorias}
                  onChange={(e) => alterar("valorMercadorias", e.target.value)} />
              </Campo>
              <Campo label="Total de serviços (R$)">
                <input type="number" step="0.01" min="0" className="input"
                  value={form.valorServicos}
                  onChange={(e) => alterar("valorServicos", e.target.value)} />
              </Campo>
              <Campo label="Desconto (R$)">
                <input type="number" step="0.01" min="0" className="input"
                  value={form.descontoValor}
                  onChange={(e) => alterar("descontoValor", e.target.value)} />
              </Campo>
              <Campo label="Desconto (%)">
                <input type="number" step="0.01" min="0" className="input"
                  value={form.descontoPercentual}
                  onChange={(e) => alterar("descontoPercentual", e.target.value)} />
              </Campo>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-marca-50 px-4 py-2 ring-1 ring-marca-400">
              <span className="text-sm font-semibold text-marca-700">Total</span>
              <span className="font-display text-lg font-bold text-tinta-900">
                {moeda(calcularTotal(form))}
              </span>
            </div>
          </Secao>

          {/* Garantia */}
          <Secao titulo="Garantia">
            <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
              <Campo label="Garantia (meses)">
                <input type="number" min="0" className="input"
                  value={form.garantiaMeses}
                  onChange={(e) => alterar("garantiaMeses", e.target.value)} />
              </Campo>
              <Campo label="Termo de garantia">
                <textarea className="input" rows={2} value={form.termoGarantia}
                  onChange={(e) => alterar("termoGarantia", e.target.value)} />
              </Campo>
            </div>
          </Secao>

          {/* Observações */}
          <Secao titulo="Observações">
            <textarea className="input" rows={2} value={form.observacoes}
              onChange={(e) => alterar("observacoes", e.target.value)} />
          </Secao>

          <div className="sticky bottom-0 -mx-6 -mb-5 mt-2 flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-3">
            <button type="button" className="btn-ghost" onClick={() => setModalAberto(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Secao({ titulo, children }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-xs font-bold uppercase tracking-wide text-marca-600">
        {titulo}
      </legend>
      {children}
    </fieldset>
  );
}

function Campo({ label, children }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
