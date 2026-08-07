import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TeamsPage from '@/pages/TeamsPage';
import { HttpError } from '@/services/http';
import { makeProjectSummary } from '@/test/factories';
import type { ProjectStatus } from '@/types/project';
import type { Team } from '@/types/team';

vi.mock('@/services/teams', () => ({ listTeams: vi.fn(), createTeam: vi.fn() }));
vi.mock('@/services/projects', () => ({ listProjects: vi.fn() }));

const { listTeams, createTeam } = await import('@/services/teams');
const { listProjects } = await import('@/services/projects');

const TIMESTAMP = '2026-03-10T12:00:00.000Z';

const teams: Team[] = [
  { id: 'team-01', name: 'Squad Plataforma', createdAt: TIMESTAMP },
  { id: 'team-02', name: 'Squad Dados', createdAt: TIMESTAMP },
];

function makeProject(id: string, teamId: string, status: ProjectStatus) {
  return makeProjectSummary({
    id,
    name: `Projeto ${id}`,
    status,
    team: { id: teamId, name: '' },
  });
}

/** Plataforma: 2 ativos, 1 concluído, 1 cancelado. Dados: nada. */
const projects = [
  makeProject('prj-01', 'team-01', 'EM_ANDAMENTO'),
  makeProject('prj-02', 'team-01', 'PLANEJAMENTO'),
  makeProject('prj-03', 'team-01', 'CONCLUIDO'),
  makeProject('prj-04', 'team-01', 'CANCELADO'),
];

/** Card da equipe pelo nome. */
function cardOf(name: string): HTMLElement {
  return screen.getByRole('heading', { name }).closest('li') as HTMLElement;
}

/** O número exibido acima de um rótulo do card ("total", "ativos", …). */
function metricOf(card: HTMLElement, label: string): string {
  const term = within(card).getByText(label);
  return term.previousElementSibling?.textContent ?? '';
}

async function openForm() {
  await userEvent.click(await screen.findByRole('button', { name: 'Nova equipe' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listTeams).mockResolvedValue(teams);
  vi.mocked(listProjects).mockResolvedValue(projects);
});

describe('TeamsPage', () => {
  it('lista as equipes com a carga de trabalho', async () => {
    render(<TeamsPage />);
    await screen.findByRole('heading', { name: 'Squad Plataforma' });

    const plataforma = cardOf('Squad Plataforma');
    expect(metricOf(plataforma, 'total')).toBe('4');
    // Cancelado não é ativo nem concluído: 2 + 1 é menor que o total, de propósito.
    expect(metricOf(plataforma, 'ativos')).toBe('2');
    expect(metricOf(plataforma, 'concluídos')).toBe('1');

    const dados = cardOf('Squad Dados');
    expect(metricOf(dados, 'total')).toBe('0');
    expect(screen.getByText('2 equipes cadastradas')).toBeInTheDocument();
  });

  it('cadastra uma equipe e a acrescenta à lista', async () => {
    const nova: Team = { id: 'team-03', name: 'Squad Mobile', createdAt: TIMESTAMP };
    vi.mocked(createTeam).mockResolvedValue(nova);
    render(<TeamsPage />);
    await openForm();

    await userEvent.type(screen.getByLabelText(/Nome da equipe/), 'Squad Mobile');
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(createTeam).toHaveBeenCalledWith({ name: 'Squad Mobile' });
    expect(await screen.findByRole('heading', { name: 'Squad Mobile' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Equipe "Squad Mobile" cadastrada.');
  });

  it('recusa nome vazio e nome repetido sem chamar a API', async () => {
    render(<TeamsPage />);
    await openForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(screen.getByText('Informe o nome da equipe.')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText(/Nome da equipe/), 'squad plataforma');
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(screen.getByText('Já existe uma equipe com este nome.')).toBeInTheDocument();

    expect(createTeam).not.toHaveBeenCalled();
  });

  it('mostra a falha da API sem perder o que foi digitado', async () => {
    vi.mocked(createTeam).mockRejectedValue(
      new HttpError('server', 'Erro no servidor. Tente novamente em instantes.', 500)
    );
    render(<TeamsPage />);
    await openForm();

    await userEvent.type(screen.getByLabelText(/Nome da equipe/), 'Squad Mobile');
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Erro no servidor. Tente novamente em instantes.'
    );
    expect(screen.getByLabelText(/Nome da equipe/)).toHaveValue('Squad Mobile');
  });

  it('distingue lista vazia de falha de carga', async () => {
    vi.mocked(listTeams).mockResolvedValue([]);
    render(<TeamsPage />);

    expect(await screen.findByText('Nenhuma equipe cadastrada.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('exibe erro de carga com opção de tentar de novo', async () => {
    vi.mocked(listTeams).mockRejectedValueOnce(
      new HttpError('network', 'Falha de conexão. Verifique sua internet.', null)
    );
    render(<TeamsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Falha de conexão. Verifique sua internet.'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('heading', { name: 'Squad Plataforma' })).toBeInTheDocument();
  });
});
