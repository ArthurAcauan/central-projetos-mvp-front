/**
 * Perfil cadastral do usuário (RF01). É dado de cadastro: exibir é correto,
 * usar para bloquear funcionalidade está fora do escopo do MVP.
 *
 * F1-1 expande este arquivo com a entidade `User` completa.
 */
export type UserRole = 'GERENTE' | 'COORDENADOR' | 'GESTOR_PROJETO';

/** Rótulos de exibição em pt-BR. */
export const userRoleLabels: Record<UserRole, string> = {
  GERENTE: 'Gerente',
  COORDENADOR: 'Coordenador',
  GESTOR_PROJETO: 'Gestor de Projeto',
};
