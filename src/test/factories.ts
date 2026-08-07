/**
 * Fábricas de objetos de domínio para os testes.
 *
 * Existe porque a forma do projeto ficou grande depois da integração (F5-1):
 * três relações resolvidas e seis indicadores. Repetir isso em cada arquivo de
 * teste faria o essencial do caso — "este projeto está atrasado" — desaparecer
 * no meio de vinte linhas de preenchimento.
 *
 * Os indicadores **não** são calculados aqui, pelo mesmo motivo do ADR-0007: se
 * a fábrica os derivasse, o teste passaria a verificar a regra da fábrica em vez
 * da tela. Cada teste declara o indicador que quer exercitar.
 */

import type { Client } from '@/types/client';
import type {
  Project,
  ProjectIndicators,
  ProjectStatus,
  ProjectSummary,
  RelatedEntity,
} from '@/types/project';
import type { Team } from '@/types/team';
import type { User } from '@/types/user';

export const TIMESTAMP = '2026-01-05T09:00:00.000Z';

export const testClient: RelatedEntity = { id: 'cli-01', name: 'Alfa Logística' };
export const testManager: RelatedEntity = { id: 'usr-01', name: 'Bruno Tavares' };
export const testTeam: RelatedEntity = { id: 'team-01', name: 'Squad Plataforma' };

/** Projeto saudável: em dia, dentro do orçamento, sem motivo de atenção. */
const healthyIndicators: ProjectIndicators = {
  consumptionPercent: 25,
  isLate: false,
  isOverBudget: false,
  hasHighConsumption: false,
  needsAttention: false,
  attentionReasons: [],
};

export function makeIndicators(overrides: Partial<ProjectIndicators> = {}): ProjectIndicators {
  return { ...healthyIndicators, ...overrides };
}

export function makeProjectSummary(overrides: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    id: 'prj-01',
    name: 'Portal do Cliente',
    status: 'EM_ANDAMENTO' satisfies ProjectStatus,
    startDate: '2026-01-01',
    deadline: '2026-12-31',
    budget: 100_000,
    budgetSpent: 25_000,
    hoursWorked: 120,
    client: testClient,
    manager: testManager,
    team: testTeam,
    ...overrides,
    indicators: makeIndicators(overrides.indicators),
  };
}

export function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    ...makeProjectSummary(overrides),
    objective: 'Centralizar o atendimento em um canal único.',
    observations: null,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
    ...overrides,
    indicators: makeIndicators(overrides.indicators),
  };
}

export function makeClient(id: string, name: string): Client {
  return { id, name, createdAt: TIMESTAMP, updatedAt: TIMESTAMP };
}

export function makeTeam(id: string, name: string): Team {
  return { id, name, createdAt: TIMESTAMP };
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'usr-01',
    name: 'Bruno Tavares',
    email: 'bruno@exemplo.com.br',
    role: 'GESTOR_PROJETO',
    createdAt: TIMESTAMP,
    ...overrides,
  };
}
