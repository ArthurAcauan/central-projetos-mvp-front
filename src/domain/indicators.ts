/**
 * Indicadores derivados dos projetos (RF07, RF09).
 *
 * **Quem calcula o que**, desde a integração com a API real ([ADR-0007](../../docs/decisions/ADR-0007-indicadores-vem-do-backend.md)):
 *
 * - O **backend** decide atraso, consumo do orçamento, estouro, consumo elevado
 *   e situação de atenção. Chegam prontos em `project.indicators` e **não** são
 *   recalculados aqui: duas implementações de "está atrasado" divergiriam, e a
 *   do front perderia — é a armadilha A-002 outra vez, agora entre repositórios.
 * - Este módulo cobre o que a API não manda: distância até o prazo, progresso do
 *   período, saldo do orçamento e os **agregados** que os gráficos do RF08
 *   pedem e que `GET /dashboard` não entrega (orçamento por cliente, horas por
 *   projeto).
 *
 * Continua valendo o resto: módulo puro, sem React, sem I/O, sem `services/`.
 * E continua sendo a fonte única do que ele ainda calcula — reimplementar
 * qualquer coisa daqui em uma tela é motivo de rejeição no DoD (armadilha A-005).
 */

import type { ProjectSummary } from '@/types/project';
import { projectStatuses, type ProjectStatus } from '@/types/project';

/**
 * Quanto do orçamento previsto ainda resta. Negativo é o valor que estourou
 * (RN03) — a tela decide se chama de "saldo disponível" ou de "excedente".
 *
 * Sem guarda de zero: subtração não divide, e `budget = 0` dá `-budgetSpent`,
 * que é a resposta correta.
 */
export function budgetRemaining(project: Pick<ProjectSummary, 'budget' | 'budgetSpent'>): number {
  return project.budget - project.budgetSpent;
}

/**
 * Quanto o consumo passou do previsto, em pontos percentuais. Zero quando está
 * dentro do orçamento, `null` quando não há previsto para comparar (RN07).
 *
 * Deriva do percentual que a **API** mandou, não de uma divisão própria: os dois
 * números aparecem na mesma tela e não podem discordar por arredondamento.
 */
export function budgetOverrunPercent(project: Pick<ProjectSummary, 'indicators'>): number | null {
  const consumption = project.indicators.consumptionPercent;
  if (consumption === null) {
    return null;
  }
  return Math.max(0, consumption - 100);
}

/**
 * Dias de calendário até o prazo: positivo é o que resta, negativo é o atraso,
 * zero é "vence hoje". `null` se o prazo não for uma data válida.
 *
 * Conta em dias locais inteiros, não em milissegundos entre instantes — a
 * diferença entre dois `Date` com hora atravessa o horário de verão e devolve
 * 29,96 dias, que arredondado erra um dia (parente da armadilha A-002).
 *
 * Repare que isto **não** decide atraso: projeto encerrado tem dias negativos e
 * não está atrasado. Quem decide é `project.indicators.isLate`, do backend.
 */
export function daysUntilDeadline(
  project: Pick<ProjectSummary, 'deadline'>,
  today: Date = new Date()
): number | null {
  const deadline = parseCalendarDate(project.deadline);
  if (deadline === null) {
    return null;
  }
  return differenceInCalendarDays(deadline, startOfLocalDay(today));
}

/**
 * Percentual do período do projeto já decorrido, de 0 a 100 (RF05).
 *
 * Limitado a 100 mesmo com o prazo vencido: o excedente é informado como
 * atraso, e uma barra de 340% não cabe na tela.
 *
 * Devolve `null` quando não há período a medir — datas inválidas ou prazo igual
 * à data de início, em que a divisão produziria `Infinity`/`NaN` (mesma família
 * da armadilha A-001). O protótipo não tem essa guarda.
 */
export function scheduleProgressPercent(
  project: Pick<ProjectSummary, 'startDate' | 'deadline'>,
  today: Date = new Date()
): number | null {
  const start = parseCalendarDate(project.startDate);
  const deadline = parseCalendarDate(project.deadline);
  if (start === null || deadline === null) {
    return null;
  }
  const totalDays = differenceInCalendarDays(deadline, start);
  if (totalDays <= 0) {
    return null;
  }
  const elapsedDays = differenceInCalendarDays(startOfLocalDay(today), start);
  return clampPercent((elapsedDays / totalDays) * 100);
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

/**
 * Diferença em dias de calendário (`a - b`), contando dias inteiros no fuso
 * local. Ambos os lados são normalizados para meia-noite antes da conta, então
 * o resultado não depende da hora nem do horário de verão.
 */
function differenceInCalendarDays(a: Date, b: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const diff = startOfLocalDay(a).getTime() - startOfLocalDay(b).getTime();
  return Math.round(diff / MS_PER_DAY);
}

/** Prende um percentual ao intervalo exibível [0, 100]. */
function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/** Agregados do dashboard gerencial (RF07). */
export interface DashboardSummary {
  totalProjects: number;
  /** Contagem por status, sempre com os cinco canônicos — zero inclusive. */
  projectsByStatus: Record<ProjectStatus, number>;
  /**
   * Status fora dos cinco canônicos, se o banco tiver algum. Vem separado em vez
   * de descartado: o contrato expõe o valor estranho de propósito, para denunciar
   * dado corrompido em vez de escondê-lo (armadilha 5 do contrato).
   */
  unknownStatuses: { status: string; total: number }[];
  totalBudget: number;
  totalBudgetSpent: number;
  /** Consumo da carteira inteira. `null` quando o previsto total é zero (RN07). */
  budgetConsumptionPercent: number | null;
  totalHoursWorked: number;
  /** Status `EM_RISCO`: julgamento manual do gestor, não indicador derivado. */
  atRiskCount: number;
  lateCount: number;
  overBudgetCount: number;
  highConsumptionCount: number;
  /**
   * RN09 revisado (ADR-0007): atrasado, com orçamento excedido ou com consumo
   * elevado, cada projeto contado uma única vez. **Não** some com
   * {@link atRiskCount} — um projeto pode estar nos dois, e a soma passaria do
   * total da carteira.
   */
  needsAttentionCount: number;
}

/**
 * Consolida a carteira **lendo** os indicadores que a API mandou por projeto.
 * A única conta que sobra aqui é somar — e o percentual da carteira, que a API
 * só devolve em `GET /dashboard`, endpoint que este front não usa (ADR-0007).
 */
export function summarizeProjects(projects: readonly ProjectSummary[]): DashboardSummary {
  const projectsByStatus = Object.fromEntries(
    projectStatuses.map((status) => [status, 0])
  ) as Record<ProjectStatus, number>;
  const unknownByStatus = new Map<string, number>();

  let totalBudget = 0;
  let totalBudgetSpent = 0;
  let totalHoursWorked = 0;
  let atRiskCount = 0;
  let lateCount = 0;
  let overBudgetCount = 0;
  let highConsumptionCount = 0;
  let needsAttentionCount = 0;

  for (const project of projects) {
    if (isCanonicalStatus(project.status)) {
      projectsByStatus[project.status] += 1;
    } else {
      unknownByStatus.set(project.status, (unknownByStatus.get(project.status) ?? 0) + 1);
    }

    totalBudget += project.budget;
    totalBudgetSpent += project.budgetSpent;
    totalHoursWorked += project.hoursWorked;

    if (project.status === 'EM_RISCO') {
      atRiskCount += 1;
    }
    const { isLate, isOverBudget, hasHighConsumption, needsAttention } = project.indicators;
    if (isLate) {
      lateCount += 1;
    }
    if (isOverBudget) {
      overBudgetCount += 1;
    }
    if (hasHighConsumption) {
      highConsumptionCount += 1;
    }
    if (needsAttention) {
      needsAttentionCount += 1;
    }
  }

  return {
    totalProjects: projects.length,
    projectsByStatus,
    unknownStatuses: [...unknownByStatus.entries()].map(([status, total]) => ({ status, total })),
    totalBudget,
    totalBudgetSpent,
    // `null` quando não há previsto na carteira inteira (RN07): "—", nunca 0%.
    budgetConsumptionPercent: totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : null,
    totalHoursWorked,
    atRiskCount,
    lateCount,
    overBudgetCount,
    highConsumptionCount,
    needsAttentionCount,
  };
}

function isCanonicalStatus(status: string): status is ProjectStatus {
  return projectStatuses.some((canonical) => canonical === status);
}

/**
 * Projetos que exigem ação gerencial (RF09), na ordem em que a API devolveu —
 * que é por prazo crescente, o que vence antes primeiro.
 *
 * O recorte é do backend (`indicators.needsAttention`), não uma regra daqui.
 * Existe como função para a tela não espalhar o critério, e para o dia em que
 * `GET /projects/attention` for adotado a troca acontecer em um lugar só.
 */
export function projectsNeedingAttention(projects: readonly ProjectSummary[]): ProjectSummary[] {
  return projects.filter((project) => project.indicators.needsAttention);
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
 * O nome vem de dentro do projeto: a API resolve a relação na resposta, então
 * não é mais preciso cruzar com a lista de clientes.
 *
 * Ordena por orçamento previsto decrescente, que é como a barra fica legível.
 */
export function aggregateByClient(projects: readonly ProjectSummary[]): ClientAggregate[] {
  const byClient = new Map<string, ClientAggregate>();

  for (const project of projects) {
    const current = byClient.get(project.client.id) ?? {
      clientId: project.client.id,
      clientName: project.client.name,
      projectCount: 0,
      budget: 0,
      budgetSpent: 0,
    };
    current.projectCount += 1;
    current.budget += project.budget;
    current.budgetSpent += project.budgetSpent;
    byClient.set(project.client.id, current);
  }

  return [...byClient.values()].sort(
    (a, b) => b.budget - a.budget || a.clientName.localeCompare(b.clientName, 'pt-BR')
  );
}

/** Uma barra no gráfico de horas por projeto (RF08). */
export interface ProjectHours {
  projectId: string;
  projectName: string;
  hours: number;
}

/**
 * Projetos com mais horas realizadas, do maior para o menor.
 *
 * Projeto sem apontamento fica de fora: uma barra de altura zero não informa
 * nada e só consome espaço do eixo (armadilha A-006). O corte por `limit`
 * existe porque o gráfico fica ilegível com dezenas de barras — quem precisa da
 * lista completa usa a consulta de projetos (RF04).
 */
export function topProjectsByHours(projects: readonly ProjectSummary[], limit = 8): ProjectHours[] {
  return projects
    .filter((project) => project.hoursWorked > 0)
    .map((project) => ({
      projectId: project.id,
      projectName: project.name,
      hours: project.hoursWorked,
    }))
    .sort((a, b) => b.hours - a.hours || a.projectName.localeCompare(b.projectName, 'pt-BR'))
    .slice(0, limit);
}
