import { render as rtlRender, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from '@/pages/DashboardPage';
import { HttpError } from '@/services/http';
import { makeIndicators, makeProjectSummary } from '@/test/factories';
import type { ProjectSummary } from '@/types/project';

vi.mock('@/services/projects', () => ({ listProjects: vi.fn() }));

const { listProjects } = await import('@/services/projects');

const alfa = { id: 'cli-01', name: 'Alfa Logística' };
const beta = { id: 'cli-02', name: 'Beta Saúde' };

/**
 * Os indicadores vêm do backend (ADR-0007), então cada projeto declara o estado
 * que quer exercitar em vez de montar datas e esperar que a regra o derive.
 */
function makeProject(overrides: Partial<ProjectSummary> & Pick<ProjectSummary, 'id' | 'name'>) {
  return makeProjectSummary({ client: alfa, ...overrides });
}

/** Em dia, dentro do orçamento: não entra no painel de atenção. */
const healthy = makeProject({ id: 'prj-01', name: 'Portal do Cliente', hoursWorked: 100 });

/** Prazo vencido com o projeto ativo (RN08). */
const late = makeProject({
  id: 'prj-02',
  name: 'Rastreamento de Frota',
  deadline: '2026-01-10',
  hoursWorked: 400,
  indicators: makeIndicators({
    isLate: true,
    needsAttention: true,
    attentionReasons: ['ATRASADO'],
  }),
});

/** Prazo hoje: a API não marca como atrasado (RN08, armadilha A-002). */
const dueToday = makeProject({
  id: 'prj-03',
  name: 'Agendamento Online',
  hoursWorked: 50,
});

/** Em risco E com orçamento estourado: conta uma vez só (RN09). */
const atRiskAndOver = makeProject({
  id: 'prj-04',
  name: 'Prontuário Eletrônico',
  client: beta,
  status: 'EM_RISCO',
  budget: 200_000,
  budgetSpent: 240_000,
  hoursWorked: 900,
  indicators: makeIndicators({
    consumptionPercent: 120,
    isOverBudget: true,
    needsAttention: true,
    attentionReasons: ['ORCAMENTO_EXCEDIDO'],
  }),
});

/** Encerrado depois do prazo: não é atraso (RN08). */
const finishedLate = makeProject({
  id: 'prj-05',
  name: 'Migração de ERP',
  status: 'CONCLUIDO',
  deadline: '2025-12-01',
  hoursWorked: 0,
  // Consumo elevado, mas encerrado: a API não marca atenção (armadilha 3 do
  // contrato). O front não pode inferir atenção a partir do percentual.
  indicators: makeIndicators({ consumptionPercent: 97, hasHighConsumption: true }),
});

const allProjects = [healthy, late, dueToday, atRiskAndOver, finishedLate];

function render() {
  return rtlRender(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

/** O card de indicador que contém este rótulo. */
function kpiOf(label: string): HTMLElement {
  return screen.getByText(label).closest('div') as HTMLElement;
}

/** A tabela do painel de atenção (RF09). */
function attentionTable(): HTMLElement {
  return screen.getByRole('table', {
    name: 'Projetos em risco, atrasados ou com orçamento excedido',
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listProjects).mockResolvedValue(allProjects);
});

describe('cards de indicadores (RF07)', () => {
  it('mostra total, atenção, orçamento e horas', async () => {
    render();
    await screen.findByText('Total de projetos');

    expect(within(kpiOf('Total de projetos')).getByText('5')).toBeInTheDocument();
    // prj-02 (atrasado) e prj-04 (estourado). prj-05 tem consumo elevado mas
    // está encerrado, e a API não o marca — o front respeita isso.
    expect(within(kpiOf('Em situação de atenção')).getByText('2')).toBeInTheDocument();
    expect(within(kpiOf('Orçamento total')).getByText('R$ 600.000')).toBeInTheDocument();
    expect(within(kpiOf('Horas realizadas')).getByText('1.450')).toBeInTheDocument();
  });

  // Armadilha 1 do contrato: risco declarado e atenção derivada são coisas
  // diferentes, e somar produziria número maior que o total da carteira.
  it('mostra risco declarado separado dos motivos derivados', async () => {
    render();
    await screen.findByText('Em situação de atenção');

    expect(
      within(kpiOf('Em situação de atenção')).getByText('1 atrasados · 1 estourados · 1 em risco')
    ).toBeInTheDocument();
  });

  it('exibe "—" no consumo quando não há orçamento previsto (RN07, A-001)', async () => {
    vi.mocked(listProjects).mockResolvedValue([
      makeProject({
        id: 'prj-99',
        name: 'Piloto',
        budget: 0,
        budgetSpent: 0,
        hoursWorked: 0,
        indicators: makeIndicators({ consumptionPercent: null }),
      }),
    ]);
    render();
    await screen.findByText('Orçamento total');

    // Nunca "∞%" nem "0%": são situações diferentes e o gestor precisa distingui-las.
    expect(within(kpiOf('Orçamento total')).getByText(/— consumido/)).toBeInTheDocument();
  });

  it('mostra a distribuição por status em texto, além do gráfico', async () => {
    render();
    await screen.findByText('Total de projetos');

    expect(screen.getByText('Em andamento: 3 projetos')).toBeInTheDocument();
    expect(screen.getByText('Em risco: 1 projetos')).toBeInTheDocument();
    expect(screen.getByText('Concluído: 1 projetos')).toBeInTheDocument();
    expect(screen.getByText('Cancelado: 0 projetos')).toBeInTheDocument();
  });
});

describe('gráficos (RF08)', () => {
  it('renderiza os quatro gráficos previstos', async () => {
    render();
    await screen.findByText('Total de projetos');

    expect(screen.getByRole('heading', { name: 'Projetos por status' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Orçamento previsto x consumido por cliente' })
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Projetos por cliente' })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Horas realizadas por projeto' })
    ).toBeInTheDocument();
  });

  // Armadilha A-006: série vazia produz eixo solto ou quebra o domínio.
  it('troca cada gráfico por uma frase quando não há dado para plotar', async () => {
    vi.mocked(listProjects).mockResolvedValue([]);
    render();
    await screen.findByText('Total de projetos');

    expect(
      screen.getByText('Nenhum projeto cadastrado para distribuir por status.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Nenhum projeto com cliente para comparar orçamento.')
    ).toBeInTheDocument();
    expect(screen.getByText('Nenhuma hora apontada nos projetos.')).toBeInTheDocument();
  });

  it('não plota horas de projeto sem apontamento', async () => {
    vi.mocked(listProjects).mockResolvedValue([finishedLate]);
    render();
    await screen.findByText('Total de projetos');

    expect(screen.getByText('Nenhuma hora apontada nos projetos.')).toBeInTheDocument();
  });
});

describe('painel de atenção (RF09)', () => {
  it('lista quem a API marcou, cada projeto uma única vez (RN09)', async () => {
    render();
    await screen.findByText('Total de projetos');

    const rows = within(attentionTable()).getAllByRole('row');
    // Cabeçalho + dois projetos.
    expect(rows).toHaveLength(3);
    expect(within(attentionTable()).getByText('Rastreamento de Frota')).toBeInTheDocument();
    expect(within(attentionTable()).getByText('Prontuário Eletrônico')).toBeInTheDocument();
    expect(screen.getByText('2 projetos')).toBeInTheDocument();
  });

  it('deixa de fora o projeto em dia, o que vence hoje e o encerrado após o prazo', async () => {
    render();
    await screen.findByText('Total de projetos');

    const table = attentionTable();
    expect(within(table).queryByText('Portal do Cliente')).not.toBeInTheDocument();
    // Prazo igual a hoje não está atrasado (RN08, armadilha A-002).
    expect(within(table).queryByText('Agendamento Online')).not.toBeInTheDocument();
    // Encerrado com 97% consumido: nem atraso, nem atenção (RN08 e armadilha 3).
    expect(within(table).queryByText('Migração de ERP')).not.toBeInTheDocument();
  });

  it('explica o motivo em texto, não só em cor', async () => {
    render();
    await screen.findByText('Total de projetos');

    const linhaRisco = within(attentionTable())
      .getByText('Prontuário Eletrônico')
      .closest('tr') as HTMLElement;

    expect(within(linhaRisco).getByText('Em risco · Orç. excedido')).toBeInTheDocument();

    const linhaAtraso = within(attentionTable())
      .getByText('Rastreamento de Frota')
      .closest('tr') as HTMLElement;

    expect(within(linhaAtraso).getByText('Atrasado')).toBeInTheDocument();
  });

  it('leva aos detalhes do projeto', async () => {
    render();
    await screen.findByText('Total de projetos');

    expect(
      within(attentionTable()).getByRole('link', { name: 'Rastreamento de Frota' })
    ).toHaveAttribute('href', '/projects/prj-02');
  });

  it('diz explicitamente quando não há projeto em atenção', async () => {
    vi.mocked(listProjects).mockResolvedValue([healthy]);
    render();
    await screen.findByText('Total de projetos');

    expect(screen.getByText('Nenhum projeto em situação de atenção.')).toBeInTheDocument();
  });
});

describe('estados de carga', () => {
  it('mostra o estado de carregando antes dos dados chegarem', async () => {
    render();

    expect(screen.getByRole('status')).toHaveTextContent('Carregando indicadores...');
    expect(await screen.findByText('Total de projetos')).toBeInTheDocument();
  });

  it('exibe erro da API com opção de tentar de novo', async () => {
    vi.mocked(listProjects).mockRejectedValueOnce(
      new HttpError('server', 'Erro no servidor. Tente novamente em instantes.', 500)
    );
    render();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Erro no servidor. Tente novamente em instantes.'
    );

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('Total de projetos')).toBeInTheDocument();
  });
});
