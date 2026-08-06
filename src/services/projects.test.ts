import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProject, getProject, listProjects, updateProject } from '@/services/projects';
import type { ProjectInput } from '@/types/project';

/**
 * O que estes testes protegem: o contrato da API não vaza do serviço (ADR-0002).
 * Se o backend confirmar outro casing em F5-1, é aqui que a mudança aparece —
 * nenhuma tela precisa ser tocada.
 */

const fetchMock = vi.fn<typeof fetch>();

function responseOf(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  } as unknown as Response;
}

/** Resposta crua da API, como a modelagem descreve: `snake_case`. */
function projectDto(overrides: Record<string, unknown> = {}) {
  return {
    id: 'prj-01',
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
    created_at: '2026-01-05T09:00:00.000Z',
    updated_at: '2026-02-10T14:22:00.000Z',
    ...overrides,
  };
}

function projectInput(): ProjectInput {
  return {
    name: 'Novo Projeto',
    clientId: 'cli-02',
    objective: 'Objetivo do novo projeto.',
    managerId: 'usr-01',
    teamId: 'team-02',
    startDate: '2026-04-01',
    deadline: '2026-10-01',
    budget: 100_000,
    budgetSpent: 0,
    hoursWorked: 0,
    status: 'PLANEJAMENTO',
    observations: null,
  };
}

function requestBodyOf(callIndex = 0): Record<string, unknown> {
  const init = fetchMock.mock.calls[callIndex][1] as RequestInit;
  return JSON.parse(init.body as string) as Record<string, unknown>;
}

beforeEach(() => {
  // API real: é o caminho em que o mapeamento importa.
  vi.stubEnv('VITE_USE_MOCK', 'false');
  vi.stubEnv('VITE_API_URL', 'http://localhost:3000');
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('mapeamento da API para o domínio (ADR-0002)', () => {
  it('converte snake_case em camelCase na listagem', async () => {
    fetchMock.mockResolvedValue(responseOf([projectDto()]));

    const [project] = await listProjects();

    expect(project).toEqual({
      id: 'prj-01',
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
      createdAt: '2026-01-05T09:00:00.000Z',
      updatedAt: '2026-02-10T14:22:00.000Z',
    });
    expect(project).not.toHaveProperty('budget_spent');
  });

  it('aceita NUMERIC serializado como string, que é o padrão do Prisma', async () => {
    fetchMock.mockResolvedValue(
      responseOf([
        projectDto({ budget: '480000.00', budget_spent: '214500.50', hours_worked: '1240' }),
      ])
    );

    const [project] = await listProjects();

    expect(project.budget).toBe(480000);
    expect(project.budgetSpent).toBe(214500.5);
    expect(project.hoursWorked).toBe(1240);
  });

  it('reduz data serializada como timestamp ao formato de calendário', async () => {
    fetchMock.mockResolvedValue(
      responseOf([
        projectDto({
          start_date: '2026-03-01T00:00:00.000Z',
          deadline: '2026-09-30T00:00:00.000Z',
        }),
      ])
    );

    const [project] = await listProjects();

    expect(project.startDate).toBe('2026-03-01');
    expect(project.deadline).toBe('2026-09-30');
  });

  it('busca por id no caminho do recurso', async () => {
    fetchMock.mockResolvedValue(responseOf(projectDto()));

    const project = await getProject('prj-01');

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/projects/prj-01');
    expect(project.clientId).toBe('cli-01');
  });
});

describe('mapeamento do domínio para a API', () => {
  it('envia o corpo em snake_case, sem id nem timestamps', async () => {
    fetchMock.mockResolvedValue(responseOf(projectDto(), 201));

    await createProject(projectInput());

    const body = requestBodyOf();
    expect(body).toEqual({
      name: 'Novo Projeto',
      client_id: 'cli-02',
      objective: 'Objetivo do novo projeto.',
      manager_id: 'usr-01',
      team_id: 'team-02',
      start_date: '2026-04-01',
      deadline: '2026-10-01',
      budget: 100_000,
      budget_spent: 0,
      hours_worked: 0,
      status: 'PLANEJAMENTO',
      observations: null,
    });
  });

  it('atualiza com PUT no caminho do recurso', async () => {
    fetchMock.mockResolvedValue(responseOf(projectDto()));

    await updateProject('prj-01', projectInput());

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/projects/prj-01');
    expect((fetchMock.mock.calls[0][1] as RequestInit).method).toBe('PUT');
  });
});

describe('camada mock ligada (ADR-0001)', () => {
  it('não chama a API e devolve o seed', async () => {
    vi.stubEnv('VITE_USE_MOCK', 'true');

    const projects = await listProjects();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(projects.length).toBeGreaterThan(0);
  });

  it('fica ligada por padrão, sem nenhuma variável definida', async () => {
    vi.stubEnv('VITE_USE_MOCK', '');

    await listProjects();

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
