/**
 * Carrega os dados da consulta de projetos (RF04).
 *
 * Desde a integração (ADR-0007) o projeto já chega com cliente, gestor e equipe
 * resolvidos, então a lista não precisa mais cruzar três recursos para exibir
 * nome. Os clientes continuam vindo por um motivo diferente: alimentar o
 * `<select>` do filtro, que precisa oferecer também o cliente que ainda não tem
 * projeto nenhum.
 *
 * Orquestração de dados vive aqui, não na página: a página recebe estado pronto
 * e não sabe que existe HTTP (ADR-0002).
 */

import { useCallback, useEffect, useState } from 'react';
import { listClients } from '@/services/clients';
import { isHttpError } from '@/services/http';
import { listProjects } from '@/services/projects';
import type { Client } from '@/types/client';
import type { ProjectSummary } from '@/types/project';

const FALLBACK_ERROR = 'Não foi possível carregar os projetos. Tente novamente.';

/**
 * Os três estados possíveis em um valor só. Assim é impossível a tela exibir
 * tabela e erro ao mesmo tempo — e o efeito não precisa disparar `setState`
 * síncrono para "voltar a carregar" (regra `react-hooks/set-state-in-effect`).
 */
type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; projects: ProjectSummary[]; clients: Client[] }
  | { status: 'error'; message: string };

const LOADING: LoadState = { status: 'loading' };

/** Listas vazias enquanto carrega ou depois de falhar — nunca dado pela metade. */
const NO_DATA: Pick<ProjectsListState, 'projects' | 'clients'> = {
  projects: [],
  clients: [],
};

export interface ProjectsListState {
  projects: ProjectSummary[];
  /** Só para o filtro por cliente; o nome exibido vem de dentro do projeto. */
  clients: Client[];
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

    // Sem filtro na query: o recorte acontece no cliente, para a busca textual
    // e os dois `<select>` se comportarem igual (ver `domain/projectFilters`).
    Promise.all([listProjects({}, options), listClients(options)])
      .then(([projects, clients]) => {
        if (active) {
          setState({ status: 'ready', projects, clients });
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
    isLoading: state.status === 'loading',
    error: state.status === 'error' ? state.message : null,
    reload,
  };
}

function isAbort(cause: unknown): boolean {
  return cause instanceof Error && cause.name === 'AbortError';
}
