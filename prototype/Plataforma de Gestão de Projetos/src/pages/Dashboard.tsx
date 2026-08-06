import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Project, Client, User } from "../types";
import StatusBadge from "../components/StatusBadge";

interface Props {
  projects: Project[];
  clients: Client[];
  users: User[];
  onViewProject: (id: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  PLANEJAMENTO: "#94a3b8",
  EM_ANDAMENTO: "#3b82f6",
  EM_RISCO: "#ef4444",
  CONCLUIDO: "#10b981",
  CANCELADO: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  PLANEJAMENTO: "Planejamento",
  EM_ANDAMENTO: "Em andamento",
  EM_RISCO: "Em risco",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

export default function Dashboard({ projects, clients, users, onViewProject }: Props) {
  const today = new Date();

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.budget_spent, 0);
  const totalHours = projects.reduce((s, p) => s + p.hours_worked, 0);
  const atRisk = projects.filter((p) => p.status === "EM_RISCO");
  const overBudget = projects.filter((p) => p.budget_spent > p.budget);
  const delayed = projects.filter(
    (p) =>
      new Date(p.deadline) < today &&
      p.status !== "CONCLUIDO" &&
      p.status !== "CANCELADO"
  );

  const statusData = Object.entries(STATUS_LABELS).map(([key, name]) => ({
    name,
    value: projects.filter((p) => p.status === key).length,
    color: STATUS_COLORS[key],
  })).filter((d) => d.value > 0);

  const clientBudgetData = clients.map((c) => {
    const cp = projects.filter((p) => p.client_id === c.id);
    return {
      name: c.name.split(" ").slice(0, 2).join(" "),
      orçamento: cp.reduce((s, p) => s + p.budget, 0),
      consumido: cp.reduce((s, p) => s + p.budget_spent, 0),
    };
  }).filter((d) => d.orçamento > 0);

  const riskProjects = [...atRisk, ...overBudget.filter((p) => p.status !== "EM_RISCO"), ...delayed.filter((p) => p.status !== "EM_RISCO" && p.budget_spent <= p.budget)];
  const uniqueRisk = Array.from(new Set(riskProjects.map((p) => p.id))).map(
    (id) => riskProjects.find((p) => p.id === id)!
  );

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard Gerencial</h1>
        <p className="text-sm text-slate-500 font-mono mt-0.5">
          {today.toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total de Projetos" value={String(projects.length)} sub={`${clients.length} clientes ativos`} color="blue" />
        <KPICard label="Em Risco / Atenção" value={String(uniqueRisk.length)} sub={`${overBudget.length} c/ orçamento excedido`} color="red" />
        <KPICard label="Orçamento Total" value={fmt(totalBudget)} sub={`${fmtPct((totalSpent / totalBudget) * 100)} consumido`} color="slate" />
        <KPICard label="Horas Trabalhadas" value={totalHours.toLocaleString("pt-BR")} sub="horas acumuladas" color="emerald" />
      </div>

      {/* Second row: charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Pie - status */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-800 mb-3">Projetos por Status</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2} dataKey="value">
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [`${v} projeto${v !== 1 ? "s" : ""}`, ""]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar - orçamento por cliente */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 lg:col-span-2">
          <div className="text-sm font-semibold text-slate-800 mb-3">Orçamento por Cliente (R$)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={clientBudgetData} margin={{ top: 0, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => fmt(Number(v))} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="orçamento" fill="#3b82f6" name="Previsto" radius={[3, 3, 0, 0]} />
              <Bar dataKey="consumido" fill="#f97316" name="Consumido" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* At-risk table */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div className="text-sm font-semibold text-slate-800">Projetos em Situação de Risco</div>
          <span className="text-xs font-mono text-red-600 bg-red-50 border border-red-200 rounded px-2 py-0.5">
            {uniqueRisk.length} projeto{uniqueRisk.length !== 1 ? "s" : ""}
          </span>
        </div>
        {uniqueRisk.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-slate-400">Nenhum projeto em situação de risco.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-mono text-slate-400 uppercase border-b border-slate-100">
                <th className="text-left px-4 py-2.5 font-medium">Projeto</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-left px-4 py-2.5 font-medium">Prazo</th>
                <th className="text-right px-4 py-2.5 font-medium">Consumo</th>
                <th className="text-right px-4 py-2.5 font-medium">Orçamento</th>
              </tr>
            </thead>
            <tbody>
              {uniqueRisk.map((p) => {
                const pct = (p.budget_spent / p.budget) * 100;
                const isDelayed = new Date(p.deadline) < today && p.status !== "CONCLUIDO" && p.status !== "CANCELADO";
                return (
                  <tr
                    key={p.id}
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => onViewProject(p.id)}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900">{p.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} size="sm" /></td>
                    <td className="px-4 py-3">
                      <span className={`font-mono text-xs ${isDelayed ? "text-red-600 font-medium" : "text-slate-600"}`}>
                        {isDelayed && "⚠ "}
                        {new Date(p.deadline).toLocaleDateString("pt-BR")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono text-xs ${pct > 100 ? "text-red-600 font-semibold" : "text-slate-600"}`}>
                        {fmtPct(pct)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">{fmt(p.budget)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

interface KPICardProps {
  label: string;
  value: string;
  sub: string;
  color: "blue" | "red" | "slate" | "emerald";
}

function KPICard({ label, value, sub, color }: KPICardProps) {
  const accent: Record<string, string> = {
    blue: "text-blue-600",
    red: "text-red-600",
    slate: "text-slate-700",
    emerald: "text-emerald-600",
  };
  const bar: Record<string, string> = {
    blue: "bg-blue-600",
    red: "bg-red-500",
    slate: "bg-slate-400",
    emerald: "bg-emerald-500",
  };
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${bar[color]}`} />
      <div className="pl-2">
        <div className="text-xs text-slate-500 font-medium mb-1">{label}</div>
        <div className={`text-2xl font-bold font-mono ${accent[color]}`}>{value}</div>
        <div className="text-[11px] text-slate-400 mt-1">{sub}</div>
      </div>
    </div>
  );
}
