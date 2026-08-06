import { RadialBarChart, RadialBar, ResponsiveContainer } from "recharts";
import type { Project, Client, User, Team } from "../types";
import StatusBadge from "../components/StatusBadge";

interface Props {
  project: Project;
  clients: Client[];
  users: User[];
  teams: Team[];
  onBack: () => void;
  onEdit: (id: string) => void;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

const diffDays = (a: string, b: Date) => {
  const ms = new Date(a).getTime() - b.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

export default function ProjectDetail({ project: p, clients, users, teams, onBack, onEdit }: Props) {
  const client = clients.find((c) => c.id === p.client_id);
  const manager = users.find((u) => u.id === p.manager_id);
  const team = teams.find((t) => t.id === p.team_id);
  const today = new Date();

  const pct = Math.min((p.budget_spent / p.budget) * 100, 100);
  const overBudget = p.budget_spent > p.budget;
  const daysLeft = diffDays(p.deadline, today);
  const isDelayed = daysLeft < 0 && p.status !== "CONCLUIDO" && p.status !== "CANCELADO";
  const totalDays = diffDays(p.deadline, new Date(p.start_date));
  const elapsed = diffDays(
    today.toISOString().slice(0, 10),
    new Date(p.start_date)
  );
  const timeProgress = Math.max(0, Math.min((elapsed / totalDays) * 100, 100));

  const budgetData = [{ name: "consumo", value: pct, fill: overBudget ? "#ef4444" : pct > 80 ? "#f97316" : "#3b82f6" }];

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-slate-400 hover:text-slate-700 transition-colors text-sm flex items-center gap-1"
          >
            ← Voltar
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold text-slate-900">{p.name}</h1>
              <StatusBadge status={p.status} />
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{client?.name ?? "—"}</p>
          </div>
        </div>
        <button
          onClick={() => onEdit(p.id)}
          className="flex items-center gap-2 border border-slate-200 hover:border-blue-400 text-sm text-slate-600 hover:text-blue-600 px-4 py-2 rounded transition-colors"
        >
          Editar Projeto
        </button>
      </div>

      {/* Alerts */}
      {(overBudget || isDelayed || p.status === "EM_RISCO") && (
        <div className="flex flex-col gap-2 mb-5">
          {overBudget && (
            <Alert type="error" message={`Orçamento excedido em ${fmt(p.budget_spent - p.budget)} (${((p.budget_spent / p.budget - 1) * 100).toFixed(1)}% acima do previsto)`} />
          )}
          {isDelayed && (
            <Alert type="error" message={`Projeto atrasado — prazo final foi ${new Date(p.deadline).toLocaleDateString("pt-BR")}, há ${Math.abs(daysLeft)} dias`} />
          )}
          {p.status === "EM_RISCO" && !overBudget && !isDelayed && (
            <Alert type="warning" message="Projeto classificado como Em Risco pelo gestor responsável." />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest mb-3">Informações Gerais</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoRow label="Cliente" value={client?.name ?? "—"} />
              <InfoRow label="Gestor Responsável" value={manager?.name ?? "—"} />
              <InfoRow label="Equipe" value={team?.name ?? "—"} />
              <InfoRow label="Perfil do Gestor" value={manager ? manager.role.replace("_", " ") : "—"} mono />
              <InfoRow label="Data de Início" value={new Date(p.start_date).toLocaleDateString("pt-BR")} mono />
              <InfoRow label="Prazo Final" value={new Date(p.deadline).toLocaleDateString("pt-BR")} mono highlight={isDelayed} />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest mb-2">Objetivo</div>
            <p className="text-sm text-slate-700 leading-relaxed">{p.objective}</p>
          </div>

          {p.observations && (
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest mb-2">Observações</div>
              <p className="text-sm text-slate-700 leading-relaxed">{p.observations}</p>
            </div>
          )}

          {/* Prazo progress */}
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest">Progresso do Prazo</div>
              <span className={`text-xs font-mono font-semibold ${isDelayed ? "text-red-600" : "text-slate-500"}`}>
                {isDelayed ? `${Math.abs(daysLeft)}d atrasado` : `${daysLeft}d restantes`}
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${isDelayed ? "bg-red-500" : timeProgress > 80 ? "bg-orange-400" : "bg-blue-500"}`}
                style={{ width: `${timeProgress}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] font-mono text-slate-400">
              <span>{new Date(p.start_date).toLocaleDateString("pt-BR")}</span>
              <span>{timeProgress.toFixed(0)}% do período</span>
              <span>{new Date(p.deadline).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
        </div>

        {/* Sidebar metrics */}
        <div className="space-y-4">
          {/* Budget gauge */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 text-center">
            <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest mb-1">Consumo do Orçamento</div>
            <ResponsiveContainer width="100%" height={140}>
              <RadialBarChart
                cx="50%" cy="70%" innerRadius="60%" outerRadius="100%"
                startAngle={180} endAngle={0}
                data={[{ value: 100, fill: "#f1f5f9" }, ...budgetData]}
              >
                <RadialBar dataKey="value" background={false} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className={`text-2xl font-bold font-mono -mt-6 ${overBudget ? "text-red-600" : pct > 80 ? "text-orange-600" : "text-blue-600"}`}>
              {((p.budget_spent / p.budget) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-slate-400 mt-1 font-mono">{fmt(p.budget_spent)} / {fmt(p.budget)}</div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest mb-3">Financeiro</div>
            <div className="space-y-2.5">
              <MetricRow label="Orçamento Previsto" value={fmt(p.budget)} />
              <MetricRow label="Orçamento Consumido" value={fmt(p.budget_spent)} highlight={overBudget} />
              <div className="border-t border-slate-100 pt-2">
                <MetricRow
                  label={overBudget ? "Excedente" : "Saldo Disponível"}
                  value={fmt(Math.abs(p.budget - p.budget_spent))}
                  highlight={overBudget}
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest mb-3">Horas</div>
            <div className="text-3xl font-bold font-mono text-slate-800">
              {p.hours_worked.toLocaleString("pt-BR")}
            </div>
            <div className="text-xs text-slate-400 mt-1">horas trabalhadas no projeto</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-slate-400 mb-0.5">{label}</div>
      <div className={`text-sm font-medium ${highlight ? "text-red-600" : "text-slate-800"} ${mono ? "font-mono" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-sm font-mono font-medium ${highlight ? "text-red-600" : "text-slate-700"}`}>{value}</span>
    </div>
  );
}

function Alert({ type, message }: { type: "error" | "warning"; message: string }) {
  const cls = type === "error"
    ? "bg-red-50 border-red-200 text-red-700"
    : "bg-amber-50 border-amber-200 text-amber-700";
  const icon = type === "error" ? "⚠" : "!";
  return (
    <div className={`flex items-start gap-2.5 border rounded px-3.5 py-2.5 text-sm ${cls}`}>
      <span className="font-bold shrink-0">{icon}</span>
      <span>{message}</span>
    </div>
  );
}
