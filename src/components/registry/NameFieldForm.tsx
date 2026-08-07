/**
 * Formulário de um campo só — cliente (RF02) e equipe têm apenas `name` na
 * modelagem, e é o cadastro inteiro.
 *
 * Componente controlado e sem regra: quem valida é `domain/registryRules.ts`.
 * `<form onSubmit>` de verdade, para o Enter cadastrar sem precisar do
 * `onKeyDown` manual que o protótipo usa.
 */

import type { FormEvent } from 'react';

export interface NameFieldFormProps {
  /** Título da seção. Ex.: "Novo cliente". */
  legend: string;
  label: string;
  placeholder: string;
  value: string;
  /** Erro do campo, vindo do domínio. */
  error: string | null;
  /** Falha da chamada ao serviço, acima do campo. */
  submitError: string | null;
  isSubmitting: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export default function NameFieldForm({
  legend,
  label,
  placeholder,
  value,
  error,
  submitError,
  isSubmitting,
  onChange,
  onSubmit,
}: NameFieldFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  const inputId = 'registry-name';
  const errorId = `${inputId}-error`;

  return (
    <form noValidate onSubmit={handleSubmit}>
      <h2 className="mb-4 font-mono text-xs font-medium tracking-widest text-slate-400 uppercase">
        {legend}
      </h2>

      {submitError !== null && (
        <p
          className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {submitError}
        </p>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600" htmlFor={inputId}>
            {label}
            <span aria-hidden="true" className="ml-0.5 text-red-500">
              *
            </span>
          </label>
          <input
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error !== null}
            className={`w-full rounded border bg-white px-3 py-2 text-sm outline-none focus:border-transparent focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-400' : 'border-slate-200'
            }`}
            id={inputId}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            type="text"
            value={value}
          />
          {error !== null && (
            <p className="mt-1 text-xs text-red-600" id={errorId}>
              {error}
            </p>
          )}
        </div>
        <button
          className="shrink-0 rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Salvando...' : 'Cadastrar'}
        </button>
      </div>
    </form>
  );
}
