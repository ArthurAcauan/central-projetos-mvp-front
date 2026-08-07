import { fireEvent, render as rtlRender, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProjectFormPage from '@/pages/ProjectFormPage';
import { HttpError } from '@/services/http';
import { makeProject } from '@/test/factories';
import type { Client } from '@/types/client';
import type { Project, ProjectInput } from '@/types/project';
import type { Team } from '@/types/team';
import type { User } from '@/types/user';

vi.mock('@/services/projects', () => ({
  createProject: vi.fn(),
  getProject: vi.fn(),
  updateProject: vi.fn(),
}));
vi.mock('@/services/clients', () => ({ listClients: vi.fn() }));
vi.mock('@/services/users', () => ({ listUsers: vi.fn() }));
vi.mock('@/services/teams', () => ({ listTeams: vi.fn() }));

const { createProject, getProject, updateProject } = await import('@/services/projects');
const { listClients } = await import('@/services/clients');
const { listUsers } = await import('@/services/users');
const { listTeams } = await import('@/services/teams');

const TIMESTAMP = '2026-01-05T09:00:00.000Z';

const clients: Client[] = [
  { id: 'cli-01', name: 'Alfa Logística', createdAt: TIMESTAMP, updatedAt: TIMESTAMP },
  { id: 'cli-02', name: 'Beta Saúde', createdAt: TIMESTAMP, updatedAt: TIMESTAMP },
];

const users: User[] = [
  {
    id: 'usr-01',
    name: 'Bruno Tavares',
    email: 'bruno@exemplo.com.br',
    role: 'GESTOR_PROJETO',
    createdAt: TIMESTAMP,
  },
];

const teams: Team[] = [{ id: 'team-01', name: 'Squad Plataforma', createdAt: TIMESTAMP }];

/** Preenchimento válido de referência; cada teste altera só o que quer exercitar. */
const VALID_INPUT: ProjectInput = {
  name: 'Portal do Cliente',
  clientId: 'cli-01',
  objective: 'Centralizar o atendimento em um canal único.',
  managerId: 'usr-01',
  teamId: 'team-01',
  startDate: '2026-02-01',
  deadline: '2026-08-31',
  budget: 400_000,
  budgetSpent: 100_000,
  hoursWorked: 1_240,
  status: 'EM_ANDAMENTO',
  observations: null,
};

/**
 * Projeto como a API devolve: relações resolvidas e indicadores prontos. O
 * formulário reconstrói o payload a partir daí, que é onde o contrato pega —
 * o objeto do `GET` não é aceito de volta pelo `PUT`.
 */
function projectFrom(input: ProjectInput, overrides: Partial<Project>): Project {
  return makeProject({
    name: input.name,
    status: input.status,
    startDate: input.startDate,
    deadline: input.deadline,
    budget: input.budget,
    budgetSpent: input.budgetSpent,
    hoursWorked: input.hoursWorked,
    client: { id: input.clientId, name: 'Alfa Logística' },
    manager: { id: input.managerId, name: 'Bruno Tavares' },
    team: { id: input.teamId, name: 'Squad Plataforma' },
    objective: input.objective,
    observations: input.observations,
    ...overrides,
  });
}

const created = projectFrom(VALID_INPUT, { id: 'prj-99' });

/** Projeto já cadastrado, usado nos testes de edição. */
const existing = projectFrom(VALID_INPUT, {
  id: 'prj-07',
  name: 'Rastreamento de Frota',
  observations: 'Contrato renovado em janeiro.',
});

/** Rota de destino após salvar, só para provar para onde a tela navegou. */
function DetailStub() {
  const { id } = useParams();
  return <h1>Detalhes de {id}</h1>;
}

function render(path = '/projects/new') {
  return rtlRender(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<ProjectFormPage />} path="/projects/new" />
        <Route element={<ProjectFormPage />} path="/projects/:id/edit" />
        <Route element={<DetailStub />} path="/projects/:id" />
        <Route element={<h1>Lista de projetos</h1>} path="/projects" />
      </Routes>
    </MemoryRouter>
  );
}

/** Renderiza e espera a carga de clientes, gestores e equipes terminar. */
async function renderReady(path?: string) {
  render(path);
  await screen.findByLabelText(/Nome do projeto/);
}

/**
 * `fireEvent.change` em vez de `userEvent.type`: em `type="date"` o jsdom
 * higieniza cada valor intermediário para `""` enquanto se digita, e o campo
 * nunca chegaria à data completa.
 */
function setField(label: RegExp, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

/** Preenche o formulário inteiro com dados válidos, aplicando as substituições. */
function fillValidForm(overrides: Partial<Record<string, string>> = {}) {
  const fields: [RegExp, string][] = [
    [/Nome do projeto/, overrides.name ?? VALID_INPUT.name],
    [/Objetivo/, overrides.objective ?? VALID_INPUT.objective],
    [/Observações/, overrides.observations ?? ''],
    [/Cliente/, overrides.clientId ?? VALID_INPUT.clientId],
    [/Gestor responsável/, overrides.managerId ?? VALID_INPUT.managerId],
    [/Equipe/, overrides.teamId ?? VALID_INPUT.teamId],
    [/Data de início/, overrides.startDate ?? VALID_INPUT.startDate],
    [/Prazo previsto/, overrides.deadline ?? VALID_INPUT.deadline],
    [/Status/, overrides.status ?? VALID_INPUT.status],
    [/Orçamento previsto/, overrides.budget ?? String(VALID_INPUT.budget)],
    [/Orçamento consumido/, overrides.budgetSpent ?? String(VALID_INPUT.budgetSpent)],
    [/Horas realizadas/, overrides.hoursWorked ?? String(VALID_INPUT.hoursWorked)],
  ];
  for (const [label, value] of fields) {
    setField(label, value);
  }
}

function submitCreate() {
  return userEvent.click(screen.getByRole('button', { name: 'Cadastrar projeto' }));
}

function submitUpdate() {
  return userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listClients).mockResolvedValue(clients);
  vi.mocked(listUsers).mockResolvedValue(users);
  vi.mocked(listTeams).mockResolvedValue(teams);
  vi.mocked(getProject).mockResolvedValue(existing);
  vi.mocked(createProject).mockResolvedValue(created);
  vi.mocked(updateProject).mockResolvedValue({ ...existing, name: 'Rastreamento de Frota v2' });
});

describe('cadastro de projeto (RF03)', () => {
  it('envia o projeto no formato de domínio e vai para os detalhes', async () => {
    await renderReady();
    fillValidForm();
    await submitCreate();

    expect(createProject).toHaveBeenCalledTimes(1);
    // camelCase, números convertidos, observação em branco como ausência (ADR-0002).
    expect(createProject).toHaveBeenCalledWith(VALID_INPUT);
    expect(await screen.findByRole('heading', { name: 'Detalhes de prj-99' })).toBeInTheDocument();
  });

  it('não busca projeto nenhum quando a rota não tem id', async () => {
    await renderReady();

    expect(getProject).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Novo projeto' })).toBeInTheDocument();
  });

  it('guarda a observação preenchida em vez de descartá-la', async () => {
    await renderReady();
    fillValidForm({ observations: '  Contrato renovado em janeiro.  ' });
    await submitCreate();

    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({ observations: 'Contrato renovado em janeiro.' })
    );
  });

  it('não nasce com a tela vermelha: sem tentativa de salvar, sem erro', async () => {
    await renderReady();

    expect(screen.queryByText('Informe o nome do projeto.')).not.toBeInTheDocument();
  });

  it('recusa o formulário vazio e aponta cada obrigatório (RN06)', async () => {
    await renderReady();
    await submitCreate();

    expect(screen.getByText('Informe o nome do projeto.')).toBeInTheDocument();
    expect(screen.getByText('Selecione o cliente.')).toBeInTheDocument();
    expect(screen.getByText('Selecione o gestor responsável.')).toBeInTheDocument();
    expect(screen.getByText('Selecione a equipe responsável.')).toBeInTheDocument();
    expect(screen.getByText('Informe o objetivo do projeto.')).toBeInTheDocument();
    expect(screen.getByText('Informe a data de início.')).toBeInTheDocument();
    expect(screen.getByText('Informe o prazo previsto.')).toBeInTheDocument();
    expect(screen.getByText('Informe o orçamento previsto.')).toBeInTheDocument();
    expect(createProject).not.toHaveBeenCalled();
  });

  it('recusa prazo anterior à data de início (RN05)', async () => {
    await renderReady();
    fillValidForm({ startDate: '2026-08-31', deadline: '2026-02-01' });
    await submitCreate();

    expect(
      screen.getByText('O prazo previsto não pode ser anterior à data de início.')
    ).toBeInTheDocument();
    expect(createProject).not.toHaveBeenCalled();
  });

  it('aceita prazo igual à data de início (RN05)', async () => {
    await renderReady();
    fillValidForm({ startDate: '2026-02-01', deadline: '2026-02-01' });
    await submitCreate();

    expect(createProject).toHaveBeenCalledTimes(1);
  });

  it('recusa valor negativo em horas realizadas (RN04)', async () => {
    await renderReady();
    fillValidForm({ hoursWorked: '-5' });
    await submitCreate();

    expect(screen.getByText('O valor não pode ser negativo.')).toBeInTheDocument();
    expect(createProject).not.toHaveBeenCalled();
  });

  it('aceita orçamento zero (RN01)', async () => {
    await renderReady();
    fillValidForm({ budget: '0', budgetSpent: '0' });
    await submitCreate();

    expect(createProject).toHaveBeenCalledWith(expect.objectContaining({ budget: 0 }));
  });

  // A regressão mais provável desta tela: bloquear o estouro como se fosse erro.
  it('avisa sobre orçamento consumido acima do previsto e mesmo assim salva (RN03)', async () => {
    await renderReady();
    fillValidForm({ budget: '100000', budgetSpent: '150000' });

    // O aviso aparece antes de tentar salvar, enquanto o valor é digitado.
    expect(screen.getByText(/orçamento consumido está acima do previsto/i)).toBeInTheDocument();

    await submitCreate();

    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({ budget: 100_000, budgetSpent: 150_000 })
    );
    expect(await screen.findByRole('heading', { name: 'Detalhes de prj-99' })).toBeInTheDocument();
  });

  it('mantém o preenchimento quando a API recusa o cadastro', async () => {
    vi.mocked(createProject).mockRejectedValue(
      new HttpError('server', 'Erro no servidor. Tente novamente em instantes.', 500)
    );
    await renderReady();
    fillValidForm();
    await submitCreate();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Erro no servidor. Tente novamente em instantes.'
    );
    expect(screen.getByLabelText(/Nome do projeto/)).toHaveValue('Portal do Cliente');
    expect(screen.getByRole('button', { name: 'Cadastrar projeto' })).toBeEnabled();
  });

  it('exibe erro e permite recarregar quando as opções não carregam', async () => {
    vi.mocked(listClients).mockRejectedValueOnce(
      new HttpError('network', 'Falha de conexão. Verifique sua internet.', null)
    );
    render();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Falha de conexão. Verifique sua internet.'
    );
    expect(screen.queryByLabelText(/Nome do projeto/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByLabelText(/Nome do projeto/)).toBeInTheDocument();
  });

  it('volta para a lista ao cancelar, sem cadastrar nada', async () => {
    await renderReady();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByRole('heading', { name: 'Lista de projetos' })).toBeInTheDocument();
    expect(createProject).not.toHaveBeenCalled();
  });
});

describe('atualização de projeto (RF06)', () => {
  it('carrega o projeto e preenche todos os campos', async () => {
    await renderReady('/projects/prj-07/edit');

    expect(getProject).toHaveBeenCalledWith('prj-07', expect.anything());
    expect(screen.getByRole('heading', { name: 'Editar projeto' })).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome do projeto/)).toHaveValue('Rastreamento de Frota');
    expect(screen.getByLabelText(/Cliente/)).toHaveValue('cli-01');
    expect(screen.getByLabelText(/Gestor responsável/)).toHaveValue('usr-01');
    expect(screen.getByLabelText(/Equipe/)).toHaveValue('team-01');
    expect(screen.getByLabelText(/Data de início/)).toHaveValue('2026-02-01');
    expect(screen.getByLabelText(/Prazo previsto/)).toHaveValue('2026-08-31');
    expect(screen.getByLabelText(/Status/)).toHaveValue('EM_ANDAMENTO');
    expect(screen.getByLabelText(/Orçamento previsto/)).toHaveValue(400_000);
    expect(screen.getByLabelText(/Orçamento consumido/)).toHaveValue(100_000);
    expect(screen.getByLabelText(/Horas realizadas/)).toHaveValue(1_240);
    expect(screen.getByLabelText(/Observações/)).toHaveValue('Contrato renovado em janeiro.');
  });

  it('envia só o payload, sem id nem timestamps, e volta aos detalhes', async () => {
    await renderReady('/projects/prj-07/edit');
    setField(/Nome do projeto/, 'Rastreamento de Frota v2');
    setField(/Cliente/, 'cli-02');
    await submitUpdate();

    expect(updateProject).toHaveBeenCalledWith('prj-07', {
      ...VALID_INPUT,
      name: 'Rastreamento de Frota v2',
      clientId: 'cli-02',
      observations: 'Contrato renovado em janeiro.',
    });
    expect(createProject).not.toHaveBeenCalled();
    expect(await screen.findByRole('heading', { name: 'Detalhes de prj-07' })).toBeInTheDocument();
  });

  it('aplica as mesmas regras do cadastro (RN01–RN06)', async () => {
    await renderReady('/projects/prj-07/edit');
    setField(/Nome do projeto/, '   ');
    setField(/Prazo previsto/, '2026-01-01');
    await submitUpdate();

    expect(screen.getByText('Informe o nome do projeto.')).toBeInTheDocument();
    expect(
      screen.getByText('O prazo previsto não pode ser anterior à data de início.')
    ).toBeInTheDocument();
    expect(updateProject).not.toHaveBeenCalled();
  });

  it('permite salvar com o orçamento estourado, como no cadastro (RN03)', async () => {
    await renderReady('/projects/prj-07/edit');
    setField(/Orçamento consumido/, '900000');

    expect(screen.getByText(/orçamento consumido está acima do previsto/i)).toBeInTheDocument();

    await submitUpdate();

    expect(updateProject).toHaveBeenCalledWith(
      'prj-07',
      expect.objectContaining({ budgetSpent: 900_000 })
    );
  });

  it('limpa a observação apagada em vez de gravar texto vazio', async () => {
    await renderReady('/projects/prj-07/edit');
    setField(/Observações/, '');
    await submitUpdate();

    expect(updateProject).toHaveBeenCalledWith(
      'prj-07',
      expect.objectContaining({ observations: null })
    );
  });

  it('mostra a falha da API sem perder as alterações', async () => {
    vi.mocked(updateProject).mockRejectedValue(
      new HttpError('server', 'Erro no servidor. Tente novamente em instantes.', 500)
    );
    await renderReady('/projects/prj-07/edit');
    setField(/Nome do projeto/, 'Nome alterado');
    await submitUpdate();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Erro no servidor. Tente novamente em instantes.'
    );
    expect(screen.getByLabelText(/Nome do projeto/)).toHaveValue('Nome alterado');
  });

  it('exibe a mensagem da API quando o projeto não existe', async () => {
    vi.mocked(getProject).mockRejectedValue(
      new HttpError('client', 'Projeto não encontrado.', 404)
    );
    render('/projects/prj-inexistente/edit');

    expect(await screen.findByRole('alert')).toHaveTextContent('Projeto não encontrado.');
    expect(screen.queryByLabelText(/Nome do projeto/)).not.toBeInTheDocument();
  });

  it('volta aos detalhes ao cancelar, sem salvar nada', async () => {
    await renderReady('/projects/prj-07/edit');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.getByRole('heading', { name: 'Detalhes de prj-07' })).toBeInTheDocument();
    expect(updateProject).not.toHaveBeenCalled();
  });
});

/**
 * Base recém-criada, sem os cadastros de apoio. Sem este estado o formulário
 * abre com três seletores vazios e recusa qualquer tentativa de salvar, sem
 * dizer o que falta (F5-2).
 */
describe('cadastros de apoio ausentes', () => {
  it('diz o que falta e não monta o formulário quando não há cliente, gestor nem equipe', async () => {
    vi.mocked(listClients).mockResolvedValue([]);
    vi.mocked(listUsers).mockResolvedValue([]);
    vi.mocked(listTeams).mockResolvedValue([]);
    render();

    // Pelo texto, e não por `role="status"`: o "Carregando formulário..." usa o
    // mesmo papel e responderia primeiro.
    expect(await screen.findByText(/cadastros de apoio/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clientes' })).toHaveAttribute('href', '/clients');
    expect(screen.getByRole('link', { name: 'Usuários' })).toHaveAttribute('href', '/users');
    expect(screen.getByRole('link', { name: 'Equipes' })).toHaveAttribute('href', '/teams');
    expect(screen.queryByLabelText(/Nome do projeto/)).not.toBeInTheDocument();
  });

  it('aponta só o cadastro que está faltando', async () => {
    vi.mocked(listTeams).mockResolvedValue([]);
    render();

    await screen.findByText(/cadastros de apoio/);
    expect(screen.getByRole('link', { name: 'Equipes' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Clientes' })).not.toBeInTheDocument();
  });

  it('monta o formulário normalmente quando os três cadastros existem', async () => {
    await renderReady();
    expect(screen.queryByText(/cadastros de apoio/)).not.toBeInTheDocument();
  });
});
