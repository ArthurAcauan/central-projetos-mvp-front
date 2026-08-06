import { useState } from "react";
import type { Project, Client, User, Team, ProjectStatus } from "../types";
import StatusBadge from "../components/StatusBadge";

interface Props {
  projects: Project[];
  clients: Client[];
  users: User[];
  teams: Team[];
  onViewProject: (id: string) => void;
  onNewProject: () => void;
}

const STATUS_OPTIONS: ProjectStatus[] = [
  "PLANEJAMENTO",
  "EM_ANDAMENTO",
  "EM_RISCO",
  "CONCLUIDO",
  "CANCELADO",
];

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

export default function Projects({ projects, clients, users, teams, onViewProject, onNewProject }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");
  const [clientFilter, setClientFilter] = useState("");

  const filtered = projects.filter((p) => {
    const client = clients.find((c) => c.id === p.client_id);
    const manager = users.find((u) => u.id === p.manager_id);
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      client?.name.toLowerCase().includes(search.toLowerCase()) ||
      manager?.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    const matchClient = !clientFilter || p.client_id === clientFilter;
    return matchSearch && matchStatus && matchClient;
  });

  const today = new Date();

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Projetos</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-mono">{filtered.length} de {projects.length} projetos</p>
        </div>
        <button
          onClick={onNewProject}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Novo Projeto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar por nome, cliente ou gestor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-slate-200 rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white flex-1 min-w-52"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "")}
          className="border border-slate-200 rounded px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
        <select
          value={clientFilter}
          onChange={(e) => setClientFilter(e.target.value)}
          className="border border-slate-200 rounded px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos os clientes</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono text-slate-400 uppercase">
              <th className="text-left px-4 py-3 font-medium">Projeto</th>
              <th className="text-left px-4 py-3 font-medium">Cliente</th>
              <th className="text-left px-4 py-3 font-medium">Gestor</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Prazo</th>
              <th className="text-right px-4 py-3 font-medium">Orçamento</th>
              <th className="text-right px-4 py-3 font-medium">Consumo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-400 text-sm">
                  Nenhum projeto encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const client = clients.find((c) => c.id === p.client_id);
                const manager = users.find((u) => u.id === p.manager_id);
                const pct = (p.budget_spent / p.budget) * 100;
                const isDelayed =
                  new Date(p.deadline) < today &&
                  p.status !== "CONCLUIDO" &&
                  p.status !== "CANCELADO";
                const overBudget = p.budget_spent > p.budget;
                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => onViewProject(p.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 max-w-52 truncate">{p.name}</div>
                      {(isDelayed || overBudget) && (
                        <div className="flex gap-1 mt-0.5">
                          {isDelayed && <span className="text-[10px] font-mono text-red-500">Atrasado</span>}
                          {isDelayed && overBudget && <span className="text-[10px] text-slate-300">·</span>}
                          {overBudget && <span className="text-[10px] font-mono text-orange-500">Orç. excedido</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{client?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{manager?.name ?? "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} size="sm" /></td>
                    <td className={`px-4 py-3 font-mono text-xs ${isDelayed ? "text-red-600 font-medium" : "text-slate-600"}`}>
                      {new Date(p.deadline).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">{fmt(p.budget)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className={`font-mono text-xs font-medium ${overBudget ? "text-red-600" : pct > 80 ? "text-orange-600" : "text-slate-600"}`}>
                        {pct.toFixed(1)}%
                      </div>
                      <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 ml-auto">
                        <div
                          className={`h-1 rounded-full transition-all ${overBudget ? "bg-red-500" : pct > 80 ? "bg-orange-400" : "bg-blue-500"}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
