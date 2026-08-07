import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClientsPage from '@/pages/ClientsPage';
import { HttpError } from '@/services/http';
import { makeProjectSummary } from '@/test/factories';
import type { Client } from '@/types/client';

vi.mock('@/services/clients', () => ({ listClients: vi.fn(), createClient: vi.fn() }));
vi.mock('@/services/projects', () => ({ listProjects: vi.fn() }));

const { listClients, createClient } = await import('@/services/clients');
const { listProjects } = await import('@/services/projects');

const TIMESTAMP = '2026-01-05T12:00:00.000Z';

const clients: Client[] = [
  { id: 'cli-01', name: 'Alfa Logística', createdAt: TIMESTAMP, updatedAt: TIMESTAMP },
  { id: 'cli-02', name: 'Beta Saúde', createdAt: TIMESTAMP, updatedAt: TIMESTAMP },
];

function projectOf(id: string, clientId: string) {
  return makeProjectSummary({ id, name: `Projeto ${id}`, client: { id: clientId, name: '' } });
}

const projects = [
  projectOf('prj-01', 'cli-01'),
  projectOf('prj-02', 'cli-01'),
  projectOf('prj-03', 'cli-02'),
];

/** Linha da tabela pelo nome do cliente. */
function rowOf(name: string): HTMLElement {
  return screen.getByRole('cell', { name: new RegExp(name) }).closest('tr') as HTMLElement;
}

async function openForm() {
  await userEvent.click(await screen.findByRole('button', { name: 'Novo cliente' }));
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listClients).mockResolvedValue(clients);
  vi.mocked(listProjects).mockResolvedValue(projects);
});

describe('ClientsPage (RF02)', () => {
  it('lista os clientes com a contagem de projetos', async () => {
    render(<ClientsPage />);

    expect(await screen.findByText('Alfa Logística')).toBeInTheDocument();
    expect(within(rowOf('Alfa Logística')).getByText('2 projetos')).toBeInTheDocument();
    expect(within(rowOf('Beta Saúde')).getByText('1 projeto')).toBeInTheDocument();
    expect(screen.getByText('2 clientes cadastrados')).toBeInTheDocument();
  });

  it('formata a data de cadastro em pt-BR', async () => {
    render(<ClientsPage />);
    await screen.findByText('Alfa Logística');

    expect(within(rowOf('Alfa Logística')).getByText('05/01/2026')).toBeInTheDocument();
  });

  it('cadastra um cliente e o acrescenta à lista sem recarregar tudo', async () => {
    const novo: Client = {
      id: 'cli-03',
      name: 'Gama Energia',
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    };
    vi.mocked(createClient).mockResolvedValue(novo);
    render(<ClientsPage />);
    await openForm();

    await userEvent.type(screen.getByLabelText(/Nome do cliente/), 'Gama Energia');
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(createClient).toHaveBeenCalledWith({ name: 'Gama Energia' });
    expect(await screen.findByText('Gama Energia')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Cliente "Gama Energia" cadastrado.');
    // Uma carga só: a lista foi atualizada com o registro que a API devolveu.
    expect(listClients).toHaveBeenCalledTimes(1);
  });

  it('apara espaços do nome antes de enviar', async () => {
    vi.mocked(createClient).mockResolvedValue({
      id: 'cli-03',
      name: 'Gama Energia',
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    });
    render(<ClientsPage />);
    await openForm();

    await userEvent.type(screen.getByLabelText(/Nome do cliente/), '  Gama Energia  ');
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(createClient).toHaveBeenCalledWith({ name: 'Gama Energia' });
  });

  it('recusa nome vazio sem chamar a API', async () => {
    render(<ClientsPage />);
    await openForm();
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(screen.getByText('Informe o nome do cliente.')).toBeInTheDocument();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('recusa cliente repetido, ignorando caixa e acento', async () => {
    render(<ClientsPage />);
    await openForm();

    await userEvent.type(screen.getByLabelText(/Nome do cliente/), 'alfa logistica');
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(screen.getByText('Já existe um cliente com este nome.')).toBeInTheDocument();
    expect(createClient).not.toHaveBeenCalled();
  });

  it('mostra a falha da API sem perder o que foi digitado', async () => {
    vi.mocked(createClient).mockRejectedValue(
      new HttpError('server', 'Erro no servidor. Tente novamente em instantes.', 500)
    );
    render(<ClientsPage />);
    await openForm();

    await userEvent.type(screen.getByLabelText(/Nome do cliente/), 'Gama Energia');
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Erro no servidor. Tente novamente em instantes.'
    );
    expect(screen.getByLabelText(/Nome do cliente/)).toHaveValue('Gama Energia');
  });

  it('distingue lista vazia de falha de carga', async () => {
    vi.mocked(listClients).mockResolvedValue([]);
    render(<ClientsPage />);

    expect(await screen.findByText('Nenhum cliente cadastrado.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('exibe erro de carga com opção de tentar de novo', async () => {
    vi.mocked(listProjects).mockRejectedValueOnce(
      new HttpError('network', 'Falha de conexão. Verifique sua internet.', null)
    );
    render(<ClientsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Falha de conexão. Verifique sua internet.'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Alfa Logística')).toBeInTheDocument();
  });
});
