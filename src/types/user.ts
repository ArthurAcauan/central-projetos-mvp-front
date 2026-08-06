/**
 * Perfil cadastral do usuário (RF01). É dado de cadastro: exibir é correto,
 * usar para bloquear funcionalidade está fora do escopo do MVP (RNF03,
 * armadilha A-007).
 */
export type UserRole = 'GERENTE' | 'COORDENADOR' | 'GESTOR_PROJETO';

/** Ordem de exibição em filtros e formulários. */
export const userRoles: readonly UserRole[] = ['GERENTE', 'COORDENADOR', 'GESTOR_PROJETO'];

/** Rótulos de exibição em pt-BR. */
export const userRoleLabels: Record<UserRole, string> = {
  GERENTE: 'Gerente',
  COORDENADOR: 'Coordenador',
  GESTOR_PROJETO: 'Gestor de Projeto',
};

/**
 * Usuário do sistema (RF01). É também quem responde por projetos:
 * `projects.managerId` aponta para cá, 1:N.
 *
 * Campos em camelCase por decisão do ADR-0002. `teams` e `users` não têm
 * `updated_at` na modelagem — o front não depende disso (ADR-0004).
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Timestamp ISO completo, gerado pelo backend. */
  createdAt: string;
}

/** Campos que o cliente envia ao cadastrar um usuário (RF01). */
export type UserInput = Pick<User, 'name' | 'email' | 'role'>;
