/**
 * Camada de dados mock em memória (F1-4, ADR-0001).
 *
 * O front roda inteiro sem backend: as funções daqui têm a mesma assinatura das
 * chamadas REST de `services/`, e quem consome não sabe de onde veio o dado.
 * Trocar pelo backend real (F5-1) é apontar a `baseURL` e desligar `VITE_USE_MOCK`.
 *
 * O risco que o ADR-0001 manda controlar é o mock ser "gentil" e esconder o que
 * a API real produz. Por isso ele simula latência e responde a `VITE_MOCK_SCENARIO`:
 *
 * | Cenário  | O que acontece |
 * |---|---|
 * | `padrao` | Seed completo (default) |
 * | `vazio`  | Listas vazias e busca por id sem resultado — exercita estado vazio |
 * | `erro`   | Toda chamada falha com `HttpError` 500 — exercita estado de erro |
 *
 * O estado vive em memória: recarregar a página volta ao seed. Persistência é
 * responsabilidade do backend, fora do escopo do MVP no front.
 */

import { HttpError } from '@/services/http';
import { seedClients, seedProjects, seedTeams, seedUsers } from '@/services/mock/seed';
import type { Client, ClientInput } from '@/types/client';
import type { Project, ProjectInput } from '@/types/project';
import type { Team, TeamInput } from '@/types/team';
import type { User, UserInput } from '@/types/user';

export type MockScenario = 'padrao' | 'vazio' | 'erro';

/** Latência só fora de teste: a suíte não deve pagar por realismo de rede. */
const LATENCY_MS = import.meta.env.MODE === 'test' ? 0 : 300;

interface MockState {
  projects: Project[];
  clients: Client[];
  teams: Team[];
  users: User[];
}

let state: MockState = freshState();
let idCounter = 0;

function freshState(): MockState {
  return {
    projects: seedProjects.map((project) => ({ ...project })),
    clients: seedClients.map((client) => ({ ...client })),
    teams: seedTeams.map((team) => ({ ...team })),
    users: seedUsers.map((user) => ({ ...user })),
  };
}

/** Volta ao seed. Usado pelos testes; em produção o reload da página já faz isso. */
export function resetMockStore(): void {
  state = freshState();
  idCounter = 0;
}

/**
 * Liga a camada mock. Ausente = ligada: enquanto o backend não existe, este é o
 * estado normal do MVP e um clone novo precisa rodar sem configuração. Só
 * `VITE_USE_MOCK=false` faz o front chamar a API real (F5-1).
 */
export function isMockEnabled(): boolean {
  return import.meta.env.VITE_USE_MOCK !== 'false';
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
  return `${prefix}-mock-${String(idCounter).padStart(3, '0')}`;
}

function nowTimestamp(): string {
  return new Date().toISOString();
}

function notFound(resource: string): HttpError {
  return new HttpError('client', `${resource} não encontrado.`, 404);
}

export function mockListProjects(): Promise<Project[]> {
  return respond(() =>
    isEmptyScenario() ? [] : state.projects.map((project) => ({ ...project }))
  );
}

export function mockGetProject(id: string): Promise<Project> {
  return respond(() => {
    const project = isEmptyScenario() ? undefined : state.projects.find((item) => item.id === id);
    if (!project) {
      throw notFound('Projeto');
    }
    return { ...project };
  });
}

export function mockCreateProject(input: ProjectInput): Promise<Project> {
  return respond(() => {
    const timestamp = nowTimestamp();
    const project: Project = {
      ...input,
      id: nextId('prj'),
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    state.projects = [...state.projects, project];
    return { ...project };
  });
}

export function mockUpdateProject(id: string, input: ProjectInput): Promise<Project> {
  return respond(() => {
    const index = state.projects.findIndex((item) => item.id === id);
    if (index === -1) {
      throw notFound('Projeto');
    }
    const updated: Project = {
      ...state.projects[index],
      ...input,
      id,
      updatedAt: nowTimestamp(),
    };
    state.projects = state.projects.map((item, i) => (i === index ? updated : item));
    return { ...updated };
  });
}

export function mockListClients(): Promise<Client[]> {
  return respond(() => (isEmptyScenario() ? [] : state.clients.map((client) => ({ ...client }))));
}

export function mockCreateClient(input: ClientInput): Promise<Client> {
  return respond(() => {
    const timestamp = nowTimestamp();
    const client: Client = {
      id: nextId('cli'),
      name: input.name,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    state.clients = [...state.clients, client];
    return { ...client };
  });
}

export function mockListTeams(): Promise<Team[]> {
  return respond(() => (isEmptyScenario() ? [] : state.teams.map((team) => ({ ...team }))));
}

export function mockCreateTeam(input: TeamInput): Promise<Team> {
  return respond(() => {
    const team: Team = { id: nextId('team'), name: input.name, createdAt: nowTimestamp() };
    state.teams = [...state.teams, team];
    return { ...team };
  });
}

export function mockListUsers(): Promise<User[]> {
  return respond(() => (isEmptyScenario() ? [] : state.users.map((user) => ({ ...user }))));
}

export function mockCreateUser(input: UserInput): Promise<User> {
  return respond(() => {
    const user: User = { ...input, id: nextId('usr'), createdAt: nowTimestamp() };
    state.users = [...state.users, user];
    return { ...user };
  });
}
