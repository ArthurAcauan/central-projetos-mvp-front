/**
 * Serviço REST de equipes.
 *
 * Único lugar onde o formato do JSON da API aparece para este recurso (ADR-0002).
 * A equipe é associada ao projeto como um todo — gestão individual de membros
 * está fora do escopo do MVP.
 */

import { httpGet, httpPost, type RequestOptions } from '@/services/http';
import { isMockEnabled, mockCreateTeam, mockListTeams } from '@/services/mock/store';
import type { Team, TeamInput } from '@/types/team';

const RESOURCE_PATH = '/teams';

export interface TeamDto {
  id: string;
  name: string;
  created_at: string;
}

export function listTeams(options?: RequestOptions): Promise<Team[]> {
  if (isMockEnabled()) {
    return mockListTeams().then((dtos) => dtos.map(toTeam));
  }
  return httpGet<TeamDto[]>(RESOURCE_PATH, options).then((dtos) => dtos.map(toTeam));
}

export function createTeam(input: TeamInput, options?: RequestOptions): Promise<Team> {
  if (isMockEnabled()) {
    return mockCreateTeam(input).then(toTeam);
  }
  return httpPost<TeamDto>(RESOURCE_PATH, { name: input.name }, options).then(toTeam);
}

/** API → domínio. */
function toTeam(dto: TeamDto): Team {
  return {
    id: dto.id,
    name: dto.name,
    createdAt: dto.created_at,
  };
}
