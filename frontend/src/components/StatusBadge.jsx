import { STATUS_CONFIG } from "../lib/status.js";

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    classe: "bg-slate-100 text-slate-700 ring-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${cfg.classe}`}
    >
      {cfg.label}
    </span>
  );
}
