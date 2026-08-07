/**
 * Projeto — entidade central do MVP (`context/04_modelagem_dados_e_banco.md`).
 *
 * Campos em camelCase por decisão do ADR-0002: a tradução do formato da API
 * acontece só nos mapeadores de `services/`. Nenhum `snake_case` aqui.
 *
 * Duas formas, porque a API tem duas ([ADR-0007](../../docs/decisions/ADR-0007-indicadores-vem-do-backend.md)):
 * {@link ProjectSummary} é o que a lista devolve, {@link Project} é o detalhe.
 * As relações chegam **resolvidas** (`client: {id, name}`), não como FK solta —
 * o front não precisa mais carregar clientes e usuários só para exibir nome.
 */

/**
 * Status do projeto. Literais exatos do spec — usados como valor, não como
 * rótulo. Este tipo vale onde o status é **escolhido** (formulário, payload);
 * o que vem da API é `string`, ver {@link ProjectSummary.status}.
 */
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
 * Status terminais: o projeto encerrado não reabre. Tentar mudar responde 400
 * na API, então o `<select>` do formulário não oferece a troca.
 */
export const terminalProjectStatuses: readonly ProjectStatus[] = ['CONCLUIDO', 'CANCELADO'];

export function isTerminalStatus(status: string): boolean {
  return terminalProjectStatuses.some((terminal) => terminal === status);
}

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

/**
 * Rótulo de um status vindo da API, que pode não ser canônico. O contrato anexa
 * valor fora da lista de propósito, para denunciar dado corrompido em vez de
 * escondê-lo — então a tela mostra o literal cru em vez de quebrar.
 */
export function projectStatusLabel(status: string): string {
  return isProjectStatus(status) ? projectStatusLabels[status] : status;
}

/** Relação já resolvida pela API: o suficiente para exibir e para referenciar. */
export interface RelatedEntity {
  id: string;
  name: string;
}

/** Por que o projeto entrou no painel de atenção (RF09). */
export type AttentionReason = 'ATRASADO' | 'ORCAMENTO_EXCEDIDO' | 'CONSUMO_ELEVADO';

export const attentionReasonLabels: Record<AttentionReason, string> = {
  ATRASADO: 'Atrasado',
  ORCAMENTO_EXCEDIDO: 'Orç. excedido',
  CONSUMO_ELEVADO: 'Consumo elevado',
};

/**
 * Indicadores calculados pelo **backend** e devolvidos em toda resposta de
 * projeto. Nunca persistidos, nunca recalculados aqui (ADR-0007): duas
 * implementações de "está atrasado" divergiriam, e o front perderia para a que
 * conhece o fuso do servidor e o estado real do banco.
 */
export interface ProjectIndicators {
  /**
   * Percentual do orçamento previsto já consumido. **`null` quando
   * `budget = 0`** — não calculável, nunca zero (RN07, armadilha A-001). Pode
   * passar de 100: estouro é permitido (RN03).
   */
  consumptionPercent: number | null;
  /** Prazo vencido com o projeto ainda ativo. Encerrado nunca está atrasado (RN08). */
  isLate: boolean;
  isOverBudget: boolean;
  /** Consumo ≥ 90% do previsto — aviso antes do estouro. */
  hasHighConsumption: boolean;
  /**
   * Atrasado, com orçamento excedido ou com consumo elevado, exceto em projeto
   * encerrado (RN09 revisado no ADR-0007). **Não** inclui o status `EM_RISCO`
   * declarado pelo gestor, que é julgamento manual e tem indicador próprio.
   */
  needsAttention: boolean;
  attentionReasons: AttentionReason[];
}

/** O que `GET /projects` devolve: sem `objective`, `observations` e timestamps. */
export interface ProjectSummary {
  id: string;
  name: string;
  /**
   * `string`, não `ProjectStatus`: a coluna é `VARCHAR` sem ENUM e a API pode
   * devolver valor fora da lista para denunciar dado corrompido. Use
   * {@link projectStatusLabel} e mapas com valor padrão.
   */
  status: string;
  /**
   * Data de calendário `YYYY-MM-DD`, sem hora. Não construa
   * `new Date(startDate)` para comparar ou exibir: a string ISO é lida como UTC
   * e erra um dia em UTC-3 (armadilha A-002). Use `parseCalendarDate` de
   * `domain/indicators.ts` ou `formatDate` de `lib/format.ts`.
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
  client: RelatedEntity;
  /** Gestor responsável. */
  manager: RelatedEntity;
  team: RelatedEntity;
  indicators: ProjectIndicators;
}

/** O que `GET /projects/:id`, `POST` e `PUT` devolvem. */
export interface Project extends ProjectSummary {
  objective: string;
  observations: string | null;
  /** Timestamp ISO completo, gerado pelo backend. */
  createdAt: string;
  updatedAt: string;
}

/**
 * Campos que o cliente envia ao criar ou atualizar um projeto (RF03, RF06).
 *
 * Aqui as relações voltam a ser id solto, porque é o que o payload aceita — o
 * objeto devolvido pelo `GET` **não** é aceito de volta pelo `PUT`. E `status`
 * volta a ser a união fechada, porque aqui o valor é escolhido, não recebido.
 */
export interface ProjectInput {
  name: string;
  clientId: string;
  objective: string;
  managerId: string;
  teamId: string;
  startDate: string;
  deadline: string;
  budget: number;
  budgetSpent: number;
  hoursWorked: number;
  status: ProjectStatus;
  observations: string | null;
}

/** Recorte de `GET /projects?status=&client_id=`. Chave ausente = sem filtro. */
export interface ProjectQuery {
  status?: ProjectStatus;
  clientId?: string;
}
