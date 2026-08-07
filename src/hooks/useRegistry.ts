/**
 * Carga dos cadastros auxiliares — clientes (RF02), equipes e usuários (RF01).
 *
 * As três telas têm a mesma forma: uma lista do recurso e os projetos, usados
 * para mostrar quantos projetos cada cadastro tem. Um hook genérico em vez de
 * três iguais, porque o que muda entre elas é só a função de busca.
 *
 * Mesma forma dos outros hooks de carga (lição L-004): um estado discriminado,
 * `setState` só dentro do `.then`/`.catch`, e a flag `active` no cleanup porque
 * a camada mock ignora `options.signal`.
 */

import { useCallback, useEffect, useState } from 'react';
import { isHttpError, type RequestOptions } from '@/services/http';
import { listProjects } from '@/services/projects';
import type { ProjectSummary } from '@/types/project';

const FALLBACK_ERROR = 'Não foi possível carregar os cadastros. Tente novamente.';

type LoadState<T> =
  | { status: 'loading' }
  | { status: 'ready'; items: T[]; projects: ProjectSummary[] }
  | { status: 'error'; message: string };

export interface RegistryState<T> {
  items: T[];
  /** Projetos, para contar quantos usam cada cadastro. */
  projects: ProjectSummary[];
  isLoading: boolean;
  /** Mensagem pronta para exibição, ou `null` quando a carga deu certo. */
  error: string | null;
  reload: () => void;
  /**
   * Acrescenta o item recém-criado à lista já em tela, sem recarregar tudo. O
   * item vem da resposta do serviço, então é o registro real (com o id do
   * backend) e não uma suposição otimista.
   */
  addItem: (item: T) => void;
}

/**
 * @param load Função de busca do recurso — `listClients`, `listTeams`,
 *   `listUsers`. Precisa ter identidade estável (função de módulo), porque é
 *   dependência do efeito de carga.
 */
export function useRegistry<T>(load: (options?: RequestOptions) => Promise<T[]>): RegistryState<T> {
  const [state, setState] = useState<LoadState<T>>({ status: 'loading' });
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setState({ status: 'loading' });
    setReloadToken((token) => token + 1);
  }, []);

  const addItem = useCallback((item: T) => {
    setState((current) =>
      current.status === 'ready' ? { ...current, items: [...current.items, item] } : current
    );
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    let active = true;

    Promise.all([load(options), listProjects({}, options)])
      .then(([items, projects]) => {
        if (active) {
          setState({ status: 'ready', items, projects });
        }
      })
      .catch((cause: unknown) => {
        if (!active || isAbort(cause)) {
          return;
        }
        setState({
          status: 'error',
          message: isHttpError(cause) ? cause.message : FALLBACK_ERROR,
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [load, reloadToken]);

  return {
    items: state.status === 'ready' ? state.items : [],
    projects: state.status === 'ready' ? state.projects : [],
    isLoading: state.status === 'loading',
    error: state.status === 'error' ? state.message : null,
    reload,
    addItem,
  };
}

function isAbort(cause: unknown): boolean {
  return cause instanceof Error && cause.name === 'AbortError';
}
