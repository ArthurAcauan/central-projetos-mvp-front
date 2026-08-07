/**
 * Dashboard gerencial (RF07, RF08, RF09) — layout portado de `Dashboard.tsx` do
 * protótipo.
 *
 * Três blocos: os cards de indicador (RF07), os gráficos (RF08) e a tabela dos
 * projetos que exigem ação (RF09).
 *
 * **Nenhum número é calculado aqui.** Atraso, consumo e situação de atenção
 * vêm do backend em `project.indicators` (ADR-0007); a consolidação da carteira
 * vem de `summarizeProjects`, `aggregateByClient`, `projectsNeedingAttention` e
 * `topProjectsByHours`, em `domain/indicators.ts`. A página só formata e
 * desenha. O protótipo faz o oposto e leva junto os defeitos A-001 (divisão por
 * orçamento zero) e A-002 (prazo comparado em UTC).
 *
 * A carga é uma só, `GET /projects` — ver `useDashboard` para por que
 * `GET /dashboard` não é usado.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import KpiCard from '@/components/dashboard/KpiCard';
import StatusBadge from '@/components/projects/StatusBadge';
import {
  aggregateByClient,
  projectsNeedingAttention,
  summarizeProjects,
  topProjectsByHours,
} from '@/domain/indicators';
import { useDashboard } from '@/hooks/useDashboard';
import { EMPTY_VALUE, formatCurrency, formatDate, formatNumber, formatPercent } from '@/lib/format';
import { projectDetailPath } from '@/routes/paths';
import {
  attentionReasonLabels,
  projectStatusLabels,
  projectStatuses,
  type ProjectSummary,
} from '@/types/project';

export default function DashboardPage() {
  const { projects, isLoading, error, reload } = useDashboard();

  const summary = useMemo(() => summarizeProjects(projects), [projects]);
  const byClient = useMemo(() => aggregateByClient(projects), [projects]);
  const hoursByProject = useMemo(() => topProjectsByHours(projects), [projects]);
  const attention = useMemo(() => projectsNeedingAttention(projects), [projects]);

  return (
    <div className="flex-1 overflow-auto p-6">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-0.5 font-mono text-sm text-slate-500">
          Visão consolidada da carteira de projetos
        </p>
      </header>

      {isLoading && (
        <p
          className="rounded-lg border border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-400"
          role="status"
        >
          Carregando indicadores...
        </p>
      )}

      {!isLoading && error !== null && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center"
          role="alert"
        >
          <p className="text-sm text-red-700">{error}</p>
          <button
            className="mt-3 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            onClick={reload}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!isLoading && error === null && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              detail={`${formatNumber(byClient.length)} ${byClient.length === 1 ? 'cliente' : 'clientes'} com projeto`}
              label="Total de projetos"
              tone="blue"
              value={formatNumber(summary.totalProjects)}
            />
            {/* RN09 revisado (ADR-0007): atrasado, estourado ou com consumo
                elevado, cada projeto uma vez. Não somar com "em risco" — um
                projeto pode estar nos dois, e a soma passaria do total. */}
            <KpiCard
              detail={`${formatNumber(summary.lateCount)} atrasados · ${formatNumber(summary.overBudgetCount)} estourados · ${formatNumber(summary.atRiskCount)} em risco`}
              label="Em situação de atenção"
              tone="red"
              value={formatNumber(summary.needsAttentionCount)}
            />
            <KpiCard
              // `null` quando não há orçamento previsto na carteira (RN07):
              // "—", nunca "0%", que diria algo diferente.
              detail={`${formatPercent(summary.budgetConsumptionPercent)} consumido (${formatCurrency(summary.totalBudgetSpent)})`}
              label="Orçamento total"
              tone="slate"
              value={formatCurrency(summary.totalBudget)}
            />
            <KpiCard
              detail="horas acumuladas na carteira"
              label="Horas realizadas"
              tone="emerald"
              value={formatNumber(summary.totalHoursWorked)}
            />
          </div>

          {/* Os mesmos números da rosca, em texto: o SVG do Recharts não é
              navegável por leitor de tela. */}
          <ul className="sr-only">
            {projectStatuses.map((status) => (
              <li key={status}>
                {projectStatusLabels[status]}: {formatNumber(summary.projectsByStatus[status])}{' '}
                projetos
              </li>
            ))}
          </ul>

          <div className="mb-6">
            <DashboardCharts
              byClient={byClient}
              hoursByProject={hoursByProject}
              projectsByStatus={summary.projectsByStatus}
            />
          </div>

          <AttentionPanel projects={attention} />
        </>
      )}
    </div>
  );
}

/**
 * Painel de atenção (RF09): atrasado, com orçamento excedido ou com consumo
 * elevado, cada projeto uma única vez (RN09 revisado no ADR-0007). Quem decide
 * é o backend, em `indicators.needsAttention`; aqui só se decide o que mostrar.
 */
function AttentionPanel({ projects }: { projects: ProjectSummary[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-800">Projetos em situação de atenção</h2>
        <span className="rounded border border-red-200 bg-red-50 px-2 py-0.5 font-mono text-xs text-red-600">
          {formatNumber(projects.length)} {projects.length === 1 ? 'projeto' : 'projetos'}
        </span>
      </div>

      {projects.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-400">
          Nenhum projeto em situação de atenção.
        </p>
      ) : (
        <table className="w-full text-sm">
          <caption className="sr-only">
            Projetos em risco, atrasados ou com orçamento excedido
          </caption>
          <thead>
            <tr className="border-b border-slate-100 font-mono text-[11px] text-slate-400 uppercase">
              <th className="px-4 py-2.5 text-left font-medium" scope="col">
                Projeto
              </th>
              <th className="px-4 py-2.5 text-left font-medium" scope="col">
                Status
              </th>
              <th className="px-4 py-2.5 text-left font-medium" scope="col">
                Motivo
              </th>
              <th className="px-4 py-2.5 text-left font-medium" scope="col">
                Prazo
              </th>
              <th className="px-4 py-2.5 text-right font-medium" scope="col">
                Consumo
              </th>
              <th className="px-4 py-2.5 text-right font-medium" scope="col">
                Orçamento
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {projects.map((project) => {
              const {
                isLate: late,
                isOverBudget: overBudget,
                consumptionPercent: consumption,
              } = project.indicators;

              return (
                <tr className="transition-colors hover:bg-slate-50" key={project.id}>
                  <td className="px-4 py-3">
                    <Link
                      className="font-medium text-slate-900 hover:text-blue-600 hover:underline"
                      to={projectDetailPath(project.id)}
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge size="sm" status={project.status} />
                  </td>
                  {/* Motivo em texto, não só em cor: o mesmo sinal precisa
                      chegar a quem não distingue vermelho de cinza. */}
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                    {reasonsFor(project)}
                  </td>
                  <td
                    className={`px-4 py-3 font-mono text-xs ${
                      late ? 'font-medium text-red-600' : 'text-slate-600'
                    }`}
                  >
                    {formatDate(project.deadline)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono text-xs ${
                      overBudget ? 'font-semibold text-red-600' : 'text-slate-600'
                    }`}
                  >
                    {consumption === null ? EMPTY_VALUE : formatPercent(consumption)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-slate-600">
                    {formatCurrency(project.budget)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}

/**
 * Por que o projeto está no painel. Os motivos vêm da API
 * (`indicators.attentionReasons`) — o front não decide, só traduz para pt-BR.
 * Pode ser mais de um ao mesmo tempo.
 *
 * O status `EM_RISCO` entra como motivo adicional mesmo não fazendo parte do
 * `em_atencao` do backend: quando o gestor declarou risco, quem lê a linha
 * precisa saber disso também.
 */
function reasonsFor(project: ProjectSummary): string {
  const reasons = project.indicators.attentionReasons.map(
    (reason) => attentionReasonLabels[reason]
  );
  if (project.status === 'EM_RISCO') {
    reasons.unshift('Em risco');
  }
  return reasons.join(' · ');
}
