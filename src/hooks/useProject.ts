/**
 * Carrega um projeto (RF05).
 *
 * Ficou pequeno depois da integração (ADR-0007): a API devolve cliente, gestor
 * e equipe já resolvidos e os indicadores calculados, então caiu a carga dos
 * três cadastros que existia só para trocar UUID por nome.
 *
 * Mesma forma dos outros hooks de carga (lição L-004): um estado discriminado,
 * o `setState` só dentro do `.then`/`.catch`, e a flag `active` no cleanup
 * porque a camada de fixture ignora `options.signal`.
 */

import { useCallback, useEffect, useState } from 'react';
import { isHttpError } from '@/services/http';
import { getProject } from '@/services/projects';
import type { Project } from '@/types/project';

const FALLBACK_ERROR = 'Não foi possível carregar o projeto. Tente novamente.';
const MISSING_ID_ERROR = 'Projeto não encontrado.';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; project: Project }
  | { status: 'error'; message: string };

const LOADING: LoadState = { status: 'loading' };

export interface ProjectState {
  project: Project | null;
  isLoading: boolean;
  error: string | null;
  reload: () => void;
}

export function useProject(id: string | undefined): ProjectState {
  const [state, setState] = useState<LoadState>(LOADING);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setState(LOADING);
    setReloadToken((token) => token + 1);
  }, []);

  // Rota sem `:id` não chega a carregar nada; o erro é derivado no retorno, e
  // não com um `setState` no corpo do efeito (L-004).
  const missingId = id === undefined;

  useEffect(() => {
    if (id === undefined) {
      return;
    }

    const controller = new AbortController();
    let active = true;

    getProject(id, { signal: controller.signal })
      .then((project) => {
        if (active) {
          setState({ status: 'ready', project });
        }
      })
      .catch((cause: unknown) => {
        if (!active || isAbort(cause)) {
          return;
        }
        // Inclui o 404 de id inexistente, que chega com mensagem própria da API.
        setState({
          status: 'error',
          message: isHttpError(cause) ? cause.message : FALLBACK_ERROR,
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [id, reloadToken]);

  if (missingId) {
    return { project: null, isLoading: false, error: MISSING_ID_ERROR, reload };
  }

  return {
    project: state.status === 'ready' ? state.project : null,
    isLoading: state.status === 'loading',
    error: state.status === 'error' ? state.message : null,
    reload,
  };
}

function isAbort(cause: unknown): boolean {
  return cause instanceof Error && cause.name === 'AbortError';
}
