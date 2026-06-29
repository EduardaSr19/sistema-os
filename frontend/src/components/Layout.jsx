import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const linksLoja = [
  { to: "/painel", label: "Painel", end: true },
  { to: "/ordens", label: "Ordens de serviço" },
  { to: "/clientes", label: "Clientes" },
];

const linksSuperAdmin = [
  { to: "/painel-geral", label: "Painel geral", end: true },
  { to: "/lojas", label: "Lojas" },
];

export function Layout({ children }) {
  const { user, logout, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const links = isSuperAdmin ? linksSuperAdmin : linksLoja;

  function sair() { logout(); navigate("/login"); }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col bg-tinta-900 px-4 py-6 text-slate-300 md:flex">
        <div className="mb-8 px-2">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-marca-500 font-display text-lg font-bold text-tinta-950">
              OS
            </span>
            <div>
              <div className="font-display text-sm font-semibold text-white leading-tight">
                {isSuperAdmin ? "Super Admin" : (user?.loja?.nome || "Assistência")}
              </div>
              {isSuperAdmin && (
                <div className="text-xs text-marca-400">Painel geral</div>
              )}
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to} to={l.to} end={l.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-marca-500 text-tinta-950" : "text-slate-300 hover:bg-tinta-800 hover:text-white"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 border-t border-tinta-800 pt-4">
          <p className="px-3 text-sm font-medium text-white">{user?.nome}</p>
          <p className="px-3 text-xs text-slate-400">{user?.email}</p>
          <button
            onClick={sair}
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-tinta-800 hover:text-white"
          >
            Sair
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 md:hidden">
          <span className="font-display text-lg font-semibold">
            {isSuperAdmin ? "Super Admin" : (user?.loja?.nome || "OS")}
          </span>
          <button onClick={sair} className="text-sm text-slate-500">Sair</button>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
