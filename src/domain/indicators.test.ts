import { describe, expect, it } from 'vitest';
import {
  aggregateByClient,
  budgetConsumptionPercent,
  isLate,
  isOverBudget,
  needsAttention,
  parseCalendarDate,
  projectsNeedingAttention,
  summarizeProjects,
} from '@/domain/indicators';
import type { Client } from '@/types/client';
import type { Project } from '@/types/project';

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    name: 'Portal do Cliente',
    clientId: 'c1',
    objective: 'Centralizar o atendimento.',
    managerId: 'u1',
    teamId: 't1',
    startDate: '2026-01-01',
    deadline: '2026-12-31',
    budget: 100_000,
    budgetSpent: 25_000,
    hoursWorked: 120,
    status: 'EM_ANDAMENTO',
    observations: null,
    createdAt: '2026-01-01T12:00:00.000Z',
    updatedAt: '2026-01-01T12:00:00.000Z',
    ...overrides,
  };
}

function makeClient(id: string, name: string): Client {
  return { id, name, createdAt: '2026-01-01T12:00:00.000Z', updatedAt: '2026-01-01T12:00:00.000Z' };
}

/**
 * "Hoje" com hora cheia de propósito: a implementação ingênua
 * (`new Date(deadline) < new Date()`) só erra quando o instante atual carrega
 * hora, que é exatamente a armadilha A-002.
 */
const TODAY = new Date(2026, 7, 6, 14, 30); // 06/08/2026, 14h30 local

describe('budgetConsumptionPercent (RN07, armadilha A-001)', () => {
  it('calcula o percentual consumido', () => {
    expect(budgetConsumptionPercent({ budget: 100_000, budgetSpent: 25_000 })).toBe(25);
  });

  it('devolve null com orçamento zero e nada consumido — nunca NaN', () => {
    expect(budgetConsumptionPercent({ budget: 0, budgetSpent: 0 })).toBeNull();
  });

  it('devolve null com orçamento zero e algo consumido — nunca Infinity', () => {
    expect(budgetConsumptionPercent({ budget: 0, budgetSpent: 5_000 })).toBeNull();
  });

  it('passa de 100 quando o orçamento estoura, sem travar (RN03)', () => {
    expect(budgetConsumptionPercent({ budget: 100_000, budgetSpent: 150_000 })).toBe(150);
  });
});

describe('isOverBudget', () => {
  it('é verdadeiro só acima do previsto', () => {
    expect(isOverBudget({ budget: 100, budgetSpent: 101 })).toBe(true);
    expect(isOverBudget({ budget: 100, budgetSpent: 100 })).toBe(false);
    expect(isOverBudget({ budget: 100, budgetSpent: 99 })).toBe(false);
  });

  it('trata consumo sobre orçamento zero como estouro', () => {
    expect(isOverBudget({ budget: 0, budgetSpent: 1 })).toBe(true);
  });
});

describe('isLate (RN08, armadilha A-002)', () => {
  it('prazo igual a hoje NÃO está atrasado, mesmo com o dia em andamento', () => {
    expect(isLate({ deadline: '2026-08-06', status: 'EM_ANDAMENTO' }, TODAY)).toBe(false);
  });

  it('prazo de ontem está atrasado', () => {
    expect(isLate({ deadline: '2026-08-05', status: 'EM_ANDAMENTO' }, TODAY)).toBe(true);
  });

  it('prazo futuro não está atrasado', () => {
    expect(isLate({ deadline: '2026-08-07', status: 'EM_ANDAMENTO' }, TODAY)).toBe(false);
  });

  it('projeto encerrado nunca conta como atrasado', () => {
    expect(isLate({ deadline: '2020-01-01', status: 'CONCLUIDO' }, TODAY)).toBe(false);
    expect(isLate({ deadline: '2020-01-01', status: 'CANCELADO' }, TODAY)).toBe(false);
  });

  it('aceita timestamp ISO completo sem deslocar o dia pelo fuso', () => {
    expect(isLate({ deadline: '2026-08-06T00:00:00.000Z', status: 'EM_RISCO' }, TODAY)).toBe(false);
  });

  it('degrada para "não atrasado" quando a data é inválida, em vez de quebrar', () => {
    expect(isLate({ deadline: '', status: 'EM_ANDAMENTO' }, TODAY)).toBe(false);
    expect(isLate({ deadline: '31/12/2026', status: 'EM_ANDAMENTO' }, TODAY)).toBe(false);
  });
});

describe('needsAttention (RN09)', () => {
  const emDia = { deadline: '2026-12-31', budget: 100, budgetSpent: 10 };

  it('vale para status EM_RISCO', () => {
    expect(needsAttention({ ...emDia, status: 'EM_RISCO' }, TODAY)).toBe(true);
  });

  it('vale para projeto atrasado', () => {
    expect(
      needsAttention({ ...emDia, deadline: '2026-08-05', status: 'EM_ANDAMENTO' }, TODAY)
    ).toBe(true);
  });

  it('vale para orçamento excedido', () => {
    expect(needsAttention({ ...emDia, budgetSpent: 101, status: 'EM_ANDAMENTO' }, TODAY)).toBe(
      true
    );
  });

  it('é falso para projeto em dia', () => {
    expect(needsAttention({ ...emDia, status: 'EM_ANDAMENTO' }, TODAY)).toBe(false);
  });
});

describe('parseCalendarDate', () => {
  it('devolve meia-noite local, não UTC', () => {
    const date = parseCalendarDate('2026-08-06');
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(7);
    expect(date?.getDate()).toBe(6);
    expect(date?.getHours()).toBe(0);
  });

  it('rejeita data inexistente em vez de normalizar para o mês seguinte', () => {
    expect(parseCalendarDate('2026-02-31')).toBeNull();
  });

  it('devolve null para valor ausente ou fora do formato', () => {
    expect(parseCalendarDate('')).toBeNull();
    expect(parseCalendarDate(null)).toBeNull();
    expect(parseCalendarDate('06/08/2026')).toBeNull();
  });
});

describe('summarizeProjects (RF07)', () => {
  it('soma valores e conta por status', () => {
    const summary = summarizeProjects(
      [
        makeProject({ id: 'a', budget: 100_000, budgetSpent: 40_000, hoursWorked: 100 }),
        makeProject({
          id: 'b',
          status: 'CONCLUIDO',
          budget: 60_000,
          budgetSpent: 60_000,
          hoursWorked: 50,
        }),
      ],
      TODAY
    );

    expect(summary.totalProjects).toBe(2);
    expect(summary.totalBudget).toBe(160_000);
    expect(summary.totalBudgetSpent).toBe(100_000);
    expect(summary.totalHoursWorked).toBe(150);
    expect(summary.budgetConsumptionPercent).toBeCloseTo(62.5);
    expect(summary.projectsByStatus).toEqual({
      PLANEJAMENTO: 0,
      EM_ANDAMENTO: 1,
      EM_RISCO: 0,
      CONCLUIDO: 1,
      CANCELADO: 0,
    });
  });

  it('conta uma única vez o projeto que atende a várias condições (RN09)', () => {
    const summary = summarizeProjects(
      [
        makeProject({
          id: 'tudo-junto',
          status: 'EM_RISCO',
          deadline: '2026-08-01',
          budget: 100,
          budgetSpent: 200,
        }),
      ],
      TODAY
    );

    expect(summary.atRiskCount).toBe(1);
    expect(summary.lateCount).toBe(1);
    expect(summary.overBudgetCount).toBe(1);
    expect(summary.needsAttentionCount).toBe(1);
  });

  it('lida com carteira vazia sem NaN nem divisão por zero', () => {
    const summary = summarizeProjects([], TODAY);

    expect(summary.totalProjects).toBe(0);
    expect(summary.totalBudget).toBe(0);
    expect(summary.budgetConsumptionPercent).toBeNull();
    expect(summary.needsAttentionCount).toBe(0);
    expect(summary.projectsByStatus.PLANEJAMENTO).toBe(0);
  });

  it('devolve consumo indisponível quando a carteira inteira tem orçamento zero', () => {
    const summary = summarizeProjects(
      [
        makeProject({ budget: 0, budgetSpent: 0 }),
        makeProject({ id: 'b', budget: 0, budgetSpent: 0 }),
      ],
      TODAY
    );

    expect(summary.budgetConsumptionPercent).toBeNull();
  });
});

describe('projectsNeedingAttention (RF09)', () => {
  it('devolve só os projetos que exigem ação, sem repetir', () => {
    const emRiscoEAtrasado = makeProject({ id: 'a', status: 'EM_RISCO', deadline: '2026-01-01' });
    const emDia = makeProject({ id: 'b' });
    const estourado = makeProject({ id: 'c', budget: 10, budgetSpent: 11 });

    const result = projectsNeedingAttention([emRiscoEAtrasado, emDia, estourado], TODAY);

    expect(result.map((p) => p.id)).toEqual(['a', 'c']);
  });
});

describe('aggregateByClient (RF07, RF08)', () => {
  const clients = [
    makeClient('c1', 'Alfa Log'),
    makeClient('c2', 'Beta Saúde'),
    makeClient('c3', 'Sem projetos'),
  ];

  it('agrupa e soma por cliente, do maior orçamento para o menor', () => {
    const result = aggregateByClient(
      [
        makeProject({ id: 'a', clientId: 'c1', budget: 50_000, budgetSpent: 10_000 }),
        makeProject({ id: 'b', clientId: 'c1', budget: 30_000, budgetSpent: 5_000 }),
        makeProject({ id: 'c', clientId: 'c2', budget: 200_000, budgetSpent: 120_000 }),
      ],
      clients
    );

    expect(result).toEqual([
      {
        clientId: 'c2',
        clientName: 'Beta Saúde',
        projectCount: 1,
        budget: 200_000,
        budgetSpent: 120_000,
      },
      {
        clientId: 'c1',
        clientName: 'Alfa Log',
        projectCount: 2,
        budget: 80_000,
        budgetSpent: 15_000,
      },
    ]);
  });

  it('não cria série para cliente sem projeto (armadilha A-006)', () => {
    const result = aggregateByClient([makeProject({ clientId: 'c1' })], clients);

    expect(result.map((entry) => entry.clientId)).not.toContain('c3');
  });

  it('mantém o orçamento de projeto cujo cliente não veio na lista, com rótulo explícito', () => {
    const result = aggregateByClient(
      [makeProject({ clientId: 'fantasma', budget: 10_000 })],
      clients
    );

    expect(result).toHaveLength(1);
    expect(result[0].clientName).toBe('Cliente não identificado');
    expect(result[0].budget).toBe(10_000);
  });
});
