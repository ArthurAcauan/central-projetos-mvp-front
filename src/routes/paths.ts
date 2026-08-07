/**
 * Caminhos das rotas da aplicação. Ponto único de definição — consumido pela
 * definição de rotas (AppRoutes) e pela navegação (Sidebar).
 */
export const paths = {
  dashboard: '/',
  projects: '/projects',
  /**
   * Cadastro de projeto (RF03). Precisa continuar acima de `projectDetail` na
   * classificação do Router — segmento estático vence dinâmico no React Router
   * v6, mas a quebra seria silenciosa, então há teste fixando isso.
   */
  projectNew: '/projects/new',
  /** Padrão da rota; para navegar, use {@link projectDetailPath}. */
  projectDetail: '/projects/:id',
  /** Edição de projeto (RF06); para navegar, use {@link projectEditPath}. */
  projectEdit: '/projects/:id/edit',
  users: '/users',
  clients: '/clients',
  teams: '/teams',
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];

/** URL dos detalhes de um projeto (RF05). Monta o link em um lugar só. */
export function projectDetailPath(id: string): string {
  return `/projects/${encodeURIComponent(id)}`;
}

/** URL de edição de um projeto (RF06). */
export function projectEditPath(id: string): string {
  return `${projectDetailPath(id)}/edit`;
}
