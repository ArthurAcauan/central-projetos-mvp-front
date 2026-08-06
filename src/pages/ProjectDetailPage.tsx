/**
 * Detalhes de um projeto (RF05) — layout portado de `ProjectDetail.tsx` do
 * protótipo, que também é onde o RF09 fica mais explícito: os alertas do topo.
 *
 * Todos os números vêm de `domain/indicators.ts`. O protótipo calcula dias,
 * progresso e saldo dentro do componente, com os defeitos A-001 (divisão por
 * orçamento zero) e A-002 (datas em UTC); aqui isso é chamada de função.
 */

import { Link, useParams } from 'react-router-dom';
import { RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import StatusBadge from '@/components/projects/StatusBadge';
import {
  budgetConsumptionPercent,
  budgetOverrunPercent,
  budgetRemaining,
  daysUntilDeadline,
  isLate,
  isOverBudget,
  scheduleProgressPercent,
} from '@/domain/indicators';
import { useProject, type ProjectDetail } from '@/hooks/useProject';
import { EMPTY_VALUE, formatCurrency, formatDate, formatNumber, formatPercent } from '@/lib/format';
import { paths } from '@/routes/paths';
import { userRoleLabels } from '@/types/user';

const cardClass = 'rounded-lg border border-slate-200 bg-white p-4';
const cardTitleClass =
  'mb-3 font-mono text-xs font-medium tracking-widest text-slate-400 uppercase';

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { detail, isLoading, error, reload } = useProject(id);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <BackLink />
        <p className={`${cardClass} mt-5 py-10 text-center text-sm text-slate-400`} role="status">
          Carregando projeto...
        </p>
      </div>
    );
  }

  if (error !== null || detail === null) {
    return (
      <div className="flex-1 overflow-auto p-6">
        <BackLink />
        <div
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center"
          role="alert"
        >
          <p className="text-sm text-red-700">{error ?? 'Projeto não encontrado.'}</p>
          <button
            className="mt-3 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            onClick={reload}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return <ProjectDetailView detail={detail} />;
}

function ProjectDetailView({ detail }: { detail: ProjectDetail }) {
  const { project, clientName, managerName, managerRole, teamName } = detail;

  const late = isLate(project);
  const overBudget = isOverBudget(project);
  const consumption = budgetConsumptionPercent(project);
  const overrun = budgetOverrunPercent(project);
  const remaining = budgetRemaining(project);
  const daysLeft = daysUntilDeadline(project);
  const scheduleProgress = scheduleProgressPercent(project);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-5 flex items-start gap-3">
        <BackLink />
        <div aria-hidden="true" className="h-5 w-px bg-slate-200" />
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-slate-900">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="mt-0.5 text-sm text-slate-500">{clientName ?? EMPTY_VALUE}</p>
        </div>
      </div>

      {/* Painel de atenção do projeto (RF09). */}
      <div className="mb-5 flex flex-col gap-2 empty:mb-0">
        {overBudget && (
          <Alert tone="error">
            Orçamento excedido em {formatCurrency(Math.abs(remaining))}
            {overrun !== null && ` (${formatPercent(overrun)} acima do previsto)`}
          </Alert>
        )}
        {late && daysLeft !== null && (
          <Alert tone="error">
            Projeto atrasado — o prazo final foi {formatDate(project.deadline)}, há{' '}
            {formatNumber(Math.abs(daysLeft))} {Math.abs(daysLeft) === 1 ? 'dia' : 'dias'}.
          </Alert>
        )}
        {project.status === 'EM_RISCO' && !overBudget && !late && (
          <Alert tone="warning">Projeto classificado como Em risco pelo gestor responsável.</Alert>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <section className={cardClass}>
            <h2 className={cardTitleClass}>Informações gerais</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <InfoRow label="Cliente" value={clientName ?? EMPTY_VALUE} />
              <InfoRow label="Gestor responsável" value={managerName ?? EMPTY_VALUE} />
              <InfoRow label="Equipe" value={teamName ?? EMPTY_VALUE} />
              <InfoRow
                label="Perfil do gestor"
                mono
                value={managerRole === null ? EMPTY_VALUE : userRoleLabels[managerRole]}
              />
              <InfoRow label="Data de início" mono value={formatDate(project.startDate)} />
              <InfoRow
                highlight={late}
                label="Prazo final"
                mono
                value={formatDate(project.deadline)}
              />
            </dl>
          </section>

          <section className={cardClass}>
            <h2 className={cardTitleClass}>Objetivo</h2>
            <p className="text-sm leading-relaxed text-slate-700">{project.objective}</p>
          </section>

          {project.observations !== null && project.observations.trim() !== '' && (
            <section className={cardClass}>
              <h2 className={cardTitleClass}>Observações</h2>
              <p className="text-sm leading-relaxed text-slate-700">{project.observations}</p>
            </section>
          )}

          <section className={cardClass}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className={`${cardTitleClass} mb-0`}>Progresso do prazo</h2>
              <span
                className={`font-mono text-xs font-semibold ${
                  late ? 'text-red-600' : 'text-slate-500'
                }`}
              >
                {formatDeadlineDistance(daysLeft, late)}
              </span>
            </div>
            {scheduleProgress === null ? (
              // Início e prazo no mesmo dia, ou data inválida: não há período a medir.
              <p className="text-xs text-slate-400">Período do projeto indisponível.</p>
            ) : (
              <>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-2 rounded-full ${
                      late ? 'bg-red-500' : scheduleProgress > 80 ? 'bg-orange-400' : 'bg-blue-500'
                    }`}
                    style={{ width: `${scheduleProgress}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between font-mono text-[10px] text-slate-400">
                  <span>{formatDate(project.startDate)}</span>
                  <span>{Math.round(scheduleProgress)}% do período</span>
                  <span>{formatDate(project.deadline)}</span>
                </div>
              </>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className={`${cardClass} text-center`}>
            <h2 className={cardTitleClass}>Consumo do orçamento</h2>
            <BudgetGauge consumption={consumption} overBudget={overBudget} />
            <p className="mt-1 font-mono text-xs text-slate-400">
              {formatCurrency(project.budgetSpent)} / {formatCurrency(project.budget)}
            </p>
          </section>

          <section className={cardClass}>
            <h2 className={cardTitleClass}>Financeiro</h2>
            <dl className="space-y-2.5">
              <MetricRow label="Orçamento previsto" value={formatCurrency(project.budget)} />
              <MetricRow
                highlight={overBudget}
                label="Orçamento consumido"
                value={formatCurrency(project.budgetSpent)}
              />
              <div className="border-t border-slate-100 pt-2">
                <MetricRow
                  highlight={overBudget}
                  label={overBudget ? 'Excedente' : 'Saldo disponível'}
                  value={formatCurrency(Math.abs(remaining))}
                />
              </div>
            </dl>
          </section>

          <section className={cardClass}>
            <h2 className={cardTitleClass}>Horas</h2>
            <p className="font-mono text-3xl font-bold text-slate-800">
              {formatNumber(project.hoursWorked)}
            </p>
            <p className="mt-1 text-xs text-slate-400">horas realizadas no projeto</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      className="flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-700"
      to={paths.projects}
    >
      <span aria-hidden="true">←</span> Voltar
    </Link>
  );
}

/**
 * Meia-rosca do consumo. Sem orçamento previsto não há proporção a desenhar
 * (RN07): o card mostra "—" no lugar do gráfico, em vez de um arco vazio
 * (armadilha A-006).
 */
function BudgetGauge({
  consumption,
  overBudget,
}: {
  consumption: number | null;
  overBudget: boolean;
}) {
  const valueClass = overBudget
    ? 'text-red-600'
    : consumption !== null && consumption > 80
      ? 'text-orange-600'
      : 'text-blue-600';

  if (consumption === null) {
    return (
      <>
        <p className={`font-mono text-2xl font-bold ${valueClass}`}>{EMPTY_VALUE}</p>
        <p className="mt-1 text-xs text-slate-400">Sem orçamento previsto para comparar.</p>
      </>
    );
  }

  // Hex porque SVG não aceita classe Tailwind. São red-500, orange-400 e
  // blue-500 — os mesmos tons das barras de progresso, para o arco e a barra
  // logo ao lado não parecerem estados diferentes.
  const fill = overBudget ? '#ef4444' : consumption > 80 ? '#fb923c' : '#3b82f6';

  return (
    <>
      <div aria-hidden="true" className="h-[140px]">
        <ResponsiveContainer height={140} width="100%">
          <RadialBarChart
            cx="50%"
            cy="70%"
            data={[
              { value: 100, fill: '#f1f5f9' },
              { value: Math.min(consumption, 100), fill },
            ]}
            endAngle={0}
            innerRadius="60%"
            outerRadius="100%"
            startAngle={180}
          >
            <RadialBar background={false} dataKey="value" />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <p className={`-mt-6 font-mono text-2xl font-bold ${valueClass}`}>
        {formatPercent(consumption)}
      </p>
    </>
  );
}

function InfoRow({
  label,
  value,
  mono,
  highlight,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt className="mb-0.5 text-[11px] text-slate-400">{label}</dt>
      <dd
        className={`text-sm font-medium ${highlight ? 'text-red-600' : 'text-slate-800'} ${
          mono ? 'font-mono' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function MetricRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd
        className={`font-mono text-sm font-medium ${highlight ? 'text-red-600' : 'text-slate-700'}`}
      >
        {value}
      </dd>
    </div>
  );
}

/**
 * Aviso do painel de atenção (RF09). Recebe `role` para o leitor de tela
 * anunciar o sinal: sem ele, o alerta só é lido por quem passar por ele na
 * ordem do documento — que é o oposto do que o requisito quer.
 */
function Alert({ tone, children }: { tone: 'error' | 'warning'; children: React.ReactNode }) {
  const toneClass =
    tone === 'error'
      ? 'bg-red-50 border-red-200 text-red-700'
      : 'bg-amber-50 border-amber-200 text-amber-700';

  return (
    <p
      className={`flex items-start gap-2.5 rounded border px-3.5 py-2.5 text-sm ${toneClass}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <span aria-hidden="true" className="shrink-0 font-bold">
        {tone === 'error' ? '⚠' : '!'}
      </span>
      <span>{children}</span>
    </p>
  );
}

/**
 * "12d restantes" / "3d atrasado" / "vence hoje". Texto, não cor: o mesmo aviso
 * precisa chegar a quem não distingue vermelho de cinza.
 */
function formatDeadlineDistance(daysLeft: number | null, late: boolean): string {
  if (daysLeft === null) {
    return EMPTY_VALUE;
  }
  if (late) {
    return `${formatNumber(Math.abs(daysLeft))}d atrasado`;
  }
  if (daysLeft === 0) {
    return 'vence hoje';
  }
  if (daysLeft < 0) {
    // Prazo vencido em projeto já encerrado: não é atraso (RN08).
    return `encerrado após o prazo`;
  }
  return `${formatNumber(daysLeft)}d restantes`;
}
