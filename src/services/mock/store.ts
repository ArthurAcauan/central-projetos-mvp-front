/**
 * Camada de fixture em memória (ADR-0001, revisto no ADR-0008).
 *
 * Serve para demonstrar o front sem subir a API. Desde a integração (F5-1) o
 * estado normal é `VITE_USE_MOCK=false` — isto aqui é a alternativa para
 * apresentação sem backend, não o caminho padrão.
 *
 * **Devolve DTO, não domínio.** A tradução continua sendo dos mapeadores de
 * `services/`, os mesmos que traduzem a resposta real: assim a fixture não tem
 * um caminho próprio de conversão que possa divergir do contrato em silêncio.
 *
 * Cenários, via `VITE_MOCK_SCENARIO`:
 *
 * | Cenário  | O que acontece |
 * |---|---|
 * | `padrao` | Respostas capturadas da API (default) |
 * | `vazio`  | Listas vazias e busca por id sem resultado — exercita estado vazio |
 * | `erro`   | Toda chamada falha com `HttpError` 500 — exercita estado de erro |
 *
 * O estado vive em memória: recarregar a página volta à fixture.
 */

import type { ClientDto } from '@/services/clients';
import { HttpError } from '@/services/http';
import {
  clientFixtures,
  projectFixtures,
  teamFixtures,
  userFixtures,
} from '@/services/mock/fixtures';
import type { ProjectDto, ProjectSummaryDto } from '@/services/projects';
import type { TeamDto } from '@/services/teams';
import type { UserDto } from '@/services/users';
import type { ClientInput } from '@/types/client';
import type { ProjectInput, ProjectQuery } from '@/types/project';
import type { TeamInput } from '@/types/team';
import type { UserInput } from '@/types/user';

export type MockScenario = 'padrao' | 'vazio' | 'erro';

/** Latência só fora de teste: a suíte não deve pagar por realismo de rede. */
const LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 300;

/** Consumo a partir do qual o backend marca `consumo_elevado`. */
const HIGH_CONSUMPTION_THRESHOLD = 90;

interface MockState {
  projects: ProjectDto[];
  clients: ClientDto[];
  teams: TeamDto[];
  users: UserDto[];
}

let state: MockState = freshState();
let idCounter = 0;

function freshState(): MockState {
  return {
    projects: projectFixtures.map((project) => ({ ...project })),
    clients: clientFixtures.map((client) => ({ ...client })),
    teams: teamFixtures.map((team) => ({ ...team })),
    users: userFixtures.map((user) => ({ ...user })),
  };
}

/** Volta à fixture. Usado pelos testes; em produção o reload da página já faz isso. */
export function resetMockStore(): void {
  state = freshState();
  idCounter = 0;
}

/**
 * Liga a camada de fixture. **Desligada por padrão** desde F5-1: o backend
 * existe, e integrar com ele é o estado normal do projeto. Só
 * `VITE_USE_MOCK=true` faz o front servir a fixture.
 */
export function isMockEnabled(): boolean {
  return import.meta.env.VITE_USE_MOCK === 'true';
}

function currentScenario(): MockScenario {
  const value = import.meta.env.VITE_MOCK_SCENARIO;
  return value === 'vazio' || value === 'erro' ? value : 'padrao';
}

/**
 * Aplica latência e cenário antes de devolver o dado. A falha sai como
 * `HttpError`, o mesmo tipo da API real — a UI trata um caminho só.
 */
async function respond<T>(produce: () => T): Promise<T> {
  if (LATENCY_MS > 0) {
    await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
  }
  if (currentScenario() === 'erro') {
    throw new HttpError('server', 'Erro no servidor. Tente novamente em instantes.', 500);
  }
  return produce();
}

function isEmptyScenario(): boolean {
  return currentScenario() === 'vazio';
}

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-fixture-${String(idCounter).padStart(3, '0')}`;
}

function nowTimestamp(): string {
  return new Date().toISOString();
}

function notFound(resource: string): HttpError {
  return new HttpError('client', `${resource} não encontrado.`, 404);
}

export function mockListProjects(query: ProjectQuery = {}): Promise<ProjectSummaryDto[]> {
  return respond(() => {
    if (isEmptyScenario()) {
      return [];
    }
    return state.projects
      .filter((project) => {
        if (query.status !== undefined && project.status !== query.status) {
          return false;
        }
        return query.clientId === undefined || project.client.id === query.clientId;
      })
      .map(toSummaryDto);
  });
}

export function mockGetProject(id: string): Promise<ProjectDto> {
  return respond(() => {
    const project = isEmptyScenario() ? undefined : state.projects.find((item) => item.id === id);
    if (!project) {
      throw notFound('Projeto');
    }
    return { ...project };
  });
}

export function mockCreateProject(input: ProjectInput): Promise<ProjectDto> {
  return respond(() => {
    const timestamp = nowTimestamp();
    const project = toProjectDto(input, nextId('prj'), timestamp, timestamp);
    state.projects = [...state.projects, project];
    return { ...project };
  });
}

export function mockUpdateProject(id: string, input: ProjectInput): Promise<ProjectDto> {
  return respond(() => {
    const current = state.projects.find((item) => item.id === id);
    if (!current) {
      throw notFound('Projeto');
    }
    const updated = toProjectDto(input, id, current.created_at, nowTimestamp());
    state.projects = state.projects.map((item) => (item.id === id ? updated : item));
    return { ...updated };
  });
}

/** Detalhe → resumo: a lista da API não devolve objetivo, observação nem timestamps. */
function toSummaryDto(project: ProjectDto): ProjectSummaryDto {
  const { objective, observations, created_at, updated_at, ...summary } = project;
  void objective;
  void observations;
  void created_at;
  void updated_at;
  return summary;
}

/**
 * Monta o DTO de um projeto criado ou alterado **na fixture**.
 *
 * Os indicadores aqui são uma **aproximação da regra do backend**, feita só
 * para a demonstração offline não exibir campos vazios depois de um cadastro.
 * A regra de verdade é a da API (ADR-0007) — nada disto é importado por
 * `domain/` ou por uma tela, e a divergência mais provável (a comparação de
 * atraso) fica de fora: `projeto_atrasado` é sempre `false` aqui, porque um
 * projeto recém-cadastrado na demonstração não tem por que estar atrasado.
 */
function toProjectDto(
  input: ProjectInput,
  id: string,
  createdAt: string,
  updatedAt: string
): ProjectDto {
  const consumptionPercent =
    input.budget > 0 ? round2((input.budgetSpent / input.budget) * 100) : null;
  const isOverBudget = input.budgetSpent > input.budget;
  const hasHighConsumption =
    consumptionPercent !== null && consumptionPercent >= HIGH_CONSUMPTION_THRESHOLD;
  const isClosed = input.status === 'CONCLUIDO' || input.status === 'CANCELADO';

  return {
    id,
    name: input.name,
    status: input.status,
    start_date: input.startDate,
    deadline: input.deadline,
    budget: input.budget,
    budget_spent: input.budgetSpent,
    hours_worked: input.hoursWorked,
    client: relatedOf(state.clients, input.clientId),
    manager: relatedOf(state.users, input.managerId),
    team: relatedOf(state.teams, input.teamId),
    indicadores: {
      consumo_orcamento_percentual: consumptionPercent,
      projeto_atrasado: false,
      orcamento_excedido: isOverBudget,
      consumo_elevado: hasHighConsumption,
      em_atencao: !isClosed && (isOverBudget || hasHighConsumption),
      motivos_de_atencao: isClosed
        ? []
        : [
            ...(isOverBudget ? (['ORCAMENTO_EXCEDIDO'] as const) : []),
            ...(hasHighConsumption ? (['CONSUMO_ELEVADO'] as const) : []),
          ],
    },
    objective: input.objective,
    observations: input.observations,
    created_at: createdAt,
    updated_at: updatedAt,
  };
}

function relatedOf(
  items: readonly { id: string; name: string }[],
  id: string
): { id: string; name: string } {
  const found = items.find((item) => item.id === id);
  return found ? { id: found.id, name: found.name } : { id, name: 'Não identificado' };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function mockListClients(): Promise<ClientDto[]> {
  return respond(() => (isEmptyScenario() ? [] : state.clients.map((client) => ({ ...client }))));
}

export function mockCreateClient(input: ClientInput): Promise<ClientDto> {
  return respond(() => {
    const timestamp = nowTimestamp();
    const client: ClientDto = {
      id: nextId('cli'),
      name: input.name,
      created_at: timestamp,
      updated_at: timestamp,
    };
    state.clients = [...state.clients, client];
    return { ...client };
  });
}

export function mockListTeams(): Promise<TeamDto[]> {
  return respond(() => (isEmptyScenario() ? [] : state.teams.map((team) => ({ ...team }))));
}

export function mockCreateTeam(input: TeamInput): Promise<TeamDto> {
  return respond(() => {
    const team: TeamDto = { id: nextId('team'), name: input.name, created_at: nowTimestamp() };
    state.teams = [...state.teams, team];
    return { ...team };
  });
}

export function mockListUsers(): Promise<UserDto[]> {
  return respond(() => (isEmptyScenario() ? [] : state.users.map((user) => ({ ...user }))));
}

export function mockCreateUser(input: UserInput): Promise<UserDto> {
  return respond(() => {
    const user: UserDto = {
      id: nextId('usr'),
      name: input.name,
      email: input.email,
      role: input.role,
      created_at: nowTimestamp(),
    };
    state.users = [...state.users, user];
    return { ...user };
  });
}
