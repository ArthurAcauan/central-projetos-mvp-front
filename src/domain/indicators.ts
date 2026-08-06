/**
 * Indicadores derivados dos projetos (RF07, RF09).
 *
 * **Fonte única de cálculo.** Dashboard, lista e detalhes consomem daqui para
 * nunca discordarem entre si; reimplementar qualquer regra destas em uma tela é
 * motivo de rejeição no Definition of Done (armadilha A-005).
 *
 * Módulo puro: sem React, sem I/O, sem acesso a `services/`. Indicador não é
 * persistido — é sempre calculado a partir dos campos do projeto.
 */

import type { Client } from '@/types/client';
import type { Project, ProjectStatus } from '@/types/project';
import { projectStatuses } from '@/types/project';

/** Status que encerram o projeto: projeto encerrado não conta como atrasado (RN08). */
const CLOSED_STATUSES: readonly ProjectStatus[] = ['CONCLUIDO', 'CANCELADO'];

/**
 * Percentual do orçamento previsto já consumido.
 *
 * Devolve `null` quando não há orçamento previsto (RN07): a divisão produziria
 * `Infinity` ou `NaN`, que vazam para a tela como "∞%" e quebram o eixo do
 * gráfico (armadilha A-001). Cabe à UI decidir como exibir a ausência — "—",
 * nunca zero.
 *
 * Pode passar de 100: estouro é permitido (RN03) e precisa aparecer.
 */
export function budgetConsumptionPercent(
  project: Pick<Project, 'budget' | 'budgetSpent'>
): number | null {
  if (project.budget <= 0) {
    return null;
  }
  return (project.budgetSpent / project.budget) * 100;
}

/** Orçamento consumido acima do previsto. Não é erro de validação (RN03). */
export function isOverBudget(project: Pick<Project, 'budget' | 'budgetSpent'>): boolean {
  return project.budgetSpent > project.budget;
}

/**
 * Projeto atrasado (RN08): hoje passou do prazo **e** o projeto não está
 * encerrado.
 *
 * A comparação é de data de calendário no fuso local — prazo igual a hoje
 * **não** está atrasado. Comparar `new Date(deadline)` com o instante atual lê
 * a string como UTC e erra um dia em UTC-3 (armadilha A-002).
 *
 * `today` é injetável para teste; em produção use o padrão.
 */
export function isLate(
  project: Pick<Project, 'deadline' | 'status'>,
  today: Date = new Date()
): boolean {
  if (CLOSED_STATUSES.includes(project.status)) {
    return false;
  }
  const deadline = parseCalendarDate(project.deadline);
  if (deadline === null) {
    return false;
  }
  return deadline.getTime() < startOfLocalDay(today).getTime();
}

/**
 * Projeto em situação de atenção (RN09): status `EM_RISCO`, **ou** atrasado,
 * **ou** com orçamento excedido. Alimenta o painel do RF09.
 */
export function needsAttention(
  project: Pick<Project, 'deadline' | 'status' | 'budget' | 'budgetSpent'>,
  today: Date = new Date()
): boolean {
  return project.status === 'EM_RISCO' || isLate(project, today) || isOverBudget(project);
}

/**
 * Converte uma data de calendário (`YYYY-MM-DD`) em `Date` local à meia-noite.
 *
 * Use isto sempre que precisar de `deadline`/`startDate` como `Date` — inclusive
 * para formatar na tela. `new Date('2026-08-06')` seria meia-noite **UTC**, que
 * em UTC-3 é 05/08 (armadilha A-002).
 *
 * Aceita timestamp ISO completo lendo só a parte da data. Devolve `null` para
 * valor ausente ou inválido, para o indicador degradar em vez de quebrar a tela.
 */
export function parseCalendarDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    return null;
  }
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  // Rejeita data inexistente (ex.: 2026-02-31, que o Date normalizaria para 03/03).
  const isExact =
    date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  return isExact ? date : null;
}

/**
 * Caminho inverso de {@link parseCalendarDate}: `Date` local → `YYYY-MM-DD`.
 *
 * Use isto, e não `toISOString().slice(0, 10)`, que converte para UTC e volta um
 * dia em UTC-3 — mesma família da armadilha A-002.
 */
export function formatCalendarDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Meia-noite local do dia informado. */
function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Agregados do dashboard gerencial (RF07). */
export interface DashboardSummary {
  totalProjects: number;
  /** Contagem por status, sempre com os cinco status — zero inclusive. */
  projectsByStatus: Record<ProjectStatus, number>;
  totalBudget: number;
  totalBudgetSpent: number;
  /** Consumo da carteira inteira. `null` quando o previsto total é zero (RN07). */
  budgetConsumptionPercent: number | null;
  totalHoursWorked: number;
  /** Só o status `EM_RISCO`, sem inferência. */
  atRiskCount: number;
  lateCount: number;
  overBudgetCount: number;
  /** RN09: cada projeto conta uma única vez, mesmo atendendo a várias condições. */
  needsAttentionCount: number;
}

export function summarizeProjects(
  projects: readonly Project[],
  today: Date = new Date()
): DashboardSummary {
  const projectsByStatus = Object.fromEntries(
    projectStatuses.map((status) => [status, 0])
  ) as Record<ProjectStatus, number>;

  let totalBudget = 0;
  let totalBudgetSpent = 0;
  let totalHoursWorked = 0;
  let atRiskCount = 0;
  let lateCount = 0;
  let overBudgetCount = 0;
  let needsAttentionCount = 0;

  for (const project of projects) {
    projectsByStatus[project.status] += 1;
    totalBudget += project.budget;
    totalBudgetSpent += project.budgetSpent;
    totalHoursWorked += project.hoursWorked;

    const late = isLate(project, today);
    const overBudget = isOverBudget(project);
    if (project.status === 'EM_RISCO') {
      atRiskCount += 1;
    }
    if (late) {
      lateCount += 1;
    }
    if (overBudget) {
      overBudgetCount += 1;
    }
    if (project.status === 'EM_RISCO' || late || overBudget) {
      needsAttentionCount += 1;
    }
  }

  return {
    totalProjects: projects.length,
    projectsByStatus,
    totalBudget,
    totalBudgetSpent,
    budgetConsumptionPercent: budgetConsumptionPercent({
      budget: totalBudget,
      budgetSpent: totalBudgetSpent,
    }),
    totalHoursWorked,
    atRiskCount,
    lateCount,
    overBudgetCount,
    needsAttentionCount,
  };
}

/**
 * Projetos que exigem ação gerencial (RF09), na ordem de entrada. Mesma regra do
 * contador `needsAttentionCount` — sem duplicidade, porque a origem é a lista.
 */
export function projectsNeedingAttention(
  projects: readonly Project[],
  today: Date = new Date()
): Project[] {
  return projects.filter((project) => needsAttention(project, today));
}

/** Uma linha por cliente nos gráficos de projetos e orçamento por cliente (RF07, RF08). */
export interface ClientAggregate {
  clientId: string;
  clientName: string;
  projectCount: number;
  budget: number;
  budgetSpent: number;
}

/**
 * Agrupa os projetos por cliente. Clientes sem projeto ficam de fora — não têm
 * o que plotar (armadilha A-006: gráfico com série vazia).
 *
 * Ordena por orçamento previsto decrescente, que é como a barra fica legível.
 */
export function aggregateByClient(
  projects: readonly Project[],
  clients: readonly Client[]
): ClientAggregate[] {
  const nameById = new Map(clients.map((client) => [client.id, client.name]));
  const byClient = new Map<string, ClientAggregate>();

  for (const project of projects) {
    const current = byClient.get(project.clientId) ?? {
      clientId: project.clientId,
      // Projeto cujo cliente não veio na lista não some do gráfico: o orçamento
      // dele continua contando, com rótulo explícito.
      clientName: nameById.get(project.clientId) ?? 'Cliente não identificado',
      projectCount: 0,
      budget: 0,
      budgetSpent: 0,
    };
    current.projectCount += 1;
    current.budget += project.budget;
    current.budgetSpent += project.budgetSpent;
    byClient.set(project.clientId, current);
  }

  return [...byClient.values()].sort(
    (a, b) => b.budget - a.budget || a.clientName.localeCompare(b.clientName, 'pt-BR')
  );
}
