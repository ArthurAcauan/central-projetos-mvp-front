/**
 * O que estes testes protegem: o contrato da API não vaza do serviço (ADR-0002)
 * e o payload do `PUT` é montado do jeito estrito que o backend exige.
 *
 * As respostas usadas aqui têm o mesmo formato das capturadas em
 * `context/CONTRATO_API.md` — relações resolvidas e bloco `indicadores`.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProject, getProject, listProjects, updateProject } from '@/services/projects';
import type { ProjectInput } from '@/types/project';

const fetchMock = vi.fn<typeof fetch>();

function responseOf(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

/** Resposta crua da API: `snake_case`, relações resolvidas, indicadores prontos. */
function projectDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prj-01',
    name: 'Portal do Cliente',
    status: 'EM_ANDAMENTO',
    start_date: '2026-03-01',
    deadline: '2026-09-30',
    budget: 480000,
    budget_spent: 214500,
    hours_worked: 1240,
    client: { id: 'cli-01', name: 'Acme Industria' },
    manager: { id: 'usr-03', name: 'Ana Souza' },
    team: { id: 'team-01', name: 'Squad Alpha' },
    indicadores: {
      consumo_orcamento_percentual: 44.69,
      projeto_atrasado: false,
      orcamento_excedido: false,
      consumo_elevado: false,
      em_atencao: false,
      motivos_de_atencao: [],
    },
    objective: 'Centralizar o atendimento.',
    observations: null,
    created_at: '2026-01-05T09:00:00.000Z',
    updated_at: '2026-02-10T14:22:00.000Z',
    ...overrides,
  };
}

function projectInput(overrides: Partial<ProjectInput> = {}): ProjectInput {
  return {
    name: 'Portal do Cliente',
    clientId: 'cli-01',
    objective: 'Centralizar o atendimento.',
    managerId: 'usr-03',
    teamId: 'team-01',
    startDate: '2026-03-01',
    deadline: '2026-09-30',
    budget: 480000,
    budgetSpent: 214500,
    hoursWorked: 1240,
    status: 'EM_ANDAMENTO',
    observations: null,
    ...overrides,
  };
}

/** URL e corpo da última chamada, para verificar query e payload. */
function lastCall() {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return { url, body: init.body === undefined ? undefined : JSON.parse(String(init.body)) };
}

beforeEach(() => {
  vi.stubEnv('VITE_API_URL', 'http://localhost:3333');
  vi.stubEnv('VITE_USE_MOCK', 'false');
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('leitura', () => {
  it('traduz a resposta para o domínio em camelCase', async () => {
    fetchMock.mockResolvedValue(responseOf(projectDto()));

    const project = await getProject('prj-01');

    expect(project).toEqual({
      id: 'prj-01',
      name: 'Portal do Cliente',
      status: 'EM_ANDAMENTO',
      startDate: '2026-03-01',
      deadline: '2026-09-30',
      budget: 480000,
      budgetSpent: 214500,
      hoursWorked: 1240,
      client: { id: 'cli-01', name: 'Acme Industria' },
      manager: { id: 'usr-03', name: 'Ana Souza' },
      team: { id: 'team-01', name: 'Squad Alpha' },
      indicators: {
        consumptionPercent: 44.69,
        isLate: false,
        isOverBudget: false,
        hasHighConsumption: false,
        needsAttention: false,
        attentionReasons: [],
      },
      objective: 'Centralizar o atendimento.',
      observations: null,
      createdAt: '2026-01-05T09:00:00.000Z',
      updatedAt: '2026-02-10T14:22:00.000Z',
    });
  });

  // RN07: `null` é "não calculável" e precisa atravessar como `null`, nunca 0.
  it('preserva o percentual nulo de um projeto sem orçamento previsto', async () => {
    fetchMock.mockResolvedValue(
      responseOf(
        projectDto({
          budget: 0,
          indicadores: {
            ...projectDto().indicadores,
            consumo_orcamento_percentual: null,
            orcamento_excedido: true,
            em_atencao: true,
            motivos_de_atencao: ['ORCAMENTO_EXCEDIDO'],
          },
        })
      )
    );

    const project = await getProject('prj-01');

    expect(project.indicators.consumptionPercent).toBeNull();
    expect(project.indicators.isOverBudget).toBe(true);
    expect(project.indicators.attentionReasons).toEqual(['ORCAMENTO_EXCEDIDO']);
  });

  it('mantém a data de calendário sem passar por Date (armadilha A-002)', async () => {
    fetchMock.mockResolvedValue(responseOf(projectDto({ start_date: '2026-03-01T00:00:00.000Z' })));

    expect((await getProject('prj-01')).startDate).toBe('2026-03-01');
  });

  it('normaliza NUMERIC devolvido como string', async () => {
    fetchMock.mockResolvedValue(responseOf(projectDto({ budget: '480000.00' })));

    expect((await getProject('prj-01')).budget).toBe(480000);
  });

  it('lista sem filtro não manda query — chave desconhecida ou vazia é 400', async () => {
    fetchMock.mockResolvedValue(responseOf([projectDto()]));

    await listProjects();

    expect(lastCall().url).toBe('http://localhost:3333/projects');
  });

  it('traduz o filtro de domínio para a query da API', async () => {
    fetchMock.mockResolvedValue(responseOf([]));

    await listProjects({ status: 'EM_RISCO', clientId: 'cli-02' });

    expect(lastCall().url).toBe('http://localhost:3333/projects?status=EM_RISCO&client_id=cli-02');
  });
});

describe('escrita', () => {
  it('envia o payload em snake_case, sem id nem relações resolvidas', async () => {
    fetchMock.mockResolvedValue(responseOf(projectDto(), 201));

    await createProject(projectInput());

    expect(lastCall().body).toEqual({
      name: 'Portal do Cliente',
      client_id: 'cli-01',
      objective: 'Centralizar o atendimento.',
      manager_id: 'usr-03',
      team_id: 'team-01',
      start_date: '2026-03-01',
      deadline: '2026-09-30',
      budget: 480000,
      budget_spent: 214500,
      hours_worked: 1240,
      status: 'EM_ANDAMENTO',
      observations: null,
    });
  });

  // O corpo é estrito: chave a mais responde 400. É a armadilha 7 do contrato.
  it('não deixa vazar campo que o payload não aceita', async () => {
    fetchMock.mockResolvedValue(responseOf(projectDto()));

    await updateProject('prj-01', projectInput());

    const { url, body } = lastCall();
    expect(url).toBe('http://localhost:3333/projects/prj-01');
    for (const forbidden of [
      'id',
      'client',
      'manager',
      'team',
      'indicadores',
      'created_at',
      'updated_at',
    ]) {
      expect(body).not.toHaveProperty(forbidden);
    }
  });

  // RN03: o estouro é registrado, não bloqueado — nem aqui nem na API.
  it('envia orçamento consumido acima do previsto sem interferir', async () => {
    fetchMock.mockResolvedValue(responseOf(projectDto(), 201));

    await createProject(projectInput({ budget: 100, budgetSpent: 500 }));

    expect(lastCall().body).toMatchObject({ budget: 100, budget_spent: 500 });
  });
});
