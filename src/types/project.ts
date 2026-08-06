/**
 * Projeto — entidade central do MVP, concentra as três FKs (`clientId`,
 * `managerId`, `teamId`), todas N:1 (`context/04_modelagem_dados_e_banco.md`).
 *
 * Campos em camelCase por decisão do ADR-0002: a tradução do formato da API
 * acontece só nos mapeadores de `services/`. Nenhum `snake_case` aqui.
 */

/** Status do projeto. Literais exatos do spec — usados como valor, não como rótulo. */
export type ProjectStatus =
  'PLANEJAMENTO' | 'EM_ANDAMENTO' | 'EM_RISCO' | 'CONCLUIDO' | 'CANCELADO';

/** Ordem de exibição em filtros, legendas e gráficos: ciclo de vida do projeto. */
export const projectStatuses: readonly ProjectStatus[] = [
  'PLANEJAMENTO',
  'EM_ANDAMENTO',
  'EM_RISCO',
  'CONCLUIDO',
  'CANCELADO',
];

/**
 * Confirma que um texto solto é um status válido. Serve para o valor cru de um
 * `<select>`, que o DOM entrega como `string`: sem isto a única saída seria um
 * `as ProjectStatus`, que silencia o compilador sem verificar nada.
 */
export function isProjectStatus(value: string): value is ProjectStatus {
  return projectStatuses.some((status) => status === value);
}

/** Rótulos de exibição em pt-BR. */
export const projectStatusLabels: Record<ProjectStatus, string> = {
  PLANEJAMENTO: 'Planejamento',
  EM_ANDAMENTO: 'Em andamento',
  EM_RISCO: 'Em risco',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
};

export interface Project {
  id: string;
  name: string;
  clientId: string;
  objective: string;
  /** Gestor responsável — FK para `users.id`. */
  managerId: string;
  teamId: string;
  /**
   * Data de calendário `YYYY-MM-DD`, sem hora (coluna `DATE`). Não construa
   * `new Date(startDate)` para comparar: a string ISO é lida como UTC e erra um
   * dia em UTC-3 (armadilha A-002). Use os utilitários de `domain/indicators.ts`.
   */
  startDate: string;
  /** Prazo previsto, mesmo formato e mesmo cuidado de `startDate`. */
  deadline: string;
  /** Orçamento previsto em reais. `>= 0` (RN01); pode ser `0`. */
  budget: number;
  /** Orçamento consumido em reais. `>= 0` (RN02) e **pode exceder** `budget` (RN03). */
  budgetSpent: number;
  /** Horas realizadas no projeto, total — não há timesheet individual (RN04). */
  hoursWorked: number;
  status: ProjectStatus;
  observations: string | null;
  /** Timestamp ISO completo, gerado pelo backend. */
  createdAt: string;
  updatedAt: string;
}

/** Campos que o cliente envia ao criar ou atualizar um projeto (RF03, RF06). */
export type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;
