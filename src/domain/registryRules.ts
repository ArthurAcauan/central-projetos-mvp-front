/**
 * Regras dos cadastros auxiliares — clientes (RF02), equipes e usuários (RF01).
 *
 * Módulo puro, sem React, no mesmo espírito de `projectRules.ts`: as telas
 * renderizam as mensagens daqui em vez de reimplementar as verificações.
 *
 * Duas decisões que não estão literalmente no texto dos requisitos:
 *
 * 1. **E-mail único.** A modelagem declara `users.email` como `UNIQUE`
 *    (`context/04_modelagem_dados_e_banco.md`). Verificar no front evita o 409
 *    do backend chegar como erro genérico, mas **não** substitui a restrição do
 *    banco — a lista em mãos pode estar desatualizada.
 * 2. **Nome de cliente e de equipe únicos.** Não há `UNIQUE` na modelagem, mas
 *    o nome é a única forma de distinguir um do outro na tela e nos agregados
 *    do dashboard: dois clientes "Alfa Logística" viram duas barras
 *    indistinguíveis em "projetos por cliente" (RF08). A duplicidade é
 *    recusada aqui e a comparação ignora caixa e acento, porque "alfa
 *    logistica" é o mesmo cliente para quem lê o gráfico.
 */

import type { Client } from '@/types/client';
import type { Team } from '@/types/team';
import { userRoles, type User, type UserRole } from '@/types/user';

/** Formato mínimo de e-mail. Validar além disso rejeita endereço válido. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Valores do formulário de usuário, ainda não validados. */
export interface UserFormValues {
  name: string;
  email: string;
  role: UserRole | '';
}

export type UserFieldErrors = Partial<Record<keyof UserFormValues, string>>;

/**
 * Nome de um cadastro que só tem nome (cliente, equipe). Devolve a mensagem de
 * erro ou `null` quando pode salvar.
 *
 * @param existingNames Nomes já cadastrados do mesmo tipo.
 */
export function validateRegistryName(
  name: string,
  existingNames: readonly string[],
  labels: { required: string; duplicate: string }
): string | null {
  if (name.trim() === '') {
    return labels.required;
  }
  if (existingNames.some((existing) => sameName(existing, name))) {
    return labels.duplicate;
  }
  return null;
}

/** Cliente (RF02): só o nome, conforme a modelagem. */
export function validateClientName(name: string, existing: readonly Client[]): string | null {
  return validateRegistryName(
    name,
    existing.map((client) => client.name),
    {
      required: 'Informe o nome do cliente.',
      duplicate: 'Já existe um cliente com este nome.',
    }
  );
}

/** Equipe: só o nome. Membros individuais estão fora do escopo do MVP. */
export function validateTeamName(name: string, existing: readonly Team[]): string | null {
  return validateRegistryName(
    name,
    existing.map((team) => team.name),
    {
      required: 'Informe o nome da equipe.',
      duplicate: 'Já existe uma equipe com este nome.',
    }
  );
}

/**
 * Usuário (RF01): nome, e-mail e perfil. `role` é dado cadastral — validar que
 * foi escolhido é correto; usá-lo para liberar ou bloquear tela não é (A-007).
 */
export function validateUser(values: UserFormValues, existing: readonly User[]): UserFieldErrors {
  const errors: UserFieldErrors = {};

  if (values.name.trim() === '') {
    errors.name = 'Informe o nome do usuário.';
  }

  const email = values.email.trim();
  if (email === '') {
    errors.email = 'Informe o e-mail.';
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'E-mail inválido.';
  } else if (existing.some((user) => sameEmail(user.email, email))) {
    errors.email = 'Já existe um usuário com este e-mail.';
  }

  if (values.role === '' || !userRoles.includes(values.role)) {
    errors.role = 'Selecione o perfil de acesso.';
  }

  return errors;
}

export function isUserValid(values: UserFormValues, existing: readonly User[]): boolean {
  return Object.keys(validateUser(values, existing)).length === 0;
}

/** Caixa e acento não distinguem dois cadastros para quem lê a tela. */
function sameName(a: string, b: string): boolean {
  return normalize(a) === normalize(b);
}

/** E-mail é insensível a caixa na prática; acento não ocorre na parte local. */
function sameEmail(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}
