import { describe, expect, it } from 'vitest';
import {
  isProjectValid,
  projectWarnings,
  toProjectInput,
  validateProject,
  type ProjectFormValues,
} from '@/domain/projectRules';

function makeValues(overrides: Partial<ProjectFormValues> = {}): ProjectFormValues {
  return {
    name: 'Portal do Cliente',
    clientId: 'c1',
    objective: 'Centralizar o atendimento em um canal único.',
    managerId: 'u1',
    teamId: 't1',
    startDate: '2026-01-01',
    deadline: '2026-12-31',
    budget: 100_000,
    budgetSpent: 25_000,
    hoursWorked: 120,
    status: 'EM_ANDAMENTO',
    observations: '',
    ...overrides,
  };
}

describe('campos obrigatórios (RN06)', () => {
  it('aceita um projeto completo', () => {
    expect(validateProject(makeValues())).toEqual({});
    expect(isProjectValid(makeValues())).toBe(true);
  });

  it('cobra cliente, gestor, equipe, objetivo, data de início, prazo, orçamento e status', () => {
    const errors = validateProject(
      makeValues({
        name: '   ',
        clientId: '',
        objective: '',
        managerId: '',
        teamId: '',
        startDate: '',
        deadline: '',
        budget: null,
        status: '',
      })
    );

    expect(Object.keys(errors).sort()).toEqual(
      [
        'budget',
        'clientId',
        'deadline',
        'managerId',
        'name',
        'objective',
        'startDate',
        'status',
        'teamId',
      ].sort()
    );
  });

  it('observações continuam opcionais', () => {
    expect(validateProject(makeValues({ observations: '' }))).toEqual({});
  });
});

describe('valores numéricos (RN01, RN02, RN04)', () => {
  it('aceita zero em orçamento, consumido e horas', () => {
    expect(validateProject(makeValues({ budget: 0, budgetSpent: 0, hoursWorked: 0 }))).toEqual({});
  });

  it('rejeita orçamento previsto negativo (RN01)', () => {
    expect(validateProject(makeValues({ budget: -1 })).budget).toBe(
      'O valor não pode ser negativo.'
    );
  });

  it('rejeita orçamento consumido negativo (RN02)', () => {
    expect(validateProject(makeValues({ budgetSpent: -0.01 })).budgetSpent).toBe(
      'O valor não pode ser negativo.'
    );
  });

  it('rejeita horas realizadas negativas (RN04)', () => {
    expect(validateProject(makeValues({ hoursWorked: -8 })).hoursWorked).toBe(
      'O valor não pode ser negativo.'
    );
  });

  it('trata campo numérico vazio como obrigatório, sem virar NaN', () => {
    const errors = validateProject(makeValues({ budgetSpent: null, hoursWorked: Number.NaN }));

    expect(errors.budgetSpent).toContain('orçamento consumido');
    expect(errors.hoursWorked).toContain('horas realizadas');
  });
});

describe('datas (RN05)', () => {
  it('rejeita prazo anterior à data de início', () => {
    const errors = validateProject(makeValues({ startDate: '2026-06-10', deadline: '2026-06-09' }));

    expect(errors.deadline).toBe('O prazo previsto não pode ser anterior à data de início.');
  });

  it('aceita prazo igual à data de início', () => {
    expect(
      validateProject(makeValues({ startDate: '2026-06-10', deadline: '2026-06-10' }))
    ).toEqual({});
  });

  it('rejeita data que não existe no calendário', () => {
    const errors = validateProject(makeValues({ startDate: '2026-02-31' }));

    expect(errors.startDate).toBe('Data de início inválida.');
  });
});

describe('estouro de orçamento (RN03, armadilha A-003)', () => {
  const estourado = makeValues({ budget: 100_000, budgetSpent: 150_000 });

  it('NÃO impede o salvamento', () => {
    expect(validateProject(estourado)).toEqual({});
    expect(isProjectValid(estourado)).toBe(true);
  });

  it('avisa que o consumido passou do previsto', () => {
    expect(projectWarnings(estourado)).toEqual([
      'O orçamento consumido está acima do previsto. O projeto pode ser salvo assim.',
    ]);
  });

  it('não avisa quando o consumo está dentro do previsto', () => {
    expect(projectWarnings(makeValues())).toEqual([]);
    expect(projectWarnings(makeValues({ budget: 100, budgetSpent: 100 }))).toEqual([]);
  });

  it('não avisa com campo ainda em branco', () => {
    expect(projectWarnings(makeValues({ budget: null, budgetSpent: 10 }))).toEqual([]);
  });
});

describe('conversão para o payload de cadastro/edição (RF03, RF06)', () => {
  it('devolve o projeto em camelCase, com os números já resolvidos', () => {
    expect(toProjectInput(makeValues())).toEqual({
      name: 'Portal do Cliente',
      clientId: 'c1',
      objective: 'Centralizar o atendimento em um canal único.',
      managerId: 'u1',
      teamId: 't1',
      startDate: '2026-01-01',
      deadline: '2026-12-31',
      budget: 100_000,
      budgetSpent: 25_000,
      hoursWorked: 120,
      status: 'EM_ANDAMENTO',
      observations: null,
    });
  });

  it('apara espaços dos textos livres', () => {
    const input = toProjectInput(
      makeValues({ name: '  Portal  ', objective: ' Objetivo ', observations: '  Nota  ' })
    );

    expect(input).toMatchObject({ name: 'Portal', objective: 'Objetivo', observations: 'Nota' });
  });

  it('trata observação só com espaços como ausência, não como texto vazio', () => {
    expect(toProjectInput(makeValues({ observations: '   ' }))?.observations).toBeNull();
  });

  it('converte o projeto com estouro de orçamento, que é válido (RN03)', () => {
    expect(toProjectInput(makeValues({ budget: 100, budgetSpent: 500 }))).not.toBeNull();
  });

  it('devolve null exatamente quando a validação acusa erro', () => {
    expect(toProjectInput(makeValues({ clientId: '' }))).toBeNull();
    expect(toProjectInput(makeValues({ budget: null }))).toBeNull();
    expect(toProjectInput(makeValues({ status: '' }))).toBeNull();
    expect(toProjectInput(makeValues({ hoursWorked: -1 }))).toBeNull();
  });
});
