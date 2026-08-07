/**
 * Casca das três telas de cadastro auxiliar — clientes (RF02), equipes e
 * usuários (RF01).
 *
 * As três têm a mesma estrutura no protótipo: título com contagem, botão que
 * abre o formulário, confirmação do cadastro, e a listagem abaixo. Só a
 * listagem e os campos mudam — e são o que vem por prop. Sem isto, a mesma
 * casca existiria em triplicata e cada correção precisaria ser feita três vezes.
 *
 * Componente de apresentação: não carrega, não valida e não salva.
 */

import type { ReactNode } from 'react';

export interface RegistryLayoutProps {
  title: string;
  /** Ex.: "12 clientes cadastrados". Já formatado pela tela. */
  subtitle: string;
  /** Rótulo do botão que abre o formulário. Ex.: "Novo cliente". */
  newLabel: string;
  isFormOpen: boolean;
  onToggleForm: () => void;
  /** Campos do cadastro. Renderizado só com o formulário aberto. */
  form: ReactNode;
  /** Confirmação do último cadastro, ou `null`. */
  successMessage: string | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  /** A listagem — tabela ou cards, conforme a tela. */
  children: ReactNode;
}

export default function RegistryLayout({
  title,
  subtitle,
  newLabel,
  isFormOpen,
  onToggleForm,
  form,
  successMessage,
  isLoading,
  error,
  onRetry,
  children,
}: RegistryLayoutProps) {
  return (
    <div className="flex-1 overflow-auto p-4 sm:p-6">
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p aria-live="polite" className="mt-0.5 font-mono text-sm text-slate-500">
            {subtitle}
          </p>
        </div>
        <button
          className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
            isFormOpen
              ? 'border border-slate-200 text-slate-600 hover:border-slate-300'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
          disabled={isLoading || error !== null}
          onClick={onToggleForm}
          type="button"
        >
          {isFormOpen ? 'Cancelar' : newLabel}
        </button>
      </header>

      {/* `role="status"` para o cadastro ser anunciado: quem não vê a lista
          crescer não teria como saber que deu certo. */}
      {successMessage !== null && (
        <p
          className="mb-4 rounded border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700"
          role="status"
        >
          {successMessage}
        </p>
      )}

      {isFormOpen && !isLoading && error === null && (
        <div className="mb-5 rounded-lg border border-slate-200 bg-white p-5">{form}</div>
      )}

      {isLoading && (
        <p
          className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500"
          role="status"
        >
          Carregando...
        </p>
      )}

      {!isLoading && error !== null && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center"
          role="alert"
        >
          <p className="text-sm text-red-700">{error}</p>
          <button
            className="mt-3 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            onClick={onRetry}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!isLoading && error === null && children}
    </div>
  );
}
