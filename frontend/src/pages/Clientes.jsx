import { useEffect, useState } from "react";
import { api } from "../api/axios.js";
import { Modal } from "../components/Modal.jsx";

const VAZIO = { nome: "", telefone: "", email: "", cpfCnpj: "", endereco: "", bairro: "", cep: "" };

export function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState("");

  async function carregar() {
    const { data } = await api.get("/clientes", { params: { busca } });
    setClientes(data);
  }

  useEffect(() => {
    const t = setTimeout(carregar, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  function abrirNovo() {
    setEditando(null);
    setForm(VAZIO);
    setErro("");
    setModalAberto(true);
  }

  function abrirEdicao(cliente) {
    setEditando(cliente.id);
    setForm({
      nome: cliente.nome,
      telefone: cliente.telefone,
      email: cliente.email || "",
      cpfCnpj: cliente.cpfCnpj || "",
      endereco: cliente.endereco || "",
      bairro: cliente.bairro || "",
      cep: cliente.cep || "",
    });
    setErro("");
    setModalAberto(true);
  }

  async function salvar(e) {
    e.preventDefault();
    setErro("");
    try {
      if (editando) {
        await api.put(`/clientes/${editando}`, form);
      } else {
        await api.post("/clientes", form);
      }
      setModalAberto(false);
      carregar();
    } catch (err) {
      setErro(err.response?.data?.error || "Erro ao salvar cliente.");
    }
  }

  async function remover(id) {
    if (!confirm("Remover este cliente?")) return;
    try {
      await api.delete(`/clientes/${id}`);
      carregar();
    } catch (err) {
      alert(err.response?.data?.error || "Não foi possível remover.");
    }
  }

  function alterar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-slate-900">
          Clientes
        </h1>
        <button onClick={abrirNovo} className="btn-primary">
          Novo cliente
        </button>
      </div>

      <input
        className="input max-w-sm"
        placeholder="Buscar por nome, telefone ou CPF…"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      <div className="card overflow-x-auto">
        {clientes.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">
            Nenhum cliente encontrado.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Telefone</th>
                <th className="px-5 py-3">E-mail</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-slate-900">{c.nome}</td>
                  <td className="px-5 py-3 text-slate-600">{c.telefone}</td>
                  <td className="px-5 py-3 text-slate-600">{c.email || "—"}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => abrirEdicao(c)}
                      className="text-marca-600 hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => remover(c.id)}
                      className="ml-4 text-rose-600 hover:underline"
                    >
                      Excluir
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
        titulo={editando ? "Editar cliente" : "Novo cliente"}
        onFechar={() => setModalAberto(false)}
      >
        <form onSubmit={salvar} className="space-y-4">
          {erro && (
            <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
              {erro}
            </div>
          )}
          <div>
            <label className="label">Nome *</label>
            <input
              className="input"
              value={form.nome}
              onChange={(e) => alterar("nome", e.target.value)}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Telefone *</label>
              <input
                className="input"
                value={form.telefone}
                onChange={(e) => alterar("telefone", e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">CNPJ / CPF</label>
              <input
                className="input"
                value={form.cpfCnpj}
                onChange={(e) => alterar("cpfCnpj", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">E-mail</label>
            <input
              type="email"
              className="input"
              value={form.email}
              onChange={(e) => alterar("email", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Endereço</label>
            <input
              className="input"
              value={form.endereco}
              onChange={(e) => alterar("endereco", e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Bairro / Distrito</label>
              <input
                className="input"
                value={form.bairro}
                onChange={(e) => alterar("bairro", e.target.value)}
              />
            </div>
            <div>
              <label className="label">CEP</label>
              <input
                className="input"
                value={form.cep}
                onChange={(e) => alterar("cep", e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setModalAberto(false)}
            >
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
