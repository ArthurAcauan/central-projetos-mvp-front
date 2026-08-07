/**
 * Testes de `domain/indicators.ts` depois da integração (ADR-0007).
 *
 * O que **não** está mais aqui: atraso, percentual de consumo, estouro e
 * situação de atenção. Passaram a ser calculados pelo backend, e o teste foi
 * junto com a responsabilidade — mantê-lo aqui verificaria uma regra que este
 * repositório não implementa mais.
 *
 * O que ficou: o que a API não devolve (distância até o prazo, progresso do
 * período, saldo), as conversões de data — onde mora a armadilha A-002 — e os
 * agregados que alimentam os gráficos do RF08.
 */

import { describe, expect, it } from 'vitest';
import {
  aggregateByClient,
  budgetOverrunPercent,
  budgetRemaining,
  daysUntilDeadline,
  formatCalendarDate,
  parseCalendarDate,
  projectsNeedingAttention,
  scheduleProgressPercent,
  summarizeProjects,
  topProjectsByHours,
} from '@/domain/indicators';
import { makeIndicators, makeProjectSummary } from '@/test/factories';

const TODAY = new Date(2026, 5, 15); // 15/06/2026, meio do ano, fuso local

describe('saldo do orçamento', () => {
  it('devolve o que resta do previsto', () => {
    expect(budgetRemaining({ budget: 100_000, budgetSpent: 25_000 })).toBe(75_000);
  });

  it('devolve negativo quando estourou — é o excedente (RN03)', () => {
    expect(budgetRemaining({ budget: 100_000, budgetSpent: 130_000 })).toBe(-30_000);
  });

  it('não precisa de guarda para orçamento zero: subtração não divide', () => {
    expect(budgetRemaining({ budget: 0, budgetSpent: 5_000 })).toBe(-5_000);
  });
});

describe('excedente percentual', () => {
  it('deriva do percentual que a API mandou, sem dividir de novo', () => {
    const project = makeProjectSummary({ indicators: makeIndicators({ consumptionPercent: 130 }) });

    expect(budgetOverrunPercent(project)).toBe(30);
  });

  it('é zero dentro do orçamento', () => {
    const project = makeProjectSummary({ indicators: makeIndicators({ consumptionPercent: 72 }) });

    expect(budgetOverrunPercent(project)).toBe(0);
  });

  // RN07: sem previsto não há proporção — "—" na tela, nunca 0% (A-001).
  it('é null quando o consumo é indisponível', () => {
    const project = makeProjectSummary({
      indicators: makeIndicators({ consumptionPercent: null }),
    });

    expect(budgetOverrunPercent(project)).toBeNull();
  });
});

describe('dias até o prazo', () => {
  it('conta dias que faltam', () => {
    expect(daysUntilDeadline({ deadline: '2026-06-25' }, TODAY)).toBe(10);
  });

  it('devolve zero no dia do prazo', () => {
    expect(daysUntilDeadline({ deadline: '2026-06-15' }, TODAY)).toBe(0);
  });

  it('devolve negativo depois do prazo', () => {
    expect(daysUntilDeadline({ deadline: '2026-06-05' }, TODAY)).toBe(-10);
  });

  // Armadilha A-002: contar em milissegundos entre instantes atravessa o
  // horário de verão e erra um dia no arredondamento.
  it('não erra ao atravessar mudança de horário', () => {
    const beforeDst = new Date(2026, 1, 10, 23, 30);

    expect(daysUntilDeadline({ deadline: '2026-03-10' }, beforeDst)).toBe(28);
  });

  it('devolve null para prazo inválido', () => {
    expect(daysUntilDeadline({ deadline: 'nao-e-data' }, TODAY)).toBeNull();
  });
});

describe('progresso do período', () => {
  it('mede quanto do período já passou', () => {
    const project = { startDate: '2026-06-05', deadline: '2026-06-25' };

    expect(scheduleProgressPercent(project, TODAY)).toBe(50);
  });

  it('prende em 100 com o prazo vencido, em vez de passar de 100', () => {
    const project = { startDate: '2026-01-01', deadline: '2026-02-01' };

    expect(scheduleProgressPercent(project, TODAY)).toBe(100);
  });

  it('prende em 0 antes de começar', () => {
    const project = { startDate: '2026-07-01', deadline: '2026-08-01' };

    expect(scheduleProgressPercent(project, TODAY)).toBe(0);
  });

  // Mesma família da A-001: início igual ao prazo dividiria por zero.
  it('devolve null quando início e prazo são o mesmo dia', () => {
    expect(
      scheduleProgressPercent({ startDate: '2026-06-15', deadline: '2026-06-15' }, TODAY)
    ).toBeNull();
  });

  it('devolve null com data inválida', () => {
    expect(scheduleProgressPercent({ startDate: 'x', deadline: '2026-12-31' }, TODAY)).toBeNull();
  });
});

describe('conversão de data de calendário (armadilha A-002)', () => {
  it('lê YYYY-MM-DD como data local, não UTC', () => {
    const date = parseCalendarDate('2026-08-06');

    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(7);
    expect(date?.getDate()).toBe(6);
  });

  it('aceita timestamp ISO completo lendo só a parte da data', () => {
    expect(parseCalendarDate('2026-08-06T23:45:00.000Z')?.getDate()).toBe(6);
  });

  it('devolve null para ausente, vazio ou inválido', () => {
    expect(parseCalendarDate(null)).toBeNull();
    expect(parseCalendarDate(undefined)).toBeNull();
    expect(parseCalendarDate('')).toBeNull();
    expect(parseCalendarDate('06/08/2026')).toBeNull();
  });

  it('rejeita data inexistente em vez de normalizar', () => {
    expect(parseCalendarDate('2026-02-31')).toBeNull();
  });

  it('faz o caminho de volta sem converter para UTC', () => {
    expect(formatCalendarDate(new Date(2026, 7, 6))).toBe('2026-08-06');
    // 23h local em UTC-3 vira o dia seguinte em UTC; `toISOString` erraria aqui.
    expect(formatCalendarDate(new Date(2026, 7, 6, 23, 0))).toBe('2026-08-06');
  });
});

describe('consolidação da carteira (RF07)', () => {
  const projects = [
    makeProjectSummary({
      id: 'p1',
      status: 'EM_ANDAMENTO',
      budget: 100_000,
      budgetSpent: 25_000,
      hoursWorked: 100,
    }),
    makeProjectSummary({
      id: 'p2',
      status: 'EM_RISCO',
      budget: 200_000,
      budgetSpent: 240_000,
      hoursWorked: 300,
      indicators: makeIndicators({
        consumptionPercent: 120,
        isOverBudget: true,
        needsAttention: true,
        attentionReasons: ['ORCAMENTO_EXCEDIDO'],
      }),
    }),
    makeProjectSummary({
      id: 'p3',
      status: 'EM_ANDAMENTO',
      budget: 50_000,
      budgetSpent: 47_000,
      hoursWorked: 60,
      indicators: makeIndicators({
        consumptionPercent: 94,
        isLate: true,
        hasHighConsumption: true,
        needsAttention: true,
        attentionReasons: ['ATRASADO', 'CONSUMO_ELEVADO'],
      }),
    }),
    makeProjectSummary({
      id: 'p4',
      status: 'CONCLUIDO',
      budget: 0,
      budgetSpent: 0,
      hoursWorked: 0,
    }),
  ];

  it('soma orçamento, consumo e horas', () => {
    const summary = summarizeProjects(projects);

    expect(summary.totalProjects).toBe(4);
    expect(summary.totalBudget).toBe(350_000);
    expect(summary.totalBudgetSpent).toBe(312_000);
    expect(summary.totalHoursWorked).toBe(460);
  });

  it('conta os cinco status, inclusive os zerados', () => {
    expect(summarizeProjects(projects).projectsByStatus).toEqual({
      PLANEJAMENTO: 0,
      EM_ANDAMENTO: 2,
      EM_RISCO: 1,
      CONCLUIDO: 1,
      CANCELADO: 0,
    });
  });

  it('lê os contadores dos indicadores da API em vez de recalcular', () => {
    const summary = summarizeProjects(projects);

    expect(summary.lateCount).toBe(1);
    expect(summary.overBudgetCount).toBe(1);
    expect(summary.highConsumptionCount).toBe(1);
    // `EM_RISCO` é julgamento do gestor e continua sendo contado à parte.
    expect(summary.atRiskCount).toBe(1);
    // RN09 revisado: p2 e p3. p2 também é EM_RISCO, e mesmo assim conta uma vez.
    expect(summary.needsAttentionCount).toBe(2);
  });

  it('calcula o consumo da carteira, e devolve null sem previsto (RN07)', () => {
    expect(summarizeProjects(projects).budgetConsumptionPercent).toBeCloseTo(89.14, 2);
    expect(
      summarizeProjects([makeProjectSummary({ budget: 0, budgetSpent: 0 })])
        .budgetConsumptionPercent
    ).toBeNull();
  });

  // O contrato anexa status fora da lista de propósito, para denunciar dado
  // corrompido. Descartar em silêncio esconderia o problema.
  it('separa status não canônico em vez de descartá-lo', () => {
    const summary = summarizeProjects([
      ...projects,
      makeProjectSummary({ id: 'p9', status: 'ARQUIVADO' }),
    ]);

    expect(summary.totalProjects).toBe(5);
    expect(summary.unknownStatuses).toEqual([{ status: 'ARQUIVADO', total: 1 }]);
  });

  it('devolve zeros com a carteira vazia, sem NaN', () => {
    const summary = summarizeProjects([]);

    expect(summary.totalProjects).toBe(0);
    expect(summary.budgetConsumptionPercent).toBeNull();
    expect(summary.unknownStatuses).toEqual([]);
  });
});

describe('painel de atenção (RF09)', () => {
  it('devolve só quem a API marcou, na ordem de entrada', () => {
    const calm = makeProjectSummary({ id: 'p1' });
    const alert = makeProjectSummary({
      id: 'p2',
      indicators: makeIndicators({ needsAttention: true, attentionReasons: ['ATRASADO'] }),
    });

    expect(projectsNeedingAttention([calm, alert, calm]).map((p) => p.id)).toEqual(['p2']);
  });
});

describe('agregado por cliente (RF08)', () => {
  const acme = { id: 'cli-01', name: 'Acme' };
  const beta = { id: 'cli-02', name: 'Beta' };

  it('soma orçamento e contagem por cliente, usando o nome que veio no projeto', () => {
    const result = aggregateByClient([
      makeProjectSummary({ id: 'p1', client: acme, budget: 100_000, budgetSpent: 10_000 }),
      makeProjectSummary({ id: 'p2', client: acme, budget: 50_000, budgetSpent: 5_000 }),
      makeProjectSummary({ id: 'p3', client: beta, budget: 400_000, budgetSpent: 90_000 }),
    ]);

    expect(result).toEqual([
      {
        clientId: 'cli-02',
        clientName: 'Beta',
        projectCount: 1,
        budget: 400_000,
        budgetSpent: 90_000,
      },
      {
        clientId: 'cli-01',
        clientName: 'Acme',
        projectCount: 2,
        budget: 150_000,
        budgetSpent: 15_000,
      },
    ]);
  });

  it('deixa de fora cliente sem projeto — não há o que plotar (A-006)', () => {
    expect(aggregateByClient([])).toEqual([]);
  });

  it('desempata por nome, para a ordem não variar entre cargas', () => {
    const result = aggregateByClient([
      makeProjectSummary({ id: 'p1', client: { id: 'z', name: 'Zeta' }, budget: 100 }),
      makeProjectSummary({ id: 'p2', client: { id: 'a', name: 'Alfa' }, budget: 100 }),
    ]);

    expect(result.map((entry) => entry.clientName)).toEqual(['Alfa', 'Zeta']);
  });
});

describe('horas por projeto (RF08)', () => {
  it('ordena da maior para a menor carga', () => {
    const result = topProjectsByHours([
      makeProjectSummary({ id: 'p1', name: 'Alfa', hoursWorked: 100 }),
      makeProjectSummary({ id: 'p2', name: 'Beta', hoursWorked: 900 }),
      makeProjectSummary({ id: 'p3', name: 'Gama', hoursWorked: 400 }),
    ]);

    expect(result.map((entry) => entry.projectName)).toEqual(['Beta', 'Gama', 'Alfa']);
    expect(result[0]).toEqual({ projectId: 'p2', projectName: 'Beta', hours: 900 });
  });

  // Armadilha A-006: barra de altura zero não informa nada e ocupa o eixo.
  it('deixa de fora projeto sem apontamento', () => {
    const result = topProjectsByHours([
      makeProjectSummary({ id: 'p1', name: 'Alfa', hoursWorked: 0 }),
      makeProjectSummary({ id: 'p2', name: 'Beta', hoursWorked: 10 }),
    ]);

    expect(result.map((entry) => entry.projectName)).toEqual(['Beta']);
  });

  it('corta no limite pedido, mantendo os maiores', () => {
    const projects = [10, 50, 30, 20].map((hours, index) =>
      makeProjectSummary({ id: `p${index}`, name: `P${index}`, hoursWorked: hours })
    );

    expect(topProjectsByHours(projects, 2).map((entry) => entry.hours)).toEqual([50, 30]);
  });

  it('desempata por nome, para a ordem não variar entre cargas', () => {
    const result = topProjectsByHours([
      makeProjectSummary({ id: 'p1', name: 'Zeta', hoursWorked: 100 }),
      makeProjectSummary({ id: 'p2', name: 'Alfa', hoursWorked: 100 }),
    ]);

    expect(result.map((entry) => entry.projectName)).toEqual(['Alfa', 'Zeta']);
  });

  it('devolve lista vazia sem projeto nenhum', () => {
    expect(topProjectsByHours([])).toEqual([]);
  });
});
