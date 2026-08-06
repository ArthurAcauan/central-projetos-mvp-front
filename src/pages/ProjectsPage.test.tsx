import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatCalendarDate } from '@/domain/indicators';
import ProjectsPage from '@/pages/ProjectsPage';
import { HttpError } from '@/services/http';
import type { Client } from '@/types/client';
import type { Project } from '@/types/project';
import type { User } from '@/types/user';

vi.mock('@/services/projects', () => ({ listProjects: vi.fn() }));
vi.mock('@/services/clients', () => ({ listClients: vi.fn() }));
vi.mock('@/services/users', () => ({ listUsers: vi.fn() }));

const { listProjects } = await import('@/services/projects');
const { listClients } = await import('@/services/clients');
const { listUsers } = await import('@/services/users');

const TIMESTAMP = '2026-01-05T09:00:00.000Z';

function daysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatCalendarDate(date);
}

const clients: Client[] = [
  { id: 'cli-01', name: 'Alfa Logística', createdAt: TIMESTAMP, updatedAt: TIMESTAMP },
  { id: 'cli-02', name: 'Beta Saúde', createdAt: TIMESTAMP, updatedAt: TIMESTAMP },
];

const users: User[] = [
  {
    id: 'usr-01',
    name: 'Camila Ferreira',
    email: 'camila@exemplo.com.br',
    role: 'COORDENADOR',
    createdAt: TIMESTAMP,
  },
  {
    id: 'usr-02',
    name: 'Bruno Tavares',
    email: 'bruno@exemplo.com.br',
    role: 'GESTOR_PROJETO',
    createdAt: TIMESTAMP,
  },
];

function makeProject(overrides: Partial<Project> & Pick<Project, 'id' | 'name'>): Project {
  return {
    clientId: 'cli-01',
    objective: 'Objetivo',
    managerId: 'usr-01',
    teamId: 'team-01',
    startDate: daysFromToday(-60),
    deadline: daysFromToday(30),
    budget: 100_000,
    budgetSpent: 25_000,
    hoursWorked: 100,
    status: 'EM_ANDAMENTO',
    observations: null,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

/** Em dia, dentro do orçamento. */
const healthy = makeProject({ id: 'prj-01', name: 'Portal do Cliente' });

/** Prazo vencido com o projeto ativo (RN08). */
const lateProject = makeProject({
  id: 'prj-02',
  name: 'Rastreamento de Frota',
  deadline: daysFromToday(-10),
});

/** Prazo hoje: não está atrasado (RN08, armadilha A-002). */
const dueToday = makeProject({
  id: 'prj-03',
  name: 'Agendamento Online',
  deadline: daysFromToday(0),
});

/** Estouro de orçamento (RN03), cliente e gestor diferentes. */
const overBudget = makeProject({
  id: 'prj-04',
  name: 'Prontuário Eletrônico',
  clientId: 'cli-02',
  managerId: 'usr-02',
  status: 'EM_RISCO',
  budget: 200_000,
  budgetSpent: 240_000,
});

/** Sem orçamento previsto: consumo indisponível (RN07, armadilha A-001). */
const noBudget = makeProject({
  id: 'prj-05',
  name: 'Painel de Indicadores',
  clientId: 'cli-02',
  status: 'PLANEJAMENTO',
  budget: 0,
  budgetSpent: 0,
});

const allProjects = [healthy, lateProject, dueToday, overBudget, noBudget];

function mockData(projects: Project[]) {
  vi.mocked(listProjects).mockResolvedValue(projects);
  vi.mocked(listClients).mockResolvedValue(clients);
  vi.mocked(listUsers).mockResolvedValue(users);
}

/** Linha da tabela pelo nome do projeto. */
function rowOf(name: string): HTMLElement {
  return screen.getByRole('cell', { name: new RegExp(name) }).closest('tr') as HTMLElement;
}

/** Quantas linhas de dado a tabela mostra agora (sem o cabeçalho). */
function visibleRowCount(): number {
  return screen.getAllByRole('row').length - 1;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProjectsPage (RF04)', () => {
  it('mostra o estado de carregando antes dos dados chegarem', async () => {
    mockData(allProjects);
    render(<ProjectsPage />);

    expect(screen.getByRole('status')).toHaveTextContent('Carregando projetos...');
    expect(await screen.findByText('Portal do Cliente')).toBeInTheDocument();
  });

  it('lista os projetos com cliente e gestor por nome', async () => {
    mockData(allProjects);
    render(<ProjectsPage />);

    expect(await screen.findByText('Portal do Cliente')).toBeInTheDocument();
    expect(within(rowOf('Portal do Cliente')).getByText('Alfa Logística')).toBeInTheDocument();
    expect(within(rowOf('Portal do Cliente')).getByText('Camila Ferreira')).toBeInTheDocument();
    expect(screen.getByText('5 de 5 projetos')).toBeInTheDocument();
  });

  it('destaca atraso e estouro de orçamento, e não marca prazo igual a hoje', async () => {
    mockData(allProjects);
    render(<ProjectsPage />);
    await screen.findByText('Portal do Cliente');

    expect(within(rowOf('Rastreamento de Frota')).getByText('Atrasado')).toBeInTheDocument();
    expect(within(rowOf('Agendamento Online')).queryByText('Atrasado')).not.toBeInTheDocument();
    expect(within(rowOf('Prontuário Eletrônico')).getByText('Orç. excedido')).toBeInTheDocument();
    expect(within(rowOf('Portal do Cliente')).queryByText('Orç. excedido')).not.toBeInTheDocument();
  });

  it('mostra o consumo como "—" quando não há orçamento previsto (RN07)', async () => {
    mockData(allProjects);
    render(<ProjectsPage />);
    await screen.findByText('Portal do Cliente');

    const cells = within(rowOf('Painel de Indicadores')).getAllByRole('cell');
    expect(cells[cells.length - 1]).toHaveTextContent('—');
    expect(cells[cells.length - 1]).not.toHaveTextContent('NaN');
    expect(within(rowOf('Portal do Cliente')).getByText('25,0%')).toBeInTheDocument();
    expect(within(rowOf('Prontuário Eletrônico')).getByText('120,0%')).toBeInTheDocument();
  });

  it('filtra por status', async () => {
    const user = userEvent.setup();
    mockData(allProjects);
    render(<ProjectsPage />);
    await screen.findByText('Portal do Cliente');

    await user.selectOptions(screen.getByLabelText('Filtrar por status'), 'EM_RISCO');

    expect(visibleRowCount()).toBe(1);
    expect(screen.getByText('Prontuário Eletrônico')).toBeInTheDocument();
    expect(screen.getByText('1 de 5 projetos')).toBeInTheDocument();
  });

  it('filtra por cliente', async () => {
    const user = userEvent.setup();
    mockData(allProjects);
    render(<ProjectsPage />);
    await screen.findByText('Portal do Cliente');

    await user.selectOptions(screen.getByLabelText('Filtrar por cliente'), 'cli-02');

    expect(screen.getByText('2 de 5 projetos')).toBeInTheDocument();
    expect(screen.queryByText('Portal do Cliente')).not.toBeInTheDocument();
  });

  it('busca por nome do gestor', async () => {
    const user = userEvent.setup();
    mockData(allProjects);
    render(<ProjectsPage />);
    await screen.findByText('Portal do Cliente');

    await user.type(screen.getByLabelText('Buscar projeto'), 'bruno');

    expect(screen.getByText('1 de 5 projetos')).toBeInTheDocument();
    expect(screen.getByText('Prontuário Eletrônico')).toBeInTheDocument();
  });

  it('oferece limpar filtros quando o recorte não devolve nada', async () => {
    const user = userEvent.setup();
    mockData(allProjects);
    render(<ProjectsPage />);
    await screen.findByText('Portal do Cliente');

    await user.type(screen.getByLabelText('Buscar projeto'), 'projeto inexistente');
    expect(
      screen.getByText(/Nenhum projeto encontrado com os filtros aplicados/)
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(screen.getByText('5 de 5 projetos')).toBeInTheDocument();
  });

  it('distingue lista vazia de recorte vazio', async () => {
    mockData([]);
    render(<ProjectsPage />);

    expect(await screen.findByText('Nenhum projeto cadastrado.')).toBeInTheDocument();
    expect(screen.getByText('0 de 0 projetos')).toBeInTheDocument();
  });

  it('exibe a falha da API e permite tentar de novo', async () => {
    const user = userEvent.setup();
    vi.mocked(listProjects).mockRejectedValue(
      new HttpError('server', 'Erro no servidor. Tente novamente em instantes.', 500)
    );
    vi.mocked(listClients).mockResolvedValue(clients);
    vi.mocked(listUsers).mockResolvedValue(users);
    render(<ProjectsPage />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Erro no servidor. Tente novamente em instantes.');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    mockData(allProjects);
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('Portal do Cliente')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
