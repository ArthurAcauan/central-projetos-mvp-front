/**
 * Gráficos do dashboard gerencial (RF08), em Recharts — construídos dentro
 * deste front, sem ferramenta externa de BI (`context/02_arquitetura_final_projeto.md`).
 *
 * Nenhum agregado nasce aqui: tudo vem pronto de `domain/indicators.ts`
 * (armadilha A-005). Este arquivo decide desenho, não número.
 *
 * Toda série passa por {@link ChartCard}, que troca o gráfico por uma frase
 * quando não há dado. Recharts com série vazia renderiza eixos soltos e, em
 * alguns casos, quebra ao calcular o domínio (armadilha A-006).
 *
 * Os gráficos vão marcados como `aria-hidden`: SVG do Recharts não é navegável
 * por leitor de tela. Os mesmos números estão em texto — nos cards do RF07, na
 * lista de status abaixo da rosca e na tabela do RF09.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ClientAggregate, ProjectHours } from '@/domain/indicators';
import { formatCompactCurrency, formatCurrency, formatNumber } from '@/lib/format';
import { projectStatusLabels, projectStatuses, type ProjectStatus } from '@/types/project';

/**
 * Hex porque SVG não aceita classe Tailwind. São os mesmos tons do
 * `StatusBadge`, para a rosca e a etiqueta não parecerem estados diferentes.
 */
const statusColors: Record<ProjectStatus, string> = {
  PLANEJAMENTO: '#94a3b8',
  EM_ANDAMENTO: '#3b82f6',
  EM_RISCO: '#ef4444',
  CONCLUIDO: '#10b981',
  CANCELADO: '#6b7280',
};

const BUDGET_COLOR = '#3b82f6';
const SPENT_COLOR = '#f97316';
const HOURS_COLOR = '#8b5cf6';
const COUNT_COLOR = '#0ea5e9';

const axisTick = { fontSize: 10, fill: '#94a3b8' };

/**
 * O Recharts entrega o valor do tooltip como `ValueType | undefined`, então os
 * formatadores recebem `unknown` e normalizam aqui — em vez de um `as number`
 * que mentiria sobre o que chega.
 */
function toNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

const currencyTooltip = (value: unknown) => formatCurrency(toNumber(value));

const countTooltip = (value: unknown): [string, string] => [
  formatNumber(toNumber(value)),
  'Projetos',
];

const hoursTooltip = (value: unknown): [string, string] => [formatNumber(toNumber(value)), 'Horas'];

export interface DashboardChartsProps {
  projectsByStatus: Record<ProjectStatus, number>;
  byClient: ClientAggregate[];
  hoursByProject: ProjectHours[];
}

export default function DashboardCharts({
  projectsByStatus,
  byClient,
  hoursByProject,
}: DashboardChartsProps) {
  // Status sem nenhum projeto não vira fatia: uma fatia de 0° só polui a legenda.
  const statusSlices = projectStatuses
    .filter((status) => projectsByStatus[status] > 0)
    .map((status) => ({
      status,
      name: projectStatusLabels[status],
      value: projectsByStatus[status],
    }));

  const clientBars = byClient.map((client) => ({
    name: shortenClientName(client.clientName),
    Previsto: client.budget,
    Consumido: client.budgetSpent,
    Projetos: client.projectCount,
  }));

  const hourBars = hoursByProject.map((entry) => ({
    name: entry.projectName,
    Horas: entry.hours,
  }));

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard
        isEmpty={statusSlices.length === 0}
        title="Projetos por status"
        emptyMessage="Nenhum projeto cadastrado para distribuir por status."
      >
        <ResponsiveContainer height={240} width="100%">
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={statusSlices}
              dataKey="value"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
            >
              {statusSlices.map((slice) => (
                <Cell fill={statusColors[slice.status]} key={slice.status} />
              ))}
            </Pie>
            <Tooltip formatter={countTooltip} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        isEmpty={clientBars.length === 0}
        title="Orçamento previsto x consumido por cliente"
        emptyMessage="Nenhum projeto com cliente para comparar orçamento."
      >
        <ResponsiveContainer height={240} width="100%">
          <BarChart data={clientBars} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={axisTick} tickLine={false} />
            <YAxis tick={axisTick} tickFormatter={formatCompactCurrency} tickLine={false} />
            <Tooltip formatter={currencyTooltip} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Previsto" fill={BUDGET_COLOR} radius={[3, 3, 0, 0]} />
            <Bar dataKey="Consumido" fill={SPENT_COLOR} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        isEmpty={clientBars.length === 0}
        title="Projetos por cliente"
        emptyMessage="Nenhum projeto cadastrado."
      >
        <ResponsiveContainer height={240} width="100%">
          <BarChart data={clientBars} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <CartesianGrid stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={axisTick} tickLine={false} />
            <YAxis allowDecimals={false} tick={axisTick} tickLine={false} />
            <Tooltip formatter={countTooltip} />
            <Bar dataKey="Projetos" fill={COUNT_COLOR} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        isEmpty={hourBars.length === 0}
        title="Horas realizadas por projeto"
        emptyMessage="Nenhuma hora apontada nos projetos."
      >
        {/* Barras horizontais: nome de projeto não cabe legível no eixo X. */}
        <ResponsiveContainer height={240} width="100%">
          <BarChart data={hourBars} layout="vertical" margin={{ top: 8, right: 16, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke="#f1f5f9" />
            <XAxis tick={axisTick} tickFormatter={formatNumber} tickLine={false} type="number" />
            <YAxis dataKey="name" tick={axisTick} tickLine={false} type="category" width={110} />
            <Tooltip formatter={hoursTooltip} />
            <Bar dataKey="Horas" fill={HOURS_COLOR} radius={[0, 3, 3, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

interface ChartCardProps {
  title: string;
  isEmpty: boolean;
  emptyMessage: string;
  children: React.ReactNode;
}

function ChartCard({ title, isEmpty, emptyMessage, children }: ChartCardProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="mb-3 font-mono text-xs font-medium tracking-widest text-slate-400 uppercase">
        {title}
      </h2>
      {isEmpty ? (
        <p className="py-16 text-center text-sm text-slate-400">{emptyMessage}</p>
      ) : (
        <div aria-hidden="true">{children}</div>
      )}
    </section>
  );
}

/**
 * "Grupo Bancário Meridional" → "Grupo Bancário". Nome inteiro no eixo vira
 * texto cortado ou rotacionado; as duas primeiras palavras já identificam.
 */
function shortenClientName(name: string): string {
  return name.split(' ').slice(0, 2).join(' ');
}
