/**
 * Caminhos das rotas da aplicação. Ponto único de definição — consumido pela
 * definição de rotas (AppRoutes) e pela navegação (Sidebar).
 */
export const paths = {
  dashboard: '/',
  projects: '/projects',
  users: '/users',
  clients: '/clients',
  teams: '/teams',
} as const;

export type AppPath = (typeof paths)[keyof typeof paths];
