/**
 * Carrega os dados da consulta de projetos (RF04).
 *
 * A lista precisa de três recursos: os projetos e, para exibir nome em vez de
 * UUID, os clientes e os usuários. Vão juntos em uma única chamada de hook
 * porque a tela só é útil com os três — mostrar a tabela com "cli-01" no lugar
 * do cliente seria pior do que esperar.
 *
 * Orquestração de dados vive aqui, não na página: a página recebe estado pronto
 * e não sabe que existe HTTP (ADR-0002).
 */

import { useCallback, useEffect, useState } from 'react';
import { listClients } from '@/services/clients';
import { isHttpError } from '@/services/http';
import { listProjects } from '@/services/projects';
import { listUsers } from '@/services/users';
import type { Client } from '@/types/client';
import type { Project } from '@/types/project';
import type { User } from '@/types/user';

const FALLBACK_ERROR = 'Não foi possível carregar os projetos. Tente novamente.';

/**
 * Os três estados possíveis em um valor só. Assim é impossível a tela exibir
 * tabela e erro ao mesmo tempo — e o efeito não precisa disparar `setState`
 * síncrono para "voltar a carregar" (regra `react-hooks/set-state-in-effect`).
 */
type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; projects: Project[]; clients: Client[]; users: User[] }
  | { status: 'error'; message: string };

const LOADING: LoadState = { status: 'loading' };

/** Listas vazias enquanto carrega ou depois de falhar — nunca dado pela metade. */
const NO_DATA: Pick<ProjectsListState, 'projects' | 'clients' | 'users'> = {
  projects: [],
  clients: [],
  users: [],
};

export interface ProjectsListState {
  projects: Project[];
  clients: Client[];
  users: User[];
  isLoading: boolean;
  /** Mensagem pronta para exibição, ou `null` quando a carga deu certo. */
  error: string | null;
  reload: () => void;
}

export function useProjectsList(): ProjectsListState {
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

    Promise.all([listProjects(options), listClients(options), listUsers(options)])
      .then(([projects, clients, users]) => {
        if (active) {
          setState({ status: 'ready', projects, clients, users });
        }
      })
      .catch((cause: unknown) => {
        // Cancelamento por unmount não é falha a exibir (ver services/http.ts).
        if (!active || isAbort(cause)) {
          return;
        }
        // Falha parcial deixaria a tabela com dados incoerentes: a tela inteira
        // vai para o estado de erro, com opção de tentar de novo.
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

  const data = state.status === 'ready' ? state : NO_DATA;

  return {
    projects: data.projects,
    clients: data.clients,
    users: data.users,
    isLoading: state.status === 'loading',
    error: state.status === 'error' ? state.message : null,
    reload,
  };
}

function isAbort(cause: unknown): boolean {
  return cause instanceof Error && cause.name === 'AbortError';
}
