/**
 * Regras de negócio do cadastro de projeto — RN01 a RN06 (RF03, RF06).
 *
 * Módulo puro, sem React: o formulário de F2-3/F2-4 renderiza as mensagens daqui
 * em vez de reimplementar as regras. Mensagens em pt-BR porque são texto de
 * interface e precisam ser consistentes entre cadastro e edição.
 *
 * O que **não** está aqui: estouro de orçamento não é erro. RN03 exige que
 * `budgetSpent > budget` seja possível para o dashboard evidenciar — vira aviso
 * em {@link projectWarnings}, nunca bloqueio (armadilha A-003).
 */

import { parseCalendarDate } from '@/domain/indicators';
import type { ProjectStatus } from '@/types/project';

/**
 * Valores do formulário de projeto, ainda não validados: número pode estar
 * vazio (`null`) e status pode estar sem escolha (`''`) enquanto o usuário
 * preenche. Depois de validado, vira o payload que `services/` envia.
 */
export interface ProjectFormValues {
  name: string;
  clientId: string;
  objective: string;
  managerId: string;
  teamId: string;
  /** Data de calendário `YYYY-MM-DD`. */
  startDate: string;
  deadline: string;
  budget: number | null;
  budgetSpent: number | null;
  hoursWorked: number | null;
  status: ProjectStatus | '';
  observations: string;
}

/** Erros por campo. Ausência de chave = campo válido. */
export type ProjectFieldErrors = Partial<Record<keyof ProjectFormValues, string>>;

/**
 * Aplica RN01–RN06 e devolve um erro por campo. Objeto vazio = pode salvar.
 */
export function validateProject(values: ProjectFormValues): ProjectFieldErrors {
  const errors: ProjectFieldErrors = {};

  // Campos obrigatórios (RN06; `name` é NOT NULL na modelagem).
  if (isBlank(values.name)) {
    errors.name = 'Informe o nome do projeto.';
  }
  if (isBlank(values.clientId)) {
    errors.clientId = 'Selecione o cliente.';
  }
  if (isBlank(values.objective)) {
    errors.objective = 'Informe o objetivo do projeto.';
  }
  if (isBlank(values.managerId)) {
    errors.managerId = 'Selecione o gestor responsável.';
  }
  if (isBlank(values.teamId)) {
    errors.teamId = 'Selecione a equipe responsável.';
  }
  if (values.status === '') {
    errors.status = 'Selecione o status do projeto.';
  }

  // Datas (RN05, e RN06 quanto à obrigatoriedade da data de início).
  const startDate = parseCalendarDate(values.startDate);
  if (isBlank(values.startDate)) {
    errors.startDate = 'Informe a data de início.';
  } else if (startDate === null) {
    errors.startDate = 'Data de início inválida.';
  }

  const deadline = parseCalendarDate(values.deadline);
  if (isBlank(values.deadline)) {
    errors.deadline = 'Informe o prazo previsto.';
  } else if (deadline === null) {
    errors.deadline = 'Prazo previsto inválido.';
  } else if (startDate !== null && deadline.getTime() < startDate.getTime()) {
    errors.deadline = 'O prazo previsto não pode ser anterior à data de início.';
  }

  // Valores numéricos (RN01, RN02, RN04).
  const budgetError = validateNonNegative(values.budget, 'Informe o orçamento previsto.');
  if (budgetError) {
    errors.budget = budgetError;
  }
  const budgetSpentError = validateNonNegative(
    values.budgetSpent,
    'Informe o orçamento consumido (use 0 se ainda não houve consumo).'
  );
  if (budgetSpentError) {
    errors.budgetSpent = budgetSpentError;
  }
  const hoursWorkedError = validateNonNegative(
    values.hoursWorked,
    'Informe as horas realizadas (use 0 se ainda não houve apontamento).'
  );
  if (hoursWorkedError) {
    errors.hoursWorked = hoursWorkedError;
  }

  return errors;
}

/** Atalho de leitura para o formulário: nenhum erro impede o salvamento. */
export function isProjectValid(values: ProjectFormValues): boolean {
  return Object.keys(validateProject(values)).length === 0;
}

/**
 * Avisos que **não** impedem salvar. Hoje só o estouro de orçamento (RN03),
 * que precisa ser visível no cadastro e evidenciado no dashboard.
 */
export function projectWarnings(values: ProjectFormValues): string[] {
  const warnings: string[] = [];
  if (values.budget !== null && values.budgetSpent !== null && values.budgetSpent > values.budget) {
    warnings.push('O orçamento consumido está acima do previsto. O projeto pode ser salvo assim.');
  }
  return warnings;
}

function isBlank(value: string): boolean {
  return value.trim() === '';
}

/** `null` (campo vazio), `NaN` e negativo são inválidos; zero é válido. */
function validateNonNegative(value: number | null, requiredMessage: string): string | null {
  if (value === null || Number.isNaN(value)) {
    return requiredMessage;
  }
  if (value < 0) {
    return 'O valor não pode ser negativo.';
  }
  return null;
}
