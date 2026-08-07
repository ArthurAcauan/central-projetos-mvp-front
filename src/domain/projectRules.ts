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
import {
  isTerminalStatus,
  projectStatusLabel,
  projectStatuses,
  type ProjectInput,
  type ProjectStatus,
} from '@/types/project';

/** Limites do contrato da API (`context/CONTRATO_API.md`, `POST /projects`). */
const MAX_NAME_LENGTH = 150;
const MAX_CURRENCY = { value: 9_999_999_999_999.99, label: 'R$ 9.999.999.999.999,99' };
const MAX_HOURS = { value: 99_999_999.99, label: '99.999.999,99 horas' };

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
 * Contexto da edição, quando há. Ausente no cadastro.
 *
 * Serve para as regras que dependem do estado atual do projeto — hoje só a
 * transição de status: encerrado não reabre.
 */
export interface ProjectValidationContext {
  /** Status gravado no projeto que está sendo editado. */
  currentStatus: string;
}

/**
 * Aplica RN01–RN06 e devolve um erro por campo. Objeto vazio = pode salvar.
 *
 * Os limites de tamanho e de casas decimais espelham o que a API valida
 * (`context/CONTRATO_API.md`, seção `POST /projects`). Repetir aqui não é
 * desconfiança do backend: é a diferença entre a pessoa ver o erro no campo
 * enquanto digita e ver um 400 depois de submeter.
 */
export function validateProject(
  values: ProjectFormValues,
  context?: ProjectValidationContext
): ProjectFieldErrors {
  const errors: ProjectFieldErrors = {};

  // Campos obrigatórios (RN06; `name` é NOT NULL na modelagem).
  if (isBlank(values.name)) {
    errors.name = 'Informe o nome do projeto.';
  } else if (values.name.trim().length > MAX_NAME_LENGTH) {
    errors.name = `O nome deve ter no máximo ${MAX_NAME_LENGTH} caracteres.`;
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
  } else if (
    context !== undefined &&
    isTerminalStatus(context.currentStatus) &&
    values.status !== context.currentStatus
  ) {
    // Encerrado não reabre: a API responde 400 (RN07 do backend). O `<select>`
    // já não oferece a troca; esta é a rede caso ela chegue por outro caminho.
    errors.status = `Projeto ${projectStatusLabel(context.currentStatus).toLowerCase()} não pode voltar para outro status.`;
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

  // Valores numéricos (RN01, RN02, RN04) e os limites do contrato.
  const budgetError = validateAmount(values.budget, 'Informe o orçamento previsto.', MAX_CURRENCY);
  if (budgetError) {
    errors.budget = budgetError;
  }
  const budgetSpentError = validateAmount(
    values.budgetSpent,
    'Informe o orçamento consumido (use 0 se ainda não houve consumo).',
    MAX_CURRENCY
  );
  if (budgetSpentError) {
    errors.budgetSpent = budgetSpentError;
  }
  const hoursWorkedError = validateAmount(
    values.hoursWorked,
    'Informe as horas realizadas (use 0 se ainda não houve apontamento).',
    MAX_HOURS
  );
  if (hoursWorkedError) {
    errors.hoursWorked = hoursWorkedError;
  }

  return errors;
}

/** Atalho de leitura para o formulário: nenhum erro impede o salvamento. */
export function isProjectValid(
  values: ProjectFormValues,
  context?: ProjectValidationContext
): boolean {
  return Object.keys(validateProject(values, context)).length === 0;
}

/**
 * Status que o `<select>` deve oferecer. Em projeto encerrado, só o próprio —
 * as demais opções seriam 400 na API, e opção que não funciona não é opção.
 */
export function selectableStatuses(currentStatus?: string): readonly ProjectStatus[] {
  if (currentStatus !== undefined && isTerminalStatus(currentStatus)) {
    return projectStatuses.filter((status) => status === currentStatus);
  }
  return projectStatuses;
}

/**
 * Valores do formulário → payload de criação/atualização (RF03, RF06).
 *
 * Devolve `null` exatamente quando {@link validateProject} acusa erro: é a
 * mesma regra decidindo as duas coisas, e o chamador não precisa de `as` nem de
 * `!` para tirar o `null` dos números. Cadastro e edição compartilham esta
 * conversão para não divergirem no tratamento de espaço em branco.
 */
export function toProjectInput(
  values: ProjectFormValues,
  context?: ProjectValidationContext
): ProjectInput | null {
  if (!isProjectValid(values, context)) {
    return null;
  }
  // Depois de validado, os três números existem e o status foi escolhido.
  const { budget, budgetSpent, hoursWorked, status } = values;
  if (budget === null || budgetSpent === null || hoursWorked === null || status === '') {
    return null;
  }

  const observations = values.observations.trim();
  return {
    name: values.name.trim(),
    clientId: values.clientId,
    objective: values.objective.trim(),
    managerId: values.managerId,
    teamId: values.teamId,
    startDate: values.startDate,
    deadline: values.deadline,
    budget,
    budgetSpent,
    hoursWorked,
    status,
    // Coluna anulável: observação em branco é ausência, não string vazia.
    observations: observations === '' ? null : observations,
  };
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

/**
 * `null` (campo vazio), `NaN` e negativo são inválidos; zero é válido (RN01,
 * RN02, RN04). Teto e casas decimais vêm dos limites da coluna `NUMERIC` no
 * backend — passar disso é 400, e a mensagem genérica da API não diria qual
 * campo estourou.
 */
function validateAmount(
  value: number | null,
  requiredMessage: string,
  max: { value: number; label: string }
): string | null {
  if (value === null || Number.isNaN(value)) {
    return requiredMessage;
  }
  if (value < 0) {
    return 'O valor não pode ser negativo.';
  }
  if (value > max.value) {
    return `O valor não pode passar de ${max.label}.`;
  }
  if (hasMoreThanTwoDecimals(value)) {
    return 'Use no máximo duas casas decimais.';
  }
  return null;
}

/**
 * `Math.round(v * 100) / 100 !== v` bastaria em teoria, mas erra em ponto
 * flutuante para valores grandes. Contar as casas no texto é exato para o que
 * um formulário produz.
 */
function hasMoreThanTwoDecimals(value: number): boolean {
  const decimals = String(value).split('.')[1];
  return decimals !== undefined && !decimals.includes('e') && decimals.length > 2;
}
