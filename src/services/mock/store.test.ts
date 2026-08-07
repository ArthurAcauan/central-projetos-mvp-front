/**
 * A fixture serve para demonstrar o front sem a API (ADR-0008). Estes testes
 * garantem o que a demonstração precisa: que ela é o formato do contrato, que
 * cobre os casos visuais que costumam quebrar a tela, e que os cenários `vazio`
 * e `erro` continuam exercitáveis.
 *
 * O que **não** é verificado aqui é a regra dos indicadores: eles vêm gravados
 * da API, e conferir o valor seria testar o backend a partir do front.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
import { projectStatuses, type ProjectInput } from '@/types/project';

function newProjectInput(overrides: Partial<ProjectInput> = {}): ProjectInput {
  return {
    name: 'Projeto de Teste',
    clientId: 'd38b1bc3-6788-4809-be42-4c6f251427af',
    objective: 'Objetivo do projeto de teste.',
    managerId: 'd3cc9562-984a-4174-a20b-1f3af7c2324c',
    teamId: 'b5812071-213f-482f-9be5-87e737afeabe',
    startDate: '2026-04-01',
    deadline: '2026-10-01',
    budget: 50_000,
    budgetSpent: 0,
    hoursWorked: 0,
    status: 'PLANEJAMENTO',
    observations: null,
    ...overrides,
  };
}

beforeEach(() => {
  resetMockStore();
  vi.stubEnv('VITE_MOCK_SCENARIO', 'padrao');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('formato da fixture', () => {
  it('devolve o DTO da API, com relações resolvidas e indicadores', async () => {
    const [project] = await mockListProjects();

    expect(project).toMatchObject({
      client: { id: expect.any(String), name: expect.any(String) },
      manager: { id: expect.any(String), name: expect.any(String) },
      team: { id: expect.any(String), name: expect.any(String) },
      indicadores: {
        projeto_atrasado: expect.any(Boolean),
        em_atencao: expect.any(Boolean),
      },
    });
  });

  // A lista da API não devolve estes campos; a fixture não pode devolver.
  it('a lista não traz objetivo, observação nem timestamps', async () => {
    const [project] = await mockListProjects();

    expect(project).not.toHaveProperty('objective');
    expect(project).not.toHaveProperty('observations');
    expect(project).not.toHaveProperty('created_at');
  });

  it('o detalhe traz os campos que só ele tem', async () => {
    const [summary] = await mockListProjects();
    const detail = await mockGetProject(summary.id);

    expect(detail.objective).toEqual(expect.any(String));
    expect(detail.created_at).toEqual(expect.any(String));
  });
});

describe('cobertura dos casos visuais', () => {
  it('ocupa todos os cinco status', async () => {
    const projects = await mockListProjects();
    const present = new Set(projects.map((project) => project.status));

    for (const status of projectStatuses) {
      expect(present).toContain(status);
    }
  });

  it('tem projeto atrasado, estourado, com consumo elevado e sem orçamento', async () => {
    const projects = await mockListProjects();

    expect(projects.some((p) => p.indicadores.projeto_atrasado)).toBe(true);
    expect(projects.some((p) => p.indicadores.orcamento_excedido)).toBe(true);
    expect(projects.some((p) => p.indicadores.consumo_elevado)).toBe(true);
    // `budget = 0`: percentual indisponível (RN07, armadilha A-001).
    expect(projects.some((p) => p.indicadores.consumo_orcamento_percentual === null)).toBe(true);
  });

  // RN08: projeto encerrado não é atraso, por vencido que esteja.
  it('tem projeto encerrado que não aparece como atrasado nem em atenção', async () => {
    const projects = await mockListProjects();
    const closed = projects.filter((p) => p.status === 'CONCLUIDO' || p.status === 'CANCELADO');

    expect(closed.length).toBeGreaterThan(0);
    for (const project of closed) {
      expect(project.indicadores.projeto_atrasado).toBe(false);
      expect(project.indicadores.em_atencao).toBe(false);
    }
  });

  it('tem clientes, equipes e usuários para os seletores do formulário', async () => {
    expect((await mockListClients()).length).toBeGreaterThan(0);
    expect((await mockListTeams()).length).toBeGreaterThan(0);
    expect((await mockListUsers()).length).toBeGreaterThan(0);
  });
});

describe('filtro da lista', () => {
  it('recorta por status', async () => {
    const filtered = await mockListProjects({ status: 'EM_RISCO' });

    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((project) => project.status === 'EM_RISCO')).toBe(true);
  });

  it('recorta por cliente', async () => {
    const [first] = await mockListProjects();
    const filtered = await mockListProjects({ clientId: first.client.id });

    expect(filtered.every((project) => project.client.id === first.client.id)).toBe(true);
  });
});

describe('escrita', () => {
  it('cadastra resolvendo as relações pelo id', async () => {
    const created = await mockCreateProject(newProjectInput());

    expect(created.id).toMatch(/^prj-fixture-/);
    expect(created.client.name).toBe('Acme Industria');
    expect(created.manager.name).toBe('Ana Souza');
    expect((await mockListProjects()).some((p) => p.id === created.id)).toBe(true);
  });

  // RN03: o estouro passa, e vira indicador — não erro.
  it('aceita orçamento consumido acima do previsto e marca o estouro', async () => {
    const created = await mockCreateProject(newProjectInput({ budget: 100, budgetSpent: 500 }));

    expect(created.indicadores.orcamento_excedido).toBe(true);
    expect(created.indicadores.motivos_de_atencao).toContain('ORCAMENTO_EXCEDIDO');
  });

  // RN07: sem previsto não há proporção.
  it('deixa o percentual nulo quando o orçamento é zero', async () => {
    const created = await mockCreateProject(newProjectInput({ budget: 0, budgetSpent: 0 }));

    expect(created.indicadores.consumo_orcamento_percentual).toBeNull();
  });

  it('atualiza preservando o id e a data de criação', async () => {
    const [first] = await mockListProjects();
    const before = await mockGetProject(first.id);

    const updated = await mockUpdateProject(first.id, newProjectInput({ name: 'Renomeado' }));

    expect(updated.id).toBe(first.id);
    expect(updated.name).toBe('Renomeado');
    expect(updated.created_at).toBe(before.created_at);
  });

  it('recusa atualização de id inexistente com 404', async () => {
    await expect(mockUpdateProject('nao-existe', newProjectInput())).rejects.toSatisfy(
      (error: unknown) => isHttpError(error) && error.status === 404
    );
  });
});

describe('cenários de tela', () => {
  it('vazio devolve listas vazias e 404 na busca por id', async () => {
    vi.stubEnv('VITE_MOCK_SCENARIO', 'vazio');

    expect(await mockListProjects()).toEqual([]);
    expect(await mockListClients()).toEqual([]);
    await expect(mockGetProject('qualquer')).rejects.toSatisfy(
      (error: unknown) => isHttpError(error) && error.status === 404
    );
  });

  it('erro falha com HttpError, do mesmo tipo da API real', async () => {
    vi.stubEnv('VITE_MOCK_SCENARIO', 'erro');

    await expect(mockListProjects()).rejects.toSatisfy(
      (error: unknown) => isHttpError(error) && error.status === 500
    );
  });
});
