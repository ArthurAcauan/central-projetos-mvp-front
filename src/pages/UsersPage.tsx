/**
 * Usuários (RF01) — lista e cadastro com nome, e-mail e perfil. Layout portado
 * de `Users.tsx` do protótipo.
 *
 * `role` é **campo cadastral**: exibir e cadastrar é o requisito; usar para
 * liberar ou bloquear tela está fora do escopo do MVP (RNF03, armadilha A-007).
 * Não há login: o usuário logado é simulado em `useCurrentUser`.
 *
 * A coluna "Projetos" conta os projetos em que a pessoa é gestora responsável
 * (`managerId`) — derivado, nunca persistido.
 */

import { useMemo, useState } from 'react';
import RegistryLayout from '@/components/registry/RegistryLayout';
import { validateUser, type UserFieldErrors, type UserFormValues } from '@/domain/registryRules';
import { useRegistry } from '@/hooks/useRegistry';
import { formatTimestamp } from '@/lib/format';
import { isHttpError } from '@/services/http';
import { createUser, listUsers } from '@/services/users';
import { userRoleLabels, userRoles, type User, type UserRole } from '@/types/user';

const FALLBACK_ERROR = 'Não foi possível cadastrar o usuário. Tente novamente.';

const BLANK_VALUES: UserFormValues = { name: '', email: '', role: 'GESTOR_PROJETO' };

const NO_ERRORS: UserFieldErrors = {};

/** Cor por perfil, como no protótipo. Só destaca o dado; não muda o que se pode fazer. */
const roleToneClass: Record<UserRole, string> = {
  GERENTE: 'bg-purple-50 text-purple-700 border-purple-200',
  COORDENADOR: 'bg-blue-50 text-blue-700 border-blue-200',
  GESTOR_PROJETO: 'bg-slate-50 text-slate-600 border-slate-200',
};

export default function UsersPage() {
  const { items: users, projects, isLoading, error, reload, addItem } = useRegistry(listUsers);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [values, setValues] = useState<UserFormValues>(BLANK_VALUES);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const errors = useMemo(
    () => (submitAttempted ? validateUser(values, users) : NO_ERRORS),
    [submitAttempted, values, users]
  );

  const managedCountByUser = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects) {
      counts.set(project.manager.id, (counts.get(project.manager.id) ?? 0) + 1);
    }
    return counts;
  }, [projects]);

  function change<K extends keyof UserFormValues>(field: K, value: UserFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function toggleForm() {
    setIsFormOpen((open) => !open);
    setSubmitAttempted(false);
    setSubmitError(null);
  }

  function handleSubmit() {
    setSubmitAttempted(true);

    const invalid = validateUser(values, users);
    if (Object.keys(invalid).length > 0 || values.role === '') {
      setSubmitError(null);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    createUser({ name: values.name.trim(), email: values.email.trim(), role: values.role })
      .then((user) => {
        addItem(user);
        setValues(BLANK_VALUES);
        setSubmitAttempted(false);
        setIsFormOpen(false);
        setIsSubmitting(false);
        setSuccessMessage(`Usuário "${user.name}" cadastrado.`);
      })
      .catch((cause: unknown) => {
        setIsSubmitting(false);
        setSubmitError(isHttpError(cause) ? cause.message : FALLBACK_ERROR);
      });
  }

  return (
    <RegistryLayout
      error={error}
      form={
        <UserForm
          errors={errors}
          isSubmitting={isSubmitting}
          onChange={change}
          onSubmit={handleSubmit}
          submitError={submitError}
          values={values}
        />
      }
      isFormOpen={isFormOpen}
      isLoading={isLoading}
      newLabel="Novo usuário"
      onRetry={reload}
      onToggleForm={toggleForm}
      subtitle={
        isLoading || error !== null
          ? 'Pessoas cadastradas no sistema'
          : `${users.length} ${users.length === 1 ? 'usuário cadastrado' : 'usuários cadastrados'}`
      }
      successMessage={successMessage}
      title="Usuários"
    >
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <caption className="sr-only">Usuários cadastrados</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-400 uppercase">
              <th className="px-4 py-3 text-left font-medium" scope="col">
                Nome
              </th>
              <th className="px-4 py-3 text-left font-medium" scope="col">
                E-mail
              </th>
              <th className="px-4 py-3 text-left font-medium" scope="col">
                Perfil
              </th>
              <th className="px-4 py-3 text-left font-medium" scope="col">
                Projetos
              </th>
              <th className="px-4 py-3 text-left font-medium" scope="col">
                Cadastrado em
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.length === 0 ? (
              <tr>
                <td className="px-4 py-10 text-center text-sm text-slate-400" colSpan={5}>
                  Nenhum usuário cadastrado.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <UserRow
                  key={user.id}
                  managedCount={managedCountByUser.get(user.id) ?? 0}
                  user={user}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </RegistryLayout>
  );
}

interface UserFormProps {
  values: UserFormValues;
  errors: UserFieldErrors;
  submitError: string | null;
  isSubmitting: boolean;
  onChange: <K extends keyof UserFormValues>(field: K, value: UserFormValues[K]) => void;
  onSubmit: () => void;
}

function UserForm({
  values,
  errors,
  submitError,
  isSubmitting,
  onChange,
  onSubmit,
}: UserFormProps) {
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h2 className="mb-4 font-mono text-xs font-medium tracking-widest text-slate-400 uppercase">
        Novo usuário
      </h2>

      {submitError !== null && (
        <p
          className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {submitError}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField
          error={errors.name}
          id="user-name"
          label="Nome"
          onChange={(value) => onChange('name', value)}
          placeholder="Nome completo"
          value={values.name}
        />
        <TextField
          error={errors.email}
          id="user-email"
          label="E-mail"
          onChange={(value) => onChange('email', value)}
          placeholder="usuario@empresa.com.br"
          type="email"
          value={values.email}
        />
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor="user-role">
            Perfil de acesso
            <span aria-hidden="true" className="ml-0.5 text-red-500">
              *
            </span>
          </label>
          <select
            aria-describedby={errors.role ? 'user-role-error' : undefined}
            aria-invalid={errors.role !== undefined}
            className={inputClass(errors.role)}
            id="user-role"
            onChange={(event) => {
              const value = event.target.value;
              onChange('role', isUserRole(value) ? value : '');
            }}
            value={values.role}
          >
            {userRoles.map((role) => (
              <option key={role} value={role}>
                {userRoleLabels[role]}
              </option>
            ))}
          </select>
          {errors.role && (
            <p className="mt-1 text-xs text-red-600" id="user-role-error">
              {errors.role}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4">
        <button
          className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Salvando...' : 'Cadastrar'}
        </button>
      </div>
    </form>
  );
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  error: string | undefined;
  placeholder: string;
  type?: 'text' | 'email';
  onChange: (value: string) => void;
}

function TextField({ id, label, value, error, placeholder, type, onChange }: TextFieldProps) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor={id}>
        {label}
        <span aria-hidden="true" className="ml-0.5 text-red-500">
          *
        </span>
      </label>
      <input
        aria-describedby={error ? `${id}-error` : undefined}
        aria-invalid={error !== undefined}
        className={inputClass(error)}
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type ?? 'text'}
        value={value}
      />
      {error && (
        <p className="mt-1 text-xs text-red-600" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

function UserRow({ user, managedCount }: { user: User; managedCount: number }) {
  return (
    <tr className="transition-colors hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700"
          >
            {initialsOf(user.name)}
          </span>
          <span className="font-medium text-slate-800">{user.name}</span>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-500">{user.email}</td>
      <td className="px-4 py-3">
        <span
          className={`rounded border px-2 py-0.5 font-mono text-[11px] ${roleToneClass[user.role]}`}
        >
          {userRoleLabels[user.role]}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
          {managedCount} {managedCount === 1 ? 'projeto' : 'projetos'}
        </span>
      </td>
      <td className="px-4 py-3 font-mono text-xs text-slate-400">
        {formatTimestamp(user.createdAt)}
      </td>
    </tr>
  );
}

function inputClass(error: string | undefined): string {
  return `w-full rounded border bg-white px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
    error ? 'border-red-400' : 'border-slate-200'
  }`;
}

/** O DOM entrega `string`; sem o guarda a única saída seria um `as` cego. */
function isUserRole(value: string): value is UserRole {
  return userRoles.some((role) => role === value);
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
