/**
 * Carrega tudo que o formulário de projeto precisa (RF03, RF06).
 *
 * Cliente, gestor e equipe são obrigatórios (RN06) e chegam como UUID, então as
 * três listas vêm sempre. Na edição, o projeto a alterar vem junto — em uma
 * `Promise.all` só, para a tela não montar pela metade nem mostrar dois
 * "carregando" em sequência.
 *
 * Mesma forma dos outros hooks de carga (lição L-004): um estado discriminado,
 * `setState` só dentro do `.then`/`.catch`, e a flag `active` no cleanup porque
 * a camada mock ignora `options.signal`.
 */

import { useCallback, useEffect, useState } from 'react';
import { listClients } from '@/services/clients';
import { isHttpError } from '@/services/http';
import { getProject } from '@/services/projects';
import { listTeams } from '@/services/teams';
import { listUsers } from '@/services/users';
import type { Client } from '@/types/client';
import type { Project } from '@/types/project';
import type { Team } from '@/types/team';
import type { User } from '@/types/user';

const FALLBACK_ERROR = 'Não foi possível carregar os dados do formulário. Tente novamente.';

interface Loaded {
  project: Project | null;
  clients: Client[];
  users: User[];
  teams: Team[];
}

type LoadState =
  { status: 'loading' } | ({ status: 'ready' } & Loaded) | { status: 'error'; message: string };

const LOADING: LoadState = { status: 'loading' };

/** Nunca dado pela metade: enquanto carrega ou depois de falhar, não há nada. */
const NO_DATA: Loaded = { project: null, clients: [], users: [], teams: [] };

export interface ProjectFormDataState extends Loaded {
  isLoading: boolean;
  /** Mensagem pronta para exibição, ou `null` quando a carga deu certo. */
  error: string | null;
  reload: () => void;
}

/**
 * @param projectId Informe para editar (F2-4); omita para cadastrar (F2-3).
 *   Com id, `project` vem preenchido; sem id, vem `null`.
 */
export function useProjectFormData(projectId?: string): ProjectFormDataState {
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

    Promise.all([
      // `undefined` no lugar da busca mantém a `Promise.all` com a mesma forma
      // nos dois modos, sem um segundo caminho de carga para manter.
      projectId === undefined ? Promise.resolve(null) : getProject(projectId, options),
      listClients(options),
      listUsers(options),
      listTeams(options),
    ])
      .then(([project, clients, users, teams]) => {
        if (active) {
          setState({ status: 'ready', project, clients, users, teams });
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
  }, [projectId, reloadToken]);

  const data = state.status === 'ready' ? state : NO_DATA;

  return {
    project: data.project,
    clients: data.clients,
    /** Candidatos a gestor. `role` é dado cadastral e não filtra nada (A-007). */
    users: data.users,
    teams: data.teams,
    isLoading: state.status === 'loading',
    error: state.status === 'error' ? state.message : null,
    reload,
  };
}

function isAbort(cause: unknown): boolean {
  return cause instanceof Error && cause.name === 'AbortError';
}
