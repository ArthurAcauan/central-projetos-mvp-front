import { describe, expect, it } from 'vitest';
import {
  emptyProjectFilters,
  filterProjects,
  hasActiveFilters,
  type ProjectFilters,
} from '@/domain/projectFilters';
import { makeProjectSummary } from '@/test/factories';

const alfa = { id: 'cli-01', name: 'Alfa Logística' };
const beta = { id: 'cli-02', name: 'Beta Saúde' };
const camila = { id: 'usr-01', name: 'Camila Ferreira' };
const bruno = { id: 'usr-02', name: 'Bruno Tavares' };

const portal = makeProjectSummary({
  id: 'prj-01',
  name: 'Portal do Cliente',
  client: alfa,
  manager: camila,
});
const frota = makeProjectSummary({
  id: 'prj-02',
  name: 'Rastreamento de Frota',
  client: alfa,
  manager: bruno,
  status: 'EM_RISCO',
});
const prontuario = makeProjectSummary({
  id: 'prj-03',
  name: 'Prontuário Eletrônico',
  client: beta,
  manager: bruno,
  status: 'EM_RISCO',
});
const agendamento = makeProjectSummary({
  id: 'prj-04',
  name: 'Agendamento Online',
  client: beta,
  manager: camila,
  status: 'CONCLUIDO',
});

const projects = [portal, frota, prontuario, agendamento];

function apply(filters: Partial<ProjectFilters>): string[] {
  return filterProjects(projects, { ...emptyProjectFilters, ...filters }).map(
    (project) => project.id
  );
}

describe('filtros ativos', () => {
  it('reconhece o estado sem filtro', () => {
    expect(hasActiveFilters(emptyProjectFilters)).toBe(false);
    expect(hasActiveFilters({ ...emptyProjectFilters, search: '   ' })).toBe(false);
  });

  it('reconhece cada filtro isolado', () => {
    expect(hasActiveFilters({ ...emptyProjectFilters, search: 'portal' })).toBe(true);
    expect(hasActiveFilters({ ...emptyProjectFilters, status: 'EM_RISCO' })).toBe(true);
    expect(hasActiveFilters({ ...emptyProjectFilters, clientId: 'cli-01' })).toBe(true);
  });
});

describe('recorte da consulta (RF04)', () => {
  it('sem filtro devolve tudo, na ordem de entrada', () => {
    expect(apply({})).toEqual(['prj-01', 'prj-02', 'prj-03', 'prj-04']);
  });

  it('filtra por status', () => {
    expect(apply({ status: 'EM_RISCO' })).toEqual(['prj-02', 'prj-03']);
  });

  it('filtra por cliente', () => {
    expect(apply({ clientId: 'cli-02' })).toEqual(['prj-03', 'prj-04']);
  });

  it('combina os filtros com E lógico', () => {
    expect(apply({ status: 'EM_RISCO', clientId: 'cli-02' })).toEqual(['prj-03']);
  });

  it('devolve vazio quando a combinação não casa com nada', () => {
    expect(apply({ status: 'CANCELADO', clientId: 'cli-01' })).toEqual([]);
  });
});

describe('busca textual', () => {
  it('acha pelo nome do projeto', () => {
    expect(apply({ search: 'portal' })).toEqual(['prj-01']);
  });

  // Nome de cliente e gestor vêm dentro do projeto desde a integração.
  it('acha pelo nome do cliente', () => {
    expect(apply({ search: 'beta' })).toEqual(['prj-03', 'prj-04']);
  });

  it('acha pelo nome do gestor', () => {
    expect(apply({ search: 'bruno' })).toEqual(['prj-02', 'prj-03']);
  });

  it('ignora caixa e acento — "logistica" precisa achar "Alfa Logística"', () => {
    expect(apply({ search: 'LOGISTICA' })).toEqual(['prj-01', 'prj-02']);
    expect(apply({ search: 'prontuario' })).toEqual(['prj-03']);
  });

  it('ignora espaço nas pontas', () => {
    expect(apply({ search: '  portal  ' })).toEqual(['prj-01']);
  });

  it('combina com os demais filtros', () => {
    expect(apply({ search: 'bruno', status: 'EM_RISCO', clientId: 'cli-01' })).toEqual(['prj-02']);
  });

  it('devolve vazio quando não acha', () => {
    expect(apply({ search: 'inexistente' })).toEqual([]);
  });
});
