/**
 * Caminhos das rotas da aplicação. Ponto único de definição — consumido pela
 * definição de rotas (AppRoutes) e pela navegação (Sidebar).
 */
export const paths = {
  dashboard: '/',
  projects: '/projects',
  /** Padrão da rota; para navegar, use {@link projectDetailPath}. */
  projectDetail: '/projects/:id',
  users: '/users',
  clients: '/clients',
  teams: '/teams',
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];

/** URL dos detalhes de um projeto (RF05). Monta o link em um lugar só. */
export function projectDetailPath(id: string): string {
  return `/projects/${encodeURIComponent(id)}`;
}
