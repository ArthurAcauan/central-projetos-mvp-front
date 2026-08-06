/**
 * Filtro da consulta de projetos (RF04).
 *
 * Módulo puro, sem React: a página guarda o estado dos controles e delega a
 * decisão de quais projetos aparecem para cá, do mesmo jeito que delega o
 * cálculo de indicador para `domain/indicators.ts`.
 *
 * A busca textual atravessa nome do projeto, cliente e gestor — é assim que o
 * protótipo se comporta e é o que "consultar projetos" significa na prática para
 * quem usa a tela.
 */

import type { Client } from '@/types/client';
import type { Project, ProjectStatus } from '@/types/project';
import type { User } from '@/types/user';

/** Estado dos controles da tela. String vazia = filtro não aplicado. */
export interface ProjectFilters {
  search: string;
  status: ProjectStatus | '';
  clientId: string;
}

export const emptyProjectFilters: ProjectFilters = {
  search: '',
  status: '',
  clientId: '',
};

/** Nomes usados pela busca textual; sem eles o filtro só olha o nome do projeto. */
export interface ProjectFilterLookups {
  clients: readonly Client[];
  users: readonly User[];
}

export function hasActiveFilters(filters: ProjectFilters): boolean {
  return filters.search.trim() !== '' || filters.status !== '' || filters.clientId !== '';
}

/**
 * Aplica os três filtros em conjunto (E lógico), preservando a ordem de entrada.
 */
export function filterProjects(
  projects: readonly Project[],
  filters: ProjectFilters,
  lookups: ProjectFilterLookups
): Project[] {
  const search = normalize(filters.search);
  const clientNameById = new Map(lookups.clients.map((client) => [client.id, client.name]));
  const userNameById = new Map(lookups.users.map((user) => [user.id, user.name]));

  return projects.filter((project) => {
    if (filters.status !== '' && project.status !== filters.status) {
      return false;
    }
    if (filters.clientId !== '' && project.clientId !== filters.clientId) {
      return false;
    }
    if (search === '') {
      return true;
    }
    const haystack = [
      project.name,
      clientNameById.get(project.clientId) ?? '',
      userNameById.get(project.managerId) ?? '',
    ];
    return haystack.some((value) => normalize(value).includes(search));
  });
}

/**
 * Deixa a busca insensível a caixa e a acento: quem digita "logistica" precisa
 * achar "Alfa Logística", senão o filtro parece quebrado.
 */
function normalize(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}
