/**
 * Formulário de projeto — layout portado de `ProjectForm.tsx` do protótipo.
 *
 * Componente **controlado e sem regra**: recebe valores, erros e avisos prontos
 * e devolve mudanças. Quem valida é `domain/projectRules.ts`; reimplementar
 * qualquer verificação aqui seria a armadilha A-005 na sua versão de formulário.
 *
 * Nasce reutilizável pelo cadastro (F2-3) e pela edição (F2-4): o que muda entre
 * os dois é o rótulo do botão e os valores iniciais, ambos vindos por prop.
 *
 * O protótipo declara o subcomponente `Field` dentro do corpo do componente, o
 * que remonta cada campo a cada tecla digitada e faz o input perder o foco.
 * Aqui ele é de módulo.
 */

import type { FormEvent, ReactNode } from 'react';
import type { ProjectFieldErrors, ProjectFormValues } from '@/domain/projectRules';
import { selectableStatuses } from '@/domain/projectRules';
import type { Client } from '@/types/client';
import { isProjectStatus, projectStatusLabels } from '@/types/project';
import type { Team } from '@/types/team';
import type { User } from '@/types/user';

export interface ProjectFormProps {
  values: ProjectFormValues;
  /** Erros de `validateProject`. Vazio enquanto o usuário não tentou salvar. */
  errors: ProjectFieldErrors;
  /** Avisos de `projectWarnings` — não impedem salvar (RN03). */
  warnings: string[];
  clients: Client[];
  users: User[];
  teams: Team[];
  isSubmitting: boolean;
  /** "Cadastrar projeto" em F2-3, "Salvar alterações" em F2-4. */
  submitLabel: string;
  /**
   * Status gravado no projeto em edição. Ausente no cadastro. Serve para não
   * oferecer troca de status em projeto encerrado, que a API recusa com 400.
   */
  currentStatus?: string;
  onChange: <K extends keyof ProjectFormValues>(field: K, value: ProjectFormValues[K]) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function ProjectForm({
  values,
  errors,
  warnings,
  clients,
  users,
  teams,
  isSubmitting,
  submitLabel,
  currentStatus,
  onChange,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  // Em projeto encerrado sobra só o próprio status: opção que responde 400 não
  // é opção, e descobrir isso ao salvar seria pior do que não ver a opção.
  const statusOptions = selectableStatuses(currentStatus);
  const statusLocked = statusOptions.length === 1;
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Submit nativo (em vez do `onClick` do protótipo) para o Enter funcionar e
    // o leitor de tela anunciar o conjunto como formulário.
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="max-w-3xl space-y-4" noValidate onSubmit={handleSubmit}>
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <SectionTitle>Informações básicas</SectionTitle>
        <div className="grid grid-cols-1 gap-4">
          <Field error={errors.name} id="project-name" label="Nome do projeto" required>
            <input
              {...fieldProps('project-name', errors.name)}
              onChange={(event) => onChange('name', event.target.value)}
              placeholder="Ex.: Plataforma de Open Banking"
              type="text"
              value={values.name}
            />
          </Field>

          <Field error={errors.objective} id="project-objective" label="Objetivo" required>
            <textarea
              {...fieldProps('project-objective', errors.objective)}
              onChange={(event) => onChange('objective', event.target.value)}
              placeholder="Descreva o objetivo do projeto..."
              rows={3}
              value={values.objective}
            />
          </Field>

          <Field error={errors.observations} id="project-observations" label="Observações">
            <textarea
              {...fieldProps('project-observations', errors.observations)}
              onChange={(event) => onChange('observations', event.target.value)}
              placeholder="Informações adicionais (opcional)"
              rows={2}
              value={values.observations}
            />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <SectionTitle>Responsáveis</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field error={errors.clientId} id="project-client" label="Cliente" required>
            <select
              {...fieldProps('project-client', errors.clientId)}
              onChange={(event) => onChange('clientId', event.target.value)}
              value={values.clientId}
            >
              <option value="">Selecione...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </Field>

          <Field error={errors.managerId} id="project-manager" label="Gestor responsável" required>
            <select
              {...fieldProps('project-manager', errors.managerId)}
              onChange={(event) => onChange('managerId', event.target.value)}
              value={values.managerId}
            >
              <option value="">Selecione...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </Field>

          <Field error={errors.teamId} id="project-team" label="Equipe" required>
            <select
              {...fieldProps('project-team', errors.teamId)}
              onChange={(event) => onChange('teamId', event.target.value)}
              value={values.teamId}
            >
              <option value="">Selecione...</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <SectionTitle>Prazo e status</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field error={errors.startDate} id="project-start-date" label="Data de início" required>
            <input
              {...fieldProps('project-start-date', errors.startDate)}
              onChange={(event) => onChange('startDate', event.target.value)}
              type="date"
              value={values.startDate}
            />
          </Field>

          <Field error={errors.deadline} id="project-deadline" label="Prazo previsto" required>
            <input
              {...fieldProps('project-deadline', errors.deadline)}
              onChange={(event) => onChange('deadline', event.target.value)}
              type="date"
              value={values.deadline}
            />
          </Field>

          <Field error={errors.status} id="project-status" label="Status" required>
            <select
              {...fieldProps('project-status', errors.status)}
              onChange={(event) => {
                const value = event.target.value;
                // O DOM entrega `string`; o guarda de tipo evita um `as` cego.
                onChange('status', isProjectStatus(value) ? value : '');
              }}
              value={values.status}
            >
              {!statusLocked && <option value="">Selecione...</option>}
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {projectStatusLabels[status]}
                </option>
              ))}
            </select>
            {statusLocked && (
              <p className="mt-1 text-xs text-slate-500">
                Projeto encerrado: o status não pode ser alterado.
              </p>
            )}
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <SectionTitle>Financeiro e horas</SectionTitle>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field error={errors.budget} id="project-budget" label="Orçamento previsto (R$)" required>
            <input
              {...fieldProps('project-budget', errors.budget)}
              min="0"
              onChange={(event) => onChange('budget', toNumberValue(event.target.value))}
              placeholder="0,00"
              step="0.01"
              type="number"
              value={toInputValue(values.budget)}
            />
          </Field>

          <Field
            error={errors.budgetSpent}
            id="project-budget-spent"
            label="Orçamento consumido (R$)"
            required
          >
            <input
              {...fieldProps('project-budget-spent', errors.budgetSpent)}
              min="0"
              onChange={(event) => onChange('budgetSpent', toNumberValue(event.target.value))}
              placeholder="0,00"
              step="0.01"
              type="number"
              value={toInputValue(values.budgetSpent)}
            />
          </Field>

          <Field
            error={errors.hoursWorked}
            id="project-hours-worked"
            label="Horas realizadas"
            required
          >
            <input
              {...fieldProps('project-hours-worked', errors.hoursWorked)}
              min="0"
              onChange={(event) => onChange('hoursWorked', toNumberValue(event.target.value))}
              placeholder="0"
              step="0.5"
              type="number"
              value={toInputValue(values.hoursWorked)}
            />
          </Field>
        </div>

        {/* Estouro de orçamento é aviso, nunca erro que impede salvar (RN03, A-003). */}
        {warnings.length > 0 && (
          <ul className="mt-3 space-y-1 font-mono text-xs text-orange-600">
            {warnings.map((warning) => (
              <li key={warning}>Atenção: {warning}</li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex gap-3 pb-6">
        <button
          className="rounded bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Salvando...' : submitLabel}
        </button>
        <button
          className="rounded border border-slate-200 px-6 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300"
          disabled={isSubmitting}
          onClick={onCancel}
          type="button"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 font-mono text-xs font-medium tracking-widest text-slate-500 uppercase">
      {children}
    </h2>
  );
}

interface FieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

function Field({ id, label, required, error, children }: FieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor={id}>
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red-500">
            *
          </span>
        )}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-red-600" id={errorId(id)}>
          {error}
        </p>
      )}
    </div>
  );
}

/** Amarra input, estado de erro e mensagem — a parte que é fácil esquecer em um campo. */
function fieldProps(id: string, error: string | undefined) {
  return {
    'aria-describedby': error ? errorId(id) : undefined,
    'aria-invalid': error !== undefined,
    className: `w-full rounded border bg-white px-3 py-2 text-sm transition-shadow outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
      error ? 'border-red-400' : 'border-slate-200'
    }`,
    id,
  };
}

function errorId(id: string): string {
  return `${id}-error`;
}

/**
 * `<input type="number">` entrega `string`. Tradução de DOM, não regra: campo
 * vazio é `null` (a validação decide se falta), e o resto vira número —
 * inclusive negativo, que precisa chegar em `validateProject` para ser recusado
 * lá, e não silenciosamente aqui.
 */
function toNumberValue(raw: string): number | null {
  return raw.trim() === '' ? null : Number(raw);
}

function toInputValue(value: number | null): string {
  // `NaN` sai como campo vazio: exibir "NaN" seria pior do que a mensagem de
  // obrigatório que a validação já produz para esse mesmo valor.
  return value === null || Number.isNaN(value) ? '' : String(value);
}
