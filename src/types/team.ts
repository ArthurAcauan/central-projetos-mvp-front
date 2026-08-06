/**
 * Equipe. 1:N com projetos.
 *
 * A equipe é associada ao projeto como um todo: gestão individual de membros
 * está fora do escopo do MVP.
 *
 * `teams` não tem `updated_at` na modelagem — a padronização é decisão do
 * backend e o front não depende desses campos (ADR-0004).
 */
export interface Team {
  id: string;
  name: string;
  /** Timestamp ISO completo, gerado pelo backend. */
  createdAt: string;
}

/** Campos que o cliente envia ao cadastrar uma equipe. */
export type TeamInput = Pick<Team, 'name'>;
