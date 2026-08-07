/**
 * Serviço REST de clientes (RF02).
 *
 * Único lugar onde o formato do JSON da API aparece para este recurso (ADR-0002).
 */

import { httpGet, httpPost, type RequestOptions } from '@/services/http';
import { isMockEnabled, mockCreateClient, mockListClients } from '@/services/mock/store';
import type { Client, ClientInput } from '@/types/client';

const RESOURCE_PATH = '/clients';

export interface ClientDto {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export function listClients(options?: RequestOptions): Promise<Client[]> {
  if (isMockEnabled()) {
    return mockListClients().then((dtos) => dtos.map(toClient));
  }
  return httpGet<ClientDto[]>(RESOURCE_PATH, options).then((dtos) => dtos.map(toClient));
}

export function createClient(input: ClientInput, options?: RequestOptions): Promise<Client> {
  if (isMockEnabled()) {
    return mockCreateClient(input).then(toClient);
  }
  return httpPost<ClientDto>(RESOURCE_PATH, { name: input.name }, options).then(toClient);
}

/** API → domínio. */
function toClient(dto: ClientDto): Client {
  return {
    id: dto.id,
    name: dto.name,
    createdAt: dto.created_at,
    updatedAt: dto.updated_at,
  };
}
