/**
 * Carrega um projeto e o que é preciso para descrevê-lo por nome (RF05).
 *
 * Mesma forma de `useProjectsList` (lição L-004): um estado discriminado, o
 * `setState` só dentro do `.then`/`.catch`, e a flag `active` no cleanup porque
 * a camada mock ignora `options.signal`.
 *
 * O projeto não vem sozinho: `clientId`, `managerId` e `teamId` são UUIDs, e a
 * tela mostra nomes. Como a API não devolve o recurso já expandido, os três
 * cadastros vêm junto e a resolução acontece aqui.
 */

import { useCallback, useEffect, useState } from 'react';
import { listClients } from '@/services/clients';
import { isHttpError } from '@/services/http';
import { getProject } from '@/services/projects';
import { listTeams } from '@/services/teams';
import { listUsers } from '@/services/users';
import type { Project } from '@/types/project';
import type { UserRole } from '@/types/user';

const FALLBACK_ERROR = 'Não foi possível carregar o projeto. Tente novamente.';
const MISSING_ID_ERROR = 'Projeto não encontrado.';

/** O projeto com as três referências já resolvidas em nome exibível. */
export interface ProjectDetail {
  project: Project;
  clientName: string | null;
  managerName: string | null;
  /** Perfil do gestor — dado cadastral exibido, nunca usado para bloquear (A-007). */
  managerRole: UserRole | null;
  teamName: string | null;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; detail: ProjectDetail }
  | { status: 'error'; message: string };

const LOADING: LoadState = { status: 'loading' };

export interface ProjectState {
  detail: ProjectDetail | null;
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
    const options = { signal: controller.signal };
    let active = true;

    Promise.all([
      getProject(id, options),
      listClients(options),
      listUsers(options),
      listTeams(options),
    ])
      .then(([project, clients, users, teams]) => {
        if (!active) {
          return;
        }
        const manager = users.find((user) => user.id === project.managerId);
        setState({
          status: 'ready',
          detail: {
            project,
            clientName: clients.find((client) => client.id === project.clientId)?.name ?? null,
            managerName: manager?.name ?? null,
            managerRole: manager?.role ?? null,
            teamName: teams.find((team) => team.id === project.teamId)?.name ?? null,
          },
        });
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
    return { detail: null, isLoading: false, error: MISSING_ID_ERROR, reload };
  }

  return {
    detail: state.status === 'ready' ? state.detail : null,
    isLoading: state.status === 'loading',
    error: state.status === 'error' ? state.message : null,
    reload,
  };
}

function isAbort(cause: unknown): boolean {
  return cause instanceof Error && cause.name === 'AbortError';
}
