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

import type { ProjectStatus, ProjectSummary } from '@/types/project';

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

export function hasActiveFilters(filters: ProjectFilters): boolean {
  return filters.search.trim() !== '' || filters.status !== '' || filters.clientId !== '';
}

/**
 * Aplica os três filtros em conjunto (E lógico), preservando a ordem de entrada
 * — que vem da API por prazo crescente, o que vence antes primeiro.
 *
 * O recorte acontece **no cliente**, mesmo com a API aceitando `?status=` e
 * `?client_id=`: a busca textual não tem equivalente no servidor, e filtrar
 * metade aqui e metade lá daria dois comportamentos diferentes na mesma barra
 * de filtros — um instantâneo e outro com ida e volta de rede.
 *
 * Nome de cliente e de gestor vêm dentro do projeto desde a integração
 * (ADR-0007): não é mais preciso cruzar com as listas de cadastro.
 */
export function filterProjects(
  projects: readonly ProjectSummary[],
  filters: ProjectFilters
): ProjectSummary[] {
  const search = normalize(filters.search);

  return projects.filter((project) => {
    if (filters.status !== '' && project.status !== filters.status) {
      return false;
    }
    if (filters.clientId !== '' && project.client.id !== filters.clientId) {
      return false;
    }
    if (search === '') {
      return true;
    }
    const haystack = [project.name, project.client.name, project.manager.name];
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
