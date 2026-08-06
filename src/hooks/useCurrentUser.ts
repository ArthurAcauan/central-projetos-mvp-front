import type { UserRole } from '@/types/user';

/**
 * Usuário logado **simulado** (RNF03). O MVP não tem autenticação nem sessão:
 * este é um valor fixo, exibido no rodapé da sidebar.
 *
 * `role` aqui é campo cadastral. Não use para condicionar renderização ou
 * acesso — controle de acesso efetivo está fora do escopo (armadilha A-007).
 */
export interface CurrentUser {
  name: string;
  role: UserRole;
  /** Iniciais para o avatar, derivadas do nome. */
  initials: string;
}

const CURRENT_USER: CurrentUser = {
  name: 'Rodrigo Almeida',
  role: 'GERENTE',
  initials: 'RA',
};

export function useCurrentUser(): CurrentUser {
  return CURRENT_USER;
}
