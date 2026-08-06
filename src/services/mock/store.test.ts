import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { budgetConsumptionPercent, isLate, isOverBudget } from '@/domain/indicators';
import { isHttpError } from '@/services/http';
import {
  mockCreateProject,
  mockGetProject,
  mockListClients,
  mockListProjects,
  mockListTeams,
  mockListUsers,
  mockUpdateProject,
  resetMockStore,
} from '@/services/mock/store';
import { projectStatuses } from '@/types/project';
import type { ProjectInput } from '@/types/project';

function newProjectInput(): ProjectInput {
  return {
    name: 'Projeto de Teste',
    clientId: 'cli-01',
    objective: 'Objetivo do projeto de teste.',
    managerId: 'usr-01',
    teamId: 'team-01',
    startDate: '2026-04-01',
    deadline: '2026-10-01',
    budget: 50_000,
    budgetSpent: 0,
    hoursWorked: 0,
    status: 'PLANEJAMENTO',
    observations: null,
  };
}

beforeEach(() => {
  resetMockStore();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

/**
 * O seed é ativo de teste (ADR-0001): precisa exercitar as bordas que o
 * dashboard tem de mostrar corretamente, ou os defeitos só aparecem na
 * demonstração.
 */
describe('cobertura do seed', () => {
  it('traz ao menos 15 projetos', async () => {
    expect((await mockListProjects()).length).toBeGreaterThanOrEqual(15);
  });

  it('ocupa os cinco status', async () => {
    const projects = await mockListProjects();
    const usados = new Set(projects.map((project) => project.status));

    for (const status of projectStatuses) {
      expect(usados).toContain(status);
    }
  });

  it('inclui projeto atrasado', async () => {
    const projects = await mockListProjects();

    expect(projects.some((project) => isLate(project))).toBe(true);
  });

  it('inclui projeto com prazo hoje, que não pode contar como atrasado (RN08)', async () => {
    const projects = await mockListProjects();
    const hoje = new Date();
    const prazoHoje = projects.filter(
      (project) =>
        project.deadline ===
        `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(
          hoje.getDate()
        ).padStart(2, '0')}`
    );

    expect(prazoHoje).not.toHaveLength(0);
    expect(prazoHoje.every((project) => !isLate(project))).toBe(true);
  });

  it('inclui projeto com orçamento zero, de consumo indisponível (RN07)', async () => {
    const projects = await mockListProjects();
    const semOrcamento = projects.filter((project) => project.budget === 0);

    expect(semOrcamento).not.toHaveLength(0);
    expect(semOrcamento.every((project) => budgetConsumptionPercent(project) === null)).toBe(true);
  });

  it('inclui projeto com orçamento excedido (RN03)', async () => {
    const projects = await mockListProjects();

    expect(projects.some(isOverBudget)).toBe(true);
  });

  it('mantém a integridade das três FKs de cada projeto', async () => {
    const [projects, clients, teams, users] = await Promise.all([
      mockListProjects(),
      mockListClients(),
      mockListTeams(),
      mockListUsers(),
    ]);
    const clientIds = new Set(clients.map((client) => client.id));
    const teamIds = new Set(teams.map((team) => team.id));
    const userIds = new Set(users.map((user) => user.id));

    for (const project of projects) {
      expect(clientIds).toContain(project.clientId);
      expect(teamIds).toContain(project.teamId);
      expect(userIds).toContain(project.managerId);
    }
  });
});

describe('escrita em memória', () => {
  it('cria projeto com id e timestamps próprios e o inclui na listagem', async () => {
    const antes = (await mockListProjects()).length;

    const criado = await mockCreateProject(newProjectInput());
    const depois = await mockListProjects();

    expect(criado.id).toBeTruthy();
    expect(criado.createdAt).toBeTruthy();
    expect(depois).toHaveLength(antes + 1);
    expect(depois.some((project) => project.id === criado.id)).toBe(true);
  });

  it('atualiza mantendo o id e devolve o projeto alterado', async () => {
    const atualizado = await mockUpdateProject('prj-01', {
      ...newProjectInput(),
      name: 'Nome Atualizado',
    });

    expect(atualizado.id).toBe('prj-01');
    expect(atualizado.name).toBe('Nome Atualizado');
    expect((await mockGetProject('prj-01')).name).toBe('Nome Atualizado');
  });

  it('resetMockStore devolve o estado ao seed', async () => {
    await mockCreateProject(newProjectInput());
    const comExtra = (await mockListProjects()).length;

    resetMockStore();

    expect((await mockListProjects()).length).toBe(comExtra - 1);
  });

  it('busca por id inexistente falha como 404 tratado', async () => {
    const error = await mockGetProject('prj-inexistente').catch((e: unknown) => e);

    expect(isHttpError(error)).toBe(true);
    expect(error).toMatchObject({ status: 404 });
  });
});

describe('cenários do mock (ADR-0001: simular vazio e erro)', () => {
  it('cenário vazio devolve listas vazias', async () => {
    vi.stubEnv('VITE_MOCK_SCENARIO', 'vazio');

    expect(await mockListProjects()).toEqual([]);
    expect(await mockListClients()).toEqual([]);
    expect(await mockListTeams()).toEqual([]);
    expect(await mockListUsers()).toEqual([]);
  });

  it('cenário vazio faz a busca por id responder 404', async () => {
    vi.stubEnv('VITE_MOCK_SCENARIO', 'vazio');

    await expect(mockGetProject('prj-01')).rejects.toMatchObject({ status: 404 });
  });

  it('cenário erro falha com HttpError 500, igual à API real', async () => {
    vi.stubEnv('VITE_MOCK_SCENARIO', 'erro');

    const error = await mockListProjects().catch((e: unknown) => e);

    expect(isHttpError(error)).toBe(true);
    expect(error).toMatchObject({ kind: 'server', status: 500 });
  });

  it('valor desconhecido cai no cenário padrão', async () => {
    vi.stubEnv('VITE_MOCK_SCENARIO', 'qualquer-coisa');

    expect((await mockListProjects()).length).toBeGreaterThan(0);
  });
});
