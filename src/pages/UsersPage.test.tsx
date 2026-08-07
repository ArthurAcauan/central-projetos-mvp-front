import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UsersPage from '@/pages/UsersPage';
import { HttpError } from '@/services/http';
import { makeProjectSummary } from '@/test/factories';
import type { User } from '@/types/user';

vi.mock('@/services/users', () => ({ listUsers: vi.fn(), createUser: vi.fn() }));
vi.mock('@/services/projects', () => ({ listProjects: vi.fn() }));

const { listUsers, createUser } = await import('@/services/users');
const { listProjects } = await import('@/services/projects');

const TIMESTAMP = '2026-02-20T12:00:00.000Z';

const users: User[] = [
  {
    id: 'usr-01',
    name: 'Bruno Tavares',
    email: 'bruno@exemplo.com.br',
    role: 'GESTOR_PROJETO',
    createdAt: TIMESTAMP,
  },
  {
    id: 'usr-02',
    name: 'Camila Ferreira',
    email: 'camila@exemplo.com.br',
    role: 'GERENTE',
    createdAt: TIMESTAMP,
  },
];

function makeProject(id: string, managerId: string) {
  return makeProjectSummary({
    id,
    name: `Projeto ${id}`,
    manager: { id: managerId, name: '' },
  });
}

const projects = [makeProject('prj-01', 'usr-01'), makeProject('prj-02', 'usr-01')];

/** Linha da tabela pelo nome do usuário. */
function rowOf(name: string): HTMLElement {
  return screen.getByRole('cell', { name: new RegExp(name) }).closest('tr') as HTMLElement;
}

async function openForm() {
  await userEvent.click(await screen.findByRole('button', { name: 'Novo usuário' }));
}

async function fillUser({ name = 'Diego Souza', email = 'diego@exemplo.com.br' } = {}) {
  await userEvent.type(screen.getByLabelText(/^Nome/), name);
  await userEvent.type(screen.getByLabelText(/E-mail/), email);
}

function submit() {
  return userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listUsers).mockResolvedValue(users);
  vi.mocked(listProjects).mockResolvedValue(projects);
});

describe('UsersPage (RF01)', () => {
  it('lista os usuários com perfil e projetos sob gestão', async () => {
    render(<UsersPage />);

    expect(await screen.findByText('Bruno Tavares')).toBeInTheDocument();
    const bruno = rowOf('Bruno Tavares');
    expect(within(bruno).getByText('bruno@exemplo.com.br')).toBeInTheDocument();
    // `role` é dado cadastral exibido, nunca controle de acesso (A-007).
    expect(within(bruno).getByText('Gestor de Projeto')).toBeInTheDocument();
    expect(within(bruno).getByText('2 projetos')).toBeInTheDocument();

    expect(within(rowOf('Camila Ferreira')).getByText('Gerente')).toBeInTheDocument();
    expect(within(rowOf('Camila Ferreira')).getByText('0 projetos')).toBeInTheDocument();
    expect(screen.getByText('2 usuários cadastrados')).toBeInTheDocument();
  });

  it('cadastra um usuário com o perfil escolhido', async () => {
    const novo: User = {
      id: 'usr-03',
      name: 'Diego Souza',
      email: 'diego@exemplo.com.br',
      role: 'COORDENADOR',
      createdAt: TIMESTAMP,
    };
    vi.mocked(createUser).mockResolvedValue(novo);
    render(<UsersPage />);
    await openForm();

    await fillUser();
    await userEvent.selectOptions(screen.getByLabelText(/Perfil de acesso/), 'COORDENADOR');
    await submit();

    expect(createUser).toHaveBeenCalledWith({
      name: 'Diego Souza',
      email: 'diego@exemplo.com.br',
      role: 'COORDENADOR',
    });
    expect(await screen.findByText('Diego Souza')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Usuário "Diego Souza" cadastrado.');
  });

  it('cobra nome e e-mail antes de chamar a API', async () => {
    render(<UsersPage />);
    await openForm();
    await submit();

    expect(screen.getByText('Informe o nome do usuário.')).toBeInTheDocument();
    expect(screen.getByText('Informe o e-mail.')).toBeInTheDocument();
    expect(createUser).not.toHaveBeenCalled();
  });

  it('recusa e-mail malformado', async () => {
    render(<UsersPage />);
    await openForm();
    await fillUser({ email: 'diego@empresa' });
    await submit();

    expect(screen.getByText('E-mail inválido.')).toBeInTheDocument();
    expect(createUser).not.toHaveBeenCalled();
  });

  it('recusa e-mail já cadastrado (users.email é UNIQUE)', async () => {
    render(<UsersPage />);
    await openForm();
    await fillUser({ email: 'BRUNO@exemplo.com.br' });
    await submit();

    expect(screen.getByText('Já existe um usuário com este e-mail.')).toBeInTheDocument();
    expect(createUser).not.toHaveBeenCalled();
  });

  it('não nasce com a tela vermelha: sem tentativa de salvar, sem erro', async () => {
    render(<UsersPage />);
    await openForm();

    expect(screen.queryByText('Informe o nome do usuário.')).not.toBeInTheDocument();
  });

  it('mostra a falha da API sem perder o que foi digitado', async () => {
    vi.mocked(createUser).mockRejectedValue(
      new HttpError('server', 'Erro no servidor. Tente novamente em instantes.', 500)
    );
    render(<UsersPage />);
    await openForm();
    await fillUser();
    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Erro no servidor. Tente novamente em instantes.'
    );
    expect(screen.getByLabelText(/^Nome/)).toHaveValue('Diego Souza');
  });

  it('distingue lista vazia de falha de carga', async () => {
    vi.mocked(listUsers).mockResolvedValue([]);
    render(<UsersPage />);

    expect(await screen.findByText('Nenhum usuário cadastrado.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('exibe erro de carga com opção de tentar de novo', async () => {
    vi.mocked(listUsers).mockRejectedValueOnce(
      new HttpError('network', 'Falha de conexão. Verifique sua internet.', null)
    );
    render(<UsersPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Falha de conexão. Verifique sua internet.'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Bruno Tavares')).toBeInTheDocument();
  });
});
