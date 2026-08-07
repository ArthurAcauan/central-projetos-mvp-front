import { describe, expect, it } from 'vitest';
import {
  isUserValid,
  validateClientName,
  validateTeamName,
  validateUser,
  type UserFormValues,
} from '@/domain/registryRules';
import type { Client } from '@/types/client';
import type { Team } from '@/types/team';
import type { User } from '@/types/user';

const TIMESTAMP = '2026-01-05T09:00:00.000Z';

const clients: Client[] = [
  { id: 'cli-01', name: 'Alfa Logística', createdAt: TIMESTAMP, updatedAt: TIMESTAMP },
];

const teams: Team[] = [{ id: 'team-01', name: 'Squad Plataforma', createdAt: TIMESTAMP }];

const users: User[] = [
  {
    id: 'usr-01',
    name: 'Bruno Tavares',
    email: 'bruno@exemplo.com.br',
    role: 'GESTOR_PROJETO',
    createdAt: TIMESTAMP,
  },
];

function makeUserValues(overrides: Partial<UserFormValues> = {}): UserFormValues {
  return {
    name: 'Camila Ferreira',
    email: 'camila@exemplo.com.br',
    role: 'COORDENADOR',
    ...overrides,
  };
}

describe('cadastro de cliente (RF02)', () => {
  it('aceita um nome novo', () => {
    expect(validateClientName('Beta Saúde', clients)).toBeNull();
  });

  it('cobra o nome', () => {
    expect(validateClientName('   ', clients)).toBe('Informe o nome do cliente.');
  });

  it('recusa nome repetido, ignorando caixa e acento', () => {
    const duplicate = 'Já existe um cliente com este nome.';

    expect(validateClientName('Alfa Logística', clients)).toBe(duplicate);
    expect(validateClientName('  alfa logistica  ', clients)).toBe(duplicate);
    expect(validateClientName('ALFA LOGÍSTICA', clients)).toBe(duplicate);
  });

  it('não confunde nomes apenas parecidos', () => {
    expect(validateClientName('Alfa Logística Sul', clients)).toBeNull();
  });
});

describe('cadastro de equipe', () => {
  it('aceita um nome novo e recusa o repetido', () => {
    expect(validateTeamName('Squad Dados', teams)).toBeNull();
    expect(validateTeamName('squad plataforma', teams)).toBe('Já existe uma equipe com este nome.');
  });

  it('cobra o nome', () => {
    expect(validateTeamName('', teams)).toBe('Informe o nome da equipe.');
  });
});

describe('cadastro de usuário (RF01)', () => {
  it('aceita nome, e-mail e perfil preenchidos', () => {
    expect(validateUser(makeUserValues(), users)).toEqual({});
    expect(isUserValid(makeUserValues(), users)).toBe(true);
  });

  it('cobra nome, e-mail e perfil', () => {
    const errors = validateUser(makeUserValues({ name: '  ', email: '', role: '' }), users);

    expect(errors.name).toBe('Informe o nome do usuário.');
    expect(errors.email).toBe('Informe o e-mail.');
    expect(errors.role).toBe('Selecione o perfil de acesso.');
  });

  it('recusa e-mail malformado', () => {
    expect(validateUser(makeUserValues({ email: 'camila' }), users).email).toBe('E-mail inválido.');
    expect(validateUser(makeUserValues({ email: 'camila@empresa' }), users).email).toBe(
      'E-mail inválido.'
    );
    expect(validateUser(makeUserValues({ email: 'camila @empresa.com' }), users).email).toBe(
      'E-mail inválido.'
    );
  });

  // `users.email` é UNIQUE na modelagem.
  it('recusa e-mail já cadastrado, ignorando caixa e espaço', () => {
    const duplicate = 'Já existe um usuário com este e-mail.';

    expect(validateUser(makeUserValues({ email: 'bruno@exemplo.com.br' }), users).email).toBe(
      duplicate
    );
    expect(validateUser(makeUserValues({ email: ' BRUNO@Exemplo.com.br ' }), users).email).toBe(
      duplicate
    );
  });

  it('aceita qualquer um dos três perfis — o campo é cadastral (A-007)', () => {
    for (const role of ['GERENTE', 'COORDENADOR', 'GESTOR_PROJETO'] as const) {
      expect(validateUser(makeUserValues({ role }), users)).toEqual({});
    }
  });
});
