/**
 * Serviço REST de projetos (RF03–RF06).
 *
 * **Único lugar** onde o formato do JSON da API aparece para este recurso
 * (ADR-0002). Páginas e componentes recebem `Project`/`ProjectSummary` em
 * camelCase e não sabem se o dado veio da API ou da camada de fixture (ADR-0008).
 *
 * O contrato está em `context/CONTRATO_API.md`. Dois pontos em que ele é
 * exigente e este arquivo é a única defesa:
 *
 * 1. **O objeto do `GET` não é aceito de volta pelo `PUT`.** Ele traz `id`,
 *    `client`, `manager`, `team`, `indicadores` e os timestamps, que não fazem
 *    parte do payload — chave a mais é 400. {@link toProjectPayload} converte.
 * 2. **Query desconhecida é 400, não é ignorada.** Chave com valor vazio nunca
 *    é enviada, senão um filtro "todos" viraria erro.
 */

import { httpGet, httpPost, httpPut, type RequestOptions } from '@/services/http';
import {
  isMockEnabled,
  mockCreateProject,
  mockGetProject,
  mockListProjects,
  mockUpdateProject,
} from '@/services/mock/store';
import type {
  AttentionReason,
  Project,
  ProjectIndicators,
  ProjectInput,
  ProjectQuery,
  ProjectSummary,
  RelatedEntity,
} from '@/types/project';

const RESOURCE_PATH = '/projects';

/**
 * Formato devolvido pela API. Campo em inglês espelha coluna do banco; campo em
 * português é valor derivado — `deadline` vem do banco, `projeto_atrasado` é
 * calculado a cada resposta.
 */
interface RelatedDto {
  id: string;
  name: string;
}

interface IndicatorsDto {
  consumo_orcamento_percentual: number | null;
  projeto_atrasado: boolean;
  orcamento_excedido: boolean;
  consumo_elevado: boolean;
  em_atencao: boolean;
  motivos_de_atencao: AttentionReason[];
}

export interface ProjectSummaryDto {
  id: string;
  name: string;
  status: string;
  start_date: string;
  deadline: string;
  budget: number;
  budget_spent: number;
  hours_worked: number;
  client: RelatedDto;
  manager: RelatedDto;
  team: RelatedDto;
  indicadores: IndicatorsDto;
}

export interface ProjectDto extends ProjectSummaryDto {
  objective: string;
  observations: string | null;
  created_at: string;
  updated_at: string;
}

export function listProjects(
  query: ProjectQuery = {},
  options?: RequestOptions
): Promise<ProjectSummary[]> {
  if (isMockEnabled()) {
    return mockListProjects(query).then((dtos) => dtos.map(toProjectSummary));
  }
  return httpGet<ProjectSummaryDto[]>(`${RESOURCE_PATH}${toQueryString(query)}`, options).then(
    (dtos) => dtos.map(toProjectSummary)
  );
}

export function getProject(id: string, options?: RequestOptions): Promise<Project> {
  if (isMockEnabled()) {
    return mockGetProject(id).then(toProject);
  }
  return httpGet<ProjectDto>(`${RESOURCE_PATH}/${encodeURIComponent(id)}`, options).then(toProject);
}

export function createProject(input: ProjectInput, options?: RequestOptions): Promise<Project> {
  if (isMockEnabled()) {
    return mockCreateProject(input).then(toProject);
  }
  return httpPost<ProjectDto>(RESOURCE_PATH, toProjectPayload(input), options).then(toProject);
}

export function updateProject(
  id: string,
  input: ProjectInput,
  options?: RequestOptions
): Promise<Project> {
  if (isMockEnabled()) {
    return mockUpdateProject(id, input).then(toProject);
  }
  return httpPut<ProjectDto>(
    `${RESOURCE_PATH}/${encodeURIComponent(id)}`,
    toProjectPayload(input),
    options
  ).then(toProject);
}

/** API → domínio, forma de lista. */
function toProjectSummary(dto: ProjectSummaryDto): ProjectSummary {
  return {
    id: dto.id,
    name: dto.name,
    status: dto.status,
    startDate: toCalendarDate(dto.start_date),
    deadline: toCalendarDate(dto.deadline),
    budget: toNumber(dto.budget),
    budgetSpent: toNumber(dto.budget_spent),
    hoursWorked: toNumber(dto.hours_worked),
    client: toRelated(dto.client),
    manager: toRelated(dto.manager),
    team: toRelated(dto.team),
    indicators: toIndicators(dto.indicadores),
  };
}

/** API → domínio, forma de detalhe. */
function toProject(dto: ProjectDto): Project {
  return {
    ...toProjectSummary(dto),
    objective: dto.objective,
    observations: dto.observations,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

function toRelated(dto: RelatedDto): RelatedEntity {
  return { id: dto.id, name: dto.name };
}

/**
 * Os nomes em português do contrato viram os nomes do domínio aqui, e só aqui —
 * é o mesmo princípio do ADR-0002 aplicado ao bloco derivado.
 */
function toIndicators(dto: IndicatorsDto): ProjectIndicators {
  return {
    // `null` é "não calculável" (RN07) e precisa atravessar como `null`.
    consumptionPercent: dto.consumo_orcamento_percentual,
    isLate: dto.projeto_atrasado,
    isOverBudget: dto.orcamento_excedido,
    hasHighConsumption: dto.consumo_elevado,
    needsAttention: dto.em_atencao,
    attentionReasons: dto.motivos_de_atencao ?? [],
  };
}

/**
 * Domínio → API. `id`, relações resolvidas, indicadores e timestamps **não**
 * são enviados: o corpo é estrito e chave a mais responde 400.
 */
function toProjectPayload(input: ProjectInput): Record<string, unknown> {
  return {
    name: input.name,
    client_id: input.clientId,
    objective: input.objective,
    manager_id: input.managerId,
    team_id: input.teamId,
    start_date: input.startDate,
    deadline: input.deadline,
    budget: input.budget,
    // Obrigatórios no `PUT`: são acumulados, não incrementos. Omitir zeraria o
    // consumo do projeto, e a perda só apareceria no dashboard semanas depois.
    budget_spent: input.budgetSpent,
    hours_worked: input.hoursWorked,
    status: input.status,
    observations: input.observations,
  };
}

/** Só entra na query a chave que tem valor: chave desconhecida ou vazia é 400. */
function toQueryString(query: ProjectQuery): string {
  const params = new URLSearchParams();
  if (query.status) {
    params.set('status', query.status);
  }
  if (query.clientId) {
    params.set('client_id', query.clientId);
  }
  const serialized = params.toString();
  return serialized === '' ? '' : `?${serialized}`;
}

/**
 * Mantém a promessa do tipo de domínio: `startDate`/`deadline` são sempre
 * `YYYY-MM-DD`. O contrato garante esse formato, mas o corte defende contra a
 * troca silenciosa para timestamp ISO — que viraria a armadilha A-002 em cada
 * tela, não aqui.
 */
function toCalendarDate(value: string): string {
  return value.slice(0, 10);
}

/**
 * O contrato promete `number` em dinheiro e horas. O parse continua aqui como
 * rede de segurança: valor irreconhecível vira 0 em vez de `NaN` vazando para
 * o gráfico.
 */
function toNumber(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
