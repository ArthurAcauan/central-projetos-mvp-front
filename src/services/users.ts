/**
 * Serviço REST de usuários (RF01).
 *
 * Único lugar onde o formato do JSON da API aparece para este recurso (ADR-0002).
 * `role` é dado cadastral: cadastrar e exibir é correto, usar para bloquear
 * funcionalidade está fora do escopo (RNF03, armadilha A-007).
 */

import { httpGet, httpPost, type RequestOptions } from '@/services/http';
import { isMockEnabled, mockCreateUser, mockListUsers } from '@/services/mock/store';
import type { User, UserInput, UserRole } from '@/types/user';

const RESOURCE_PATH = '/users';

interface UserDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export function listUsers(options?: RequestOptions): Promise<User[]> {
  if (isMockEnabled()) {
    return mockListUsers();
  }
  return httpGet<UserDto[]>(RESOURCE_PATH, options).then((dtos) => dtos.map(toUser));
}

export function createUser(input: UserInput, options?: RequestOptions): Promise<User> {
  if (isMockEnabled()) {
    return mockCreateUser(input);
  }
  return httpPost<UserDto>(
    RESOURCE_PATH,
    { name: input.name, email: input.email, role: input.role },
    options
  ).then(toUser);
}

/** API → domínio. */
function toUser(dto: UserDto): User {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    role: dto.role,
    createdAt: dto.created_at,
  };
}
