import { describe, expect, it } from 'vitest';
import {
  emptyProjectFilters,
  filterProjects,
  hasActiveFilters,
  type ProjectFilters,
} from '@/domain/projectFilters';
import type { Client } from '@/types/client';
import type { Project } from '@/types/project';
import type { User } from '@/types/user';

const TIMESTAMP = '2026-01-05T09:00:00.000Z';

const clients: Client[] = [
  { id: 'cli-01', name: 'Alfa Logística', createdAt: TIMESTAMP, updatedAt: TIMESTAMP },
  { id: 'cli-02', name: 'Beta Saúde', createdAt: TIMESTAMP, updatedAt: TIMESTAMP },
];

const users: User[] = [
  {
    id: 'usr-01',
    name: 'Camila Ferreira',
    email: 'camila@exemplo.com.br',
    role: 'COORDENADOR',
    createdAt: TIMESTAMP,
  },
  {
    id: 'usr-02',
    name: 'Bruno Tavares',
    email: 'bruno@exemplo.com.br',
    role: 'GESTOR_PROJETO',
    createdAt: TIMESTAMP,
  },
];

function makeProject(overrides: Partial<Project> & Pick<Project, 'id' | 'name'>): Project {
  return {
    clientId: 'cli-01',
    objective: 'Objetivo',
    managerId: 'usr-01',
    teamId: 'team-01',
    startDate: '2026-01-10',
    deadline: '2026-12-31',
    budget: 100_000,
    budgetSpent: 10_000,
    hoursWorked: 100,
    status: 'EM_ANDAMENTO',
    observations: null,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
  };
}

const projects: Project[] = [
  makeProject({ id: 'prj-01', name: 'Portal do Cliente', clientId: 'cli-01', managerId: 'usr-01' }),
  makeProject({
    id: 'prj-02',
    name: 'Prontuário Eletrônico',
    clientId: 'cli-02',
    managerId: 'usr-02',
    status: 'EM_RISCO',
  }),
  makeProject({
    id: 'prj-03',
    name: 'Catálogo Digital',
    clientId: 'cli-02',
    managerId: 'usr-01',
    status: 'PLANEJAMENTO',
  }),
];

const lookups = { clients, users };

function filtersWith(overrides: Partial<ProjectFilters>): ProjectFilters {
  return { ...emptyProjectFilters, ...overrides };
}

function namesOf(result: Project[]): string[] {
  return result.map((project) => project.name);
}

describe('filterProjects', () => {
  it('sem filtro devolve tudo na ordem de entrada', () => {
    expect(namesOf(filterProjects(projects, emptyProjectFilters, lookups))).toEqual([
      'Portal do Cliente',
      'Prontuário Eletrônico',
      'Catálogo Digital',
    ]);
  });

  it('filtra por status', () => {
    const result = filterProjects(projects, filtersWith({ status: 'EM_RISCO' }), lookups);
    expect(namesOf(result)).toEqual(['Prontuário Eletrônico']);
  });

  it('filtra por cliente', () => {
    const result = filterProjects(projects, filtersWith({ clientId: 'cli-02' }), lookups);
    expect(namesOf(result)).toEqual(['Prontuário Eletrônico', 'Catálogo Digital']);
  });

  it('busca pelo nome do projeto ignorando caixa e acento', () => {
    const result = filterProjects(projects, filtersWith({ search: 'CATALOGO' }), lookups);
    expect(namesOf(result)).toEqual(['Catálogo Digital']);
  });

  it('busca pelo nome do cliente', () => {
    const result = filterProjects(projects, filtersWith({ search: 'logistica' }), lookups);
    expect(namesOf(result)).toEqual(['Portal do Cliente']);
  });

  it('busca pelo nome do gestor', () => {
    const result = filterProjects(projects, filtersWith({ search: 'bruno' }), lookups);
    expect(namesOf(result)).toEqual(['Prontuário Eletrônico']);
  });

  it('combina os filtros com E lógico', () => {
    const result = filterProjects(
      projects,
      filtersWith({ clientId: 'cli-02', status: 'PLANEJAMENTO' }),
      lookups
    );
    expect(namesOf(result)).toEqual(['Catálogo Digital']);
  });

  it('devolve vazio quando nada casa', () => {
    expect(filterProjects(projects, filtersWith({ search: 'inexistente' }), lookups)).toEqual([]);
  });

  it('ignora espaços em volta do termo buscado', () => {
    const result = filterProjects(projects, filtersWith({ search: '  portal  ' }), lookups);
    expect(namesOf(result)).toEqual(['Portal do Cliente']);
  });

  it('não quebra quando o cliente ou o gestor do projeto não está na lista', () => {
    const orphan = makeProject({ id: 'prj-04', name: 'Órfão', clientId: 'cli-99' });
    const result = filterProjects([orphan], filtersWith({ search: 'orfao' }), lookups);
    expect(namesOf(result)).toEqual(['Órfão']);
  });
});

describe('hasActiveFilters', () => {
  it('é falso sem filtro aplicado', () => {
    expect(hasActiveFilters(emptyProjectFilters)).toBe(false);
  });

  it('é falso quando a busca tem só espaços', () => {
    expect(hasActiveFilters(filtersWith({ search: '   ' }))).toBe(false);
  });

  it('é verdadeiro com qualquer filtro preenchido', () => {
    expect(hasActiveFilters(filtersWith({ search: 'a' }))).toBe(true);
    expect(hasActiveFilters(filtersWith({ status: 'CONCLUIDO' }))).toBe(true);
    expect(hasActiveFilters(filtersWith({ clientId: 'cli-01' }))).toBe(true);
  });
});
