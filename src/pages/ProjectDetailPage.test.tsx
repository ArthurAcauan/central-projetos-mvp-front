import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatCalendarDate } from '@/domain/indicators';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import { HttpError } from '@/services/http';
import { makeIndicators, makeProject as buildProject } from '@/test/factories';
import type { Project } from '@/types/project';

vi.mock('@/services/projects', () => ({ getProject: vi.fn() }));

const { getProject } = await import('@/services/projects');

function daysFromToday(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatCalendarDate(date);
}

/**
 * A carga do detalhe é uma chamada só desde a integração (ADR-0007): a API já
 * devolve cliente, gestor e equipe resolvidos e os indicadores calculados.
 */
function makeProject(overrides: Partial<Project> = {}): Project {
  return buildProject({
    startDate: daysFromToday(-100),
    deadline: daysFromToday(100),
    budget: 400_000,
    budgetSpent: 100_000,
    hoursWorked: 1_240,
    ...overrides,
  });
}

function mockData(project: Project) {
  vi.mocked(getProject).mockResolvedValue(project);
}

function renderDetail(id = 'prj-01') {
  return render(
    <MemoryRouter initialEntries={[`/projects/${id}`]}>
      <Routes>
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/projects" element={<h1>Projetos</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

/** O valor exibido logo abaixo de um rótulo de `<dt>`. */
function valueOf(label: string): string {
  const term = screen.getByText(label);
  return term.nextElementSibling?.textContent ?? '';
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ProjectDetailPage (RF05)', () => {
  it('mostra o estado de carregando antes dos dados chegarem', async () => {
    mockData(makeProject());
    renderDetail();

    expect(screen.getByRole('status')).toHaveTextContent('Carregando projeto...');
    expect(await screen.findByRole('heading', { name: 'Portal do Cliente' })).toBeInTheDocument();
  });

  it('leva à edição do projeto (F2-4)', async () => {
    mockData(makeProject());
    renderDetail();
    await screen.findByRole('heading', { name: 'Portal do Cliente' });

    expect(screen.getByRole('link', { name: 'Editar projeto' })).toHaveAttribute(
      'href',
      '/projects/prj-01/edit'
    );
  });

  it('exibe todos os campos do projeto com os nomes resolvidos', async () => {
    mockData(makeProject({ observations: 'Homologação pendente com o parceiro.' }));
    renderDetail();
    await screen.findByRole('heading', { name: 'Portal do Cliente' });

    expect(valueOf('Cliente')).toBe('Alfa Logística');
    expect(valueOf('Gestor responsável')).toBe('Bruno Tavares');
    expect(valueOf('Equipe')).toBe('Squad Plataforma');
    expect(screen.getByText('Centralizar o atendimento em um canal único.')).toBeInTheDocument();
    expect(screen.getByText('Homologação pendente com o parceiro.')).toBeInTheDocument();
    expect(screen.getByText('1.240')).toBeInTheDocument();
  });

  it('omite o bloco de observações quando não há observação', async () => {
    mockData(makeProject({ observations: null }));
    renderDetail();
    await screen.findByRole('heading', { name: 'Portal do Cliente' });

    expect(screen.queryByText('Observações')).not.toBeInTheDocument();
  });

  it('mostra saldo disponível dentro do orçamento e excedente quando estoura', async () => {
    mockData(makeProject());
    const { unmount } = renderDetail();
    await screen.findByRole('heading', { name: 'Portal do Cliente' });

    expect(screen.getByText('Saldo disponível')).toBeInTheDocument();
    expect(valueOf('Saldo disponível')).toContain('300.000');
    expect(screen.queryByText('Excedente')).not.toBeInTheDocument();
    unmount();

    // RN03: estouro é permitido e precisa aparecer, com o valor excedido.
    mockData(
      makeProject({
        budget: 200_000,
        budgetSpent: 250_000,
        indicators: makeIndicators({ consumptionPercent: 125, isOverBudget: true }),
      })
    );
    renderDetail();
    await screen.findByRole('heading', { name: 'Portal do Cliente' });

    expect(valueOf('Excedente')).toContain('50.000');
    expect(screen.getByText(/Orçamento excedido em/)).toHaveTextContent('25,0% acima do previsto');
  });

  it('alerta o atraso com o número de dias (RN08)', async () => {
    mockData(
      makeProject({ deadline: daysFromToday(-3), indicators: makeIndicators({ isLate: true }) })
    );
    renderDetail();
    await screen.findByRole('heading', { name: 'Portal do Cliente' });

    expect(screen.getByText(/Projeto atrasado/)).toHaveTextContent('há 3 dias');
    expect(screen.getByText('3d atrasado')).toBeInTheDocument();
  });

  it('projeto encerrado depois do prazo não é atraso, mas diz que passou (RN08)', async () => {
    mockData(makeProject({ status: 'CONCLUIDO', deadline: daysFromToday(-10) }));
    renderDetail();
    await screen.findByRole('heading', { name: 'Portal do Cliente' });

    expect(screen.queryByText(/Projeto atrasado/)).not.toBeInTheDocument();
    expect(screen.getByText('encerrado após o prazo')).toBeInTheDocument();
  });

  it('mostra o percentual consumido no medidor', async () => {
    mockData(makeProject({ budget: 400_000, budgetSpent: 100_000 }));
    renderDetail();
    await screen.findByRole('heading', { name: 'Portal do Cliente' });

    expect(screen.getByText('25,0%')).toBeInTheDocument();
    expect(screen.getByText('R$ 100.000 / R$ 400.000')).toBeInTheDocument();
  });

  it('não trata prazo igual a hoje como atraso (armadilha A-002)', async () => {
    mockData(makeProject({ deadline: daysFromToday(0) }));
    renderDetail();
    await screen.findByRole('heading', { name: 'Portal do Cliente' });

    expect(screen.queryByText(/Projeto atrasado/)).not.toBeInTheDocument();
    expect(screen.getByText('vence hoje')).toBeInTheDocument();
  });

  it('avisa "em risco" sempre que o gestor declarou, mesmo com atraso junto', async () => {
    mockData(makeProject({ status: 'EM_RISCO' }));
    const { unmount } = renderDetail();
    await screen.findByRole('heading', { name: 'Portal do Cliente' });
    expect(screen.getByText(/classificado como Em risco/)).toBeInTheDocument();
    unmount();

    // O risco declarado não deixa de valer porque há atraso: são coisas
    // diferentes, e o contrato as mantém separadas (ADR-0007).
    mockData(
      makeProject({
        status: 'EM_RISCO',
        deadline: daysFromToday(-5),
        indicators: makeIndicators({ isLate: true }),
      })
    );
    renderDetail();
    await screen.findByRole('heading', { name: 'Portal do Cliente' });
    expect(screen.getByText(/classificado como Em risco/)).toBeInTheDocument();
    expect(screen.getByText(/Projeto atrasado/)).toBeInTheDocument();
  });

  // Indicador novo do contrato: 90% ou mais sem ter estourado ainda.
  it('avisa consumo elevado antes do estouro, e cala depois dele', async () => {
    mockData(
      makeProject({
        budget: 100_000,
        budgetSpent: 92_000,
        indicators: makeIndicators({ consumptionPercent: 92, hasHighConsumption: true }),
      })
    );
    const { unmount } = renderDetail();
    await screen.findByRole('heading', { name: 'Portal do Cliente' });
    expect(screen.getByText(/Consumo do orçamento em 92,0%/)).toBeInTheDocument();
    unmount();

    mockData(
      makeProject({
        budget: 100_000,
        budgetSpent: 150_000,
        indicators: makeIndicators({
          consumptionPercent: 150,
          hasHighConsumption: true,
          isOverBudget: true,
        }),
      })
    );
    renderDetail();
    await screen.findByRole('heading', { name: 'Portal do Cliente' });
    // O alerta de estouro já diz o mesmo, com mais precisão.
    expect(screen.queryByText(/Consumo do orçamento em/)).not.toBeInTheDocument();
  });

  it('sem orçamento previsto mostra "—" no consumo, nunca NaN (RN07)', async () => {
    mockData(
      makeProject({
        budget: 0,
        budgetSpent: 0,
        indicators: makeIndicators({ consumptionPercent: null }),
      })
    );
    renderDetail();
    await screen.findByRole('heading', { name: 'Portal do Cliente' });

    expect(screen.getByText('Sem orçamento previsto para comparar.')).toBeInTheDocument();
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
  });

  it('não divide por zero quando início e prazo são o mesmo dia', async () => {
    const sameDay = daysFromToday(0);
    mockData(makeProject({ startDate: sameDay, deadline: sameDay }));
    renderDetail();
    await screen.findByRole('heading', { name: 'Portal do Cliente' });

    expect(screen.getByText('Período do projeto indisponível.')).toBeInTheDocument();
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
  });

  it('mostra o erro da API e permite tentar de novo', async () => {
    const user = userEvent.setup();
    vi.mocked(getProject).mockRejectedValue(
      new HttpError('client', 'Projeto não encontrado.', 404)
    );
    renderDetail('inexistente');

    expect(await screen.findByRole('alert')).toHaveTextContent('Projeto não encontrado.');

    mockData(makeProject());
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('heading', { name: 'Portal do Cliente' })).toBeInTheDocument();
  });

  it('volta para a lista pelo link', async () => {
    const user = userEvent.setup();
    mockData(makeProject());
    renderDetail();
    await screen.findByRole('heading', { name: 'Portal do Cliente' });

    // A seta é decorativa (`aria-hidden`): o nome acessível é só "Voltar".
    await user.click(screen.getByRole('link', { name: 'Voltar' }));

    expect(screen.getByRole('heading', { name: 'Projetos' })).toBeInTheDocument();
  });
});
