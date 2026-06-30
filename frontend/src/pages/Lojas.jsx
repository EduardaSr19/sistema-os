import { useEffect, useState, Fragment } from "react";
import { api } from "../api/axios.js";
import { Modal } from "../components/Modal.jsx";

const LOJA_VAZIA = { nome: "", telefone: "", endereco: "", documento: "", responsavel: "", logo: "" };
const USER_VAZIO = { nome: "", email: "", senha: "", role: "ADMIN_LOJA" };

// Redimensiona a imagem para no máximo 200x200 e converte para base64 (PNG).
function lerLogoComoBase64(file) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    leitor.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Arquivo de imagem inválido."));
      img.onload = () => {
        const tamanho = 200;
        const escala = Math.min(1, tamanho / Math.max(img.width, img.height));
        const w = Math.round(img.width * escala);
        const h = Math.round(img.height * escala);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.src = leitor.result;
    };
    leitor.readAsDataURL(file);
  });
}

export function Lojas() {
  const [lojas, setLojas] = useState([]);
  const [modalLoja, setModalLoja] = useState(false);
  const [modalUser, setModalUser] = useState(null); // lojaId quando aberto
  const [editando, setEditando] = useState(null);
  const [formLoja, setFormLoja] = useState(LOJA_VAZIA);
  const [formUser, setFormUser] = useState(USER_VAZIO);
  const [expandida, setExpandida] = useState(null);
  const [detalhe, setDetalhe] = useState({});
  const [erro, setErro] = useState("");

  async function carregar() {
    const { data } = await api.get("/lojas");
    setLojas(data);
  }

  useEffect(() => { carregar(); }, []);

  async function carregarDetalhe(id) {
    if (expandida === id) { setExpandida(null); return; }
    const { data } = await api.get(`/lojas/${id}`);
    setDetalhe((d) => ({ ...d, [id]: data }));
    setExpandida(id);
  }

  function abrirNovaLoja() {
    setEditando(null); setFormLoja(LOJA_VAZIA); setErro(""); setModalLoja(true);
  }

  function abrirEdicaoLoja(l) {
    setEditando(l.id);
    setFormLoja({ nome: l.nome, telefone: l.telefone || "", endereco: l.endereco || "", documento: l.documento || "", responsavel: l.responsavel || "", logo: l.logo || "" });
    setErro(""); setModalLoja(true);
  }

  async function selecionarLogo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await lerLogoComoBase64(file);
      altLoja("logo", base64);
    } catch (err) {
      setErro(err.message || "Erro ao processar a imagem.");
    }
  }

  async function salvarLoja(e) {
    e.preventDefault(); setErro("");
    try {
      if (editando) await api.put(`/lojas/${editando}`, formLoja);
      else await api.post("/lojas", formLoja);
      setModalLoja(false); carregar();
    } catch (err) { setErro(err.response?.data?.error || "Erro ao salvar."); }
  }

  async function toggleAtiva(l) {
    await api.put(`/lojas/${l.id}`, { ativa: !l.ativa });
    carregar();
  }

  async function salvarUser(e) {
    e.preventDefault(); setErro("");
    try {
      await api.post(`/lojas/${modalUser}/usuarios`, formUser);
      setModalUser(null);
      if (expandida === modalUser) {
        const { data } = await api.get(`/lojas/${modalUser}`);
        setDetalhe((d) => ({ ...d, [modalUser]: data }));
      }
    } catch (err) { setErro(err.response?.data?.error || "Erro ao criar usuário."); }
  }

  function altLoja(k, v) { setFormLoja((f) => ({ ...f, [k]: v })); }
  function altUser(k, v) { setFormUser((f) => ({ ...f, [k]: v })); }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-slate-900">Lojas</h1>
        <button onClick={abrirNovaLoja} className="btn-primary">Nova loja</button>
      </div>

      <div className="card overflow-x-auto">
        {lojas.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-slate-400">Nenhuma loja cadastrada.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3 text-right">Ordens</th>
                <th className="px-5 py-3 text-right">Clientes</th>
                <th className="px-5 py-3 text-right">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lojas.map((l) => (
                <Fragment key={l.id}>
                  <tr className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-900">
                      <button onClick={() => carregarDetalhe(l.id)} className="hover:text-marca-600 text-left">
                        {l.nome} {expandida === l.id ? "▲" : "▼"}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">{l._count.ordens}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{l._count.clientes}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${l.ativa ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"}`}>
                        {l.ativa ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right space-x-3">
                      <button onClick={() => abrirEdicaoLoja(l)} className="text-marca-600 hover:underline">Editar</button>
                      <button onClick={() => toggleAtiva(l)} className={`hover:underline ${l.ativa ? "text-rose-600" : "text-emerald-600"}`}>
                        {l.ativa ? "Desativar" : "Ativar"}
                      </button>
                    </td>
                  </tr>
                  {expandida === l.id && detalhe[l.id] && (
                    <tr className="bg-slate-50" onClick={(e) => e.stopPropagation()}>
                      <td colSpan={5} className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Usuários</p>
                          <button onClick={() => { setFormUser(USER_VAZIO); setErro(""); setModalUser(l.id); }} className="btn-ghost text-xs py-1 px-3">
                            + Adicionar usuário
                          </button>
                        </div>
                        {detalhe[l.id].users.length === 0 ? (
                          <p className="text-sm text-slate-400">Nenhum usuário ainda.</p>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {detalhe[l.id].users.map((u) => (
                              <div key={u.id} className="flex items-center gap-3 text-sm">
                                <span className="font-medium text-slate-800">{u.nome}</span>
                                <span className="text-slate-500">{u.email}</span>
                                <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">{u.role}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal loja */}
      <Modal aberto={modalLoja} titulo={editando ? "Editar loja" : "Nova loja"} onFechar={() => setModalLoja(false)}>
        <form onSubmit={salvarLoja} className="space-y-4">
          {erro && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{erro}</div>}
          <div><label className="label">Nome da loja *</label><input className="input" value={formLoja.nome} onChange={(e) => altLoja("nome", e.target.value)} required /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Telefone</label><input className="input" value={formLoja.telefone} onChange={(e) => altLoja("telefone", e.target.value)} /></div>
            <div><label className="label">CNPJ</label><input className="input" value={formLoja.documento} onChange={(e) => altLoja("documento", e.target.value)} /></div>
          </div>
          <div><label className="label">Endereço</label><input className="input" value={formLoja.endereco} onChange={(e) => altLoja("endereco", e.target.value)} /></div>
          <div><label className="label">Responsável técnico</label><input className="input" value={formLoja.responsavel} onChange={(e) => altLoja("responsavel", e.target.value)} /></div>
          <div>
            <label className="label">Logo</label>
            <div className="flex items-center gap-3">
              {formLoja.logo && (
                <img src={formLoja.logo} alt="Logo da loja" className="h-12 w-12 rounded-lg object-contain ring-1 ring-slate-200" />
              )}
              <input type="file" accept="image/*" className="input" onChange={selecionarLogo} />
              {formLoja.logo && (
                <button type="button" className="text-xs text-rose-600 hover:underline" onClick={() => altLoja("logo", "")}>Remover</button>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-400">Aparece no cabeçalho da ordem de serviço.</p>
          </div>
          <div className="sticky bottom-0 -mx-6 -mb-5 flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-3">
            <button type="button" className="btn-ghost" onClick={() => setModalLoja(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>

      {/* Modal usuário */}
      <Modal aberto={!!modalUser} titulo="Adicionar usuário à loja" onFechar={() => setModalUser(null)}>
        <form onSubmit={salvarUser} className="space-y-4">
          {erro && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">{erro}</div>}
          <div><label className="label">Nome *</label><input className="input" value={formUser.nome} onChange={(e) => altUser("nome", e.target.value)} required /></div>
          <div><label className="label">E-mail *</label><input type="email" className="input" value={formUser.email} onChange={(e) => altUser("email", e.target.value)} required /></div>
          <div><label className="label">Senha *</label><input type="password" className="input" value={formUser.senha} onChange={(e) => altUser("senha", e.target.value)} required /></div>
          <div>
            <label className="label">Perfil</label>
            <select className="input" value={formUser.role} onChange={(e) => altUser("role", e.target.value)}>
              <option value="ADMIN_LOJA">Admin da loja</option>
              <option value="TECNICO">Técnico</option>
            </select>
          </div>
          <div className="sticky bottom-0 -mx-6 -mb-5 flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-3">
            <button type="button" className="btn-ghost" onClick={() => setModalUser(null)}>Cancelar</button>
            <button type="submit" className="btn-primary">Criar usuário</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
