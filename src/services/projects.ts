/**
 * Serviço REST de projetos (RF03–RF06).
 *
 * **Único lugar** onde o formato do JSON da API aparece para este recurso
 * (ADR-0002). Páginas e componentes recebem `Project` em camelCase e não sabem
 * se o dado veio da API ou da camada mock (ADR-0001).
 *
 * Se o backend confirmar outro casing na integração (F5-1), muda `ProjectDto` e
 * os dois mapeadores abaixo — nada além disso.
 */

import { httpGet, httpPost, httpPut, type RequestOptions } from '@/services/http';
import {
  isMockEnabled,
  mockCreateProject,
  mockGetProject,
  mockListProjects,
  mockUpdateProject,
} from '@/services/mock/store';
import type { Project, ProjectInput, ProjectStatus } from '@/types/project';

const RESOURCE_PATH = '/projects';

/**
 * Formato devolvido pela API, conforme a modelagem
 * (`context/04_modelagem_dados_e_banco.md`): colunas em `snake_case`.
 *
 * Os campos `NUMERIC` do PostgreSQL podem chegar como string — é assim que o
 * Prisma serializa `Decimal` por padrão. O mapeador normaliza, para o domínio
 * nunca receber `"480000.00"` onde espera número.
 */
interface ProjectDto {
  id: string;
  name: string;
  client_id: string;
  objective: string;
  manager_id: string;
  team_id: string;
  start_date: string;
  deadline: string;
  budget: number | string;
  budget_spent: number | string;
  hours_worked: number | string;
  status: ProjectStatus;
  observations: string | null;
  created_at: string;
  updated_at: string;
}

export function listProjects(options?: RequestOptions): Promise<Project[]> {
  if (isMockEnabled()) {
    return mockListProjects();
  }
  return httpGet<ProjectDto[]>(RESOURCE_PATH, options).then((dtos) => dtos.map(toProject));
}

export function getProject(id: string, options?: RequestOptions): Promise<Project> {
  if (isMockEnabled()) {
    return mockGetProject(id);
  }
  return httpGet<ProjectDto>(`${RESOURCE_PATH}/${id}`, options).then(toProject);
}

export function createProject(input: ProjectInput, options?: RequestOptions): Promise<Project> {
  if (isMockEnabled()) {
    return mockCreateProject(input);
  }
  return httpPost<ProjectDto>(RESOURCE_PATH, toProjectPayload(input), options).then(toProject);
}

export function updateProject(
  id: string,
  input: ProjectInput,
  options?: RequestOptions
): Promise<Project> {
  if (isMockEnabled()) {
    return mockUpdateProject(id, input);
  }
  return httpPut<ProjectDto>(`${RESOURCE_PATH}/${id}`, toProjectPayload(input), options).then(
    toProject
  );
}

/** API → domínio. */
function toProject(dto: ProjectDto): Project {
  return {
    id: dto.id,
    name: dto.name,
    clientId: dto.client_id,
    objective: dto.objective,
    managerId: dto.manager_id,
    teamId: dto.team_id,
    startDate: toCalendarDate(dto.start_date),
    deadline: toCalendarDate(dto.deadline),
    budget: toNumber(dto.budget),
    budgetSpent: toNumber(dto.budget_spent),
    hoursWorked: toNumber(dto.hours_worked),
    status: dto.status,
    observations: dto.observations,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}

/** Domínio → API. `id` e timestamps são do backend e não são enviados. */
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
    budget_spent: input.budgetSpent,
    hours_worked: input.hoursWorked,
    status: input.status,
    observations: input.observations,
  };
}

/**
 * Mantém a promessa do tipo de domínio: `startDate`/`deadline` são sempre
 * `YYYY-MM-DD`. Se o backend serializar a coluna `DATE` como timestamp ISO,
 * corta aqui — e não em cada tela, onde viraria a armadilha A-002.
 */
function toCalendarDate(value: string): string {
  return value.slice(0, 10);
}

/** Aceita o `NUMERIC` como número ou string; valor irreconhecível vira 0. */
function toNumber(value: number | string): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
