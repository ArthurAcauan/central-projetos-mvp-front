/**
 * Carga do dashboard gerencial (RF07, RF08, RF09).
 *
 * Uma chamada só: `GET /projects` já traz os indicadores calculados pelo
 * backend e o cliente de cada projeto resolvido, que é tudo de que os cards, os
 * quatro gráficos e o painel de atenção precisam.
 *
 * **Por que não `GET /dashboard`**, que existe e vem pronto (ADR-0007): ele não
 * traz orçamento por cliente nem horas por projeto, e dois dos quatro gráficos
 * do RF08 dependem disso. Usar os dois colocaria duas origens na mesma tela,
 * que podem discordar — e a tela existe justamente para dar confiança no número.
 *
 * Mesma forma dos outros hooks de carga (lição L-004): um estado discriminado,
 * `setState` só dentro do `.then`/`.catch`, e a flag `active` no cleanup porque
 * a camada de fixture ignora `options.signal`.
 */

import { useCallback, useEffect, useState } from 'react';
import { isHttpError } from '@/services/http';
import { listProjects } from '@/services/projects';
import type { ProjectSummary } from '@/types/project';

const FALLBACK_ERROR = 'Não foi possível carregar o dashboard. Tente novamente.';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; projects: ProjectSummary[] }
  | { status: 'error'; message: string };

const LOADING: LoadState = { status: 'loading' };

export interface DashboardState {
  projects: ProjectSummary[];
  isLoading: boolean;
  /** Mensagem pronta para exibição, ou `null` quando a carga deu certo. */
  error: string | null;
  reload: () => void;
}

export function useDashboard(): DashboardState {
  const [state, setState] = useState<LoadState>(LOADING);
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setState(LOADING);
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const options = { signal: controller.signal };
    let active = true;

    listProjects({}, options)
      .then((projects) => {
        if (active) {
          setState({ status: 'ready', projects });
        }
      })
      .catch((cause: unknown) => {
        if (!active || isAbort(cause)) {
          return;
        }
        // Falha parcial deixaria indicadores incoerentes na tela que existe
        // justamente para dar confiança no número: a tela inteira vai a erro.
        setState({
          status: 'error',
          message: isHttpError(cause) ? cause.message : FALLBACK_ERROR,
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadToken]);

  return {
    projects: state.status === 'ready' ? state.projects : [],
    isLoading: state.status === 'loading',
    error: state.status === 'error' ? state.message : null,
    reload,
  };
}

function isAbort(cause: unknown): boolean {
  return cause instanceof Error && cause.name === 'AbortError';
}
