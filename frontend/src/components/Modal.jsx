import { createPortal } from "react-dom";

export function Modal({ aberto, titulo, onFechar, children }) {
  if (!aberto) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-tinta-950/50 p-4 sm:items-center"
    >
      <div
        className="card flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-slate-900">
            {titulo}
          </h2>
          <button
            onClick={onFechar}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}
