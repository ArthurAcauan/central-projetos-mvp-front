import type { ProjectStatus } from "../types";

const config: Record<ProjectStatus, { label: string; className: string }> = {
  PLANEJAMENTO: { label: "Planejamento", className: "bg-slate-100 text-slate-600 border-slate-200" },
  EM_ANDAMENTO: { label: "Em andamento", className: "bg-blue-50 text-blue-700 border-blue-200" },
  EM_RISCO: { label: "Em risco", className: "bg-red-50 text-red-700 border-red-200" },
  CONCLUIDO: { label: "Concluído", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  CANCELADO: { label: "Cancelado", className: "bg-gray-100 text-gray-500 border-gray-200" },
};

interface Props {
  status: ProjectStatus;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: Props) {
  const { label, className } = config[status];
  const sizeClass = size === "sm" ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";
  return (
    <span className={`inline-flex items-center font-mono font-medium border rounded ${sizeClass} ${className}`}>
      {status === "EM_RISCO" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 animate-pulse" />}
      {label}
    </span>
  );
}
