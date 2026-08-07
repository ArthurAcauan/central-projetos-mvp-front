/**
 * Estado de edição do formulário de projeto, compartilhado por cadastro (F2-3)
 * e atualização (F2-4).
 *
 * O que muda entre as duas telas é o valor inicial e a chamada de serviço —
 * ambos vêm por parâmetro. O resto (quando mostrar erro, quando avisar, o que
 * fazer enquanto salva) é idêntico e, duplicado, divergiria: uma tela passaria
 * a bloquear o estouro de orçamento que a outra aceita (RN03, armadilha A-003).
 *
 * Este hook **não** valida: só chama `domain/projectRules.ts`.
 *
 * `initialValues` é lido uma única vez, na montagem. Quem edita deve montar o
 * componente só depois de ter o projeto em mãos (e trocar a `key` se o id
 * mudar) — assim o preenchimento inicial não precisa de um `setState` dentro de
 * efeito, que o lint reprova (lição L-004).
 */

import { useMemo, useState } from 'react';
import {
  projectWarnings,
  toProjectInput,
  validateProject,
  type ProjectFieldErrors,
  type ProjectFormValues,
  type ProjectValidationContext,
} from '@/domain/projectRules';
import { isHttpError } from '@/services/http';
import { isProjectStatus, type Project, type ProjectInput } from '@/types/project';

const NO_ERRORS: ProjectFieldErrors = {};

export interface ProjectFormStateOptions {
  initialValues: ProjectFormValues;
  /** `createProject` em F2-3, `updateProject(id, …)` em F2-4. */
  save: (input: ProjectInput) => Promise<Project>;
  onSaved: (saved: Project) => void;
  /** Mensagem quando a falha não é um `HttpError` com texto próprio. */
  fallbackError: string;
  /**
   * Status gravado no projeto em edição. Ausente no cadastro. Vem como string
   * solta, e não como objeto, para a identidade ficar estável entre renders —
   * um objeto literal novo a cada render invalidaria o `useMemo` dos erros.
   */
  currentStatus?: string;
}

export interface ProjectFormState {
  values: ProjectFormValues;
  /** Vazio até a primeira tentativa de salvar: a tela não nasce vermelha. */
  errors: ProjectFieldErrors;
  /** Avisos que não impedem salvar (RN03). Aparecem enquanto se digita. */
  warnings: string[];
  isSubmitting: boolean;
  submitError: string | null;
  change: <K extends keyof ProjectFormValues>(field: K, value: ProjectFormValues[K]) => void;
  submit: () => void;
}

export function useProjectFormState({
  initialValues,
  save,
  onSaved,
  fallbackError,
  currentStatus,
}: ProjectFormStateOptions): ProjectFormState {
  const [values, setValues] = useState<ProjectFormValues>(initialValues);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const context: ProjectValidationContext | undefined = useMemo(
    () => (currentStatus === undefined ? undefined : { currentStatus }),
    [currentStatus]
  );

  const errors = useMemo(
    () => (submitAttempted ? validateProject(values, context) : NO_ERRORS),
    [submitAttempted, values, context]
  );
  const warnings = useMemo(() => projectWarnings(values), [values]);

  function change<K extends keyof ProjectFormValues>(field: K, value: ProjectFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function submit() {
    setSubmitAttempted(true);

    const input = toProjectInput(values, context);
    if (input === null) {
      // Inválido: os erros por campo já estão na tela pelo `submitAttempted`.
      setSubmitError(null);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    save(input)
      .then(onSaved)
      .catch((cause: unknown) => {
        setIsSubmitting(false);
        // Valores preservados: refazer o preenchimento seria o pior desfecho.
        setSubmitError(isHttpError(cause) ? cause.message : fallbackError);
      });
  }

  return { values, errors, warnings, isSubmitting, submitError, change, submit };
}

/**
 * Projeto existente → valores do formulário (F2-4).
 *
 * As relações voltam a ser id solto: é o que o payload aceita, e o objeto que
 * o `GET` devolve não é aceito de volta pelo `PUT`.
 *
 * `status` vem da API como `string` e o formulário só trabalha com a união
 * fechada. Valor não canônico — que a API expõe de propósito para denunciar
 * dado corrompido — vira `''`, e a validação cobra a escolha de um status
 * válido em vez de reenviar o valor estranho.
 */
export function toFormValues(project: Project): ProjectFormValues {
  return {
    name: project.name,
    clientId: project.client.id,
    objective: project.objective,
    managerId: project.manager.id,
    teamId: project.team.id,
    startDate: project.startDate,
    deadline: project.deadline,
    budget: project.budget,
    budgetSpent: project.budgetSpent,
    hoursWorked: project.hoursWorked,
    status: isProjectStatus(project.status) ? project.status : '',
    observations: project.observations ?? '',
  };
}
