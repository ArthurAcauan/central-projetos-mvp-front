import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import ClientsPage from '@/pages/ClientsPage';
import ProjectFormPage from '@/pages/ProjectFormPage';
import ProjectsPage from '@/pages/ProjectsPage';
import TeamsPage from '@/pages/TeamsPage';
import UsersPage from '@/pages/UsersPage';
import { paths } from '@/routes/paths';

/**
 * As duas telas que usam Recharts saem do pacote inicial (F5-2).
 *
 * Recharts responde por mais da metade do bundle, e só o dashboard e os
 * detalhes o carregam. Sem esta separação, quem abre a lista de projetos baixa
 * uma biblioteca de gráficos que a tela não vai desenhar.
 *
 * As demais telas continuam no pacote inicial de propósito: são pequenas, e
 * dividir todas trocaria um download grande por um piscar de "carregando" a
 * cada navegação — pior para quem usa e sem ganho de peso relevante.
 */
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage'));

/**
 * Rotas da aplicação. O Router fica em main.tsx (BrowserRouter) e nos testes
 * (MemoryRouter), para que a navegação possa ser exercitada sem browser.
 *
 * O `<Suspense>` das rotas divididas vive no `AppShell`, em volta do `<Outlet>`:
 * assim a sidebar não pisca enquanto o pedaço do gráfico chega.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path={paths.dashboard} element={<DashboardPage />} />
        <Route path={paths.projects} element={<ProjectsPage />} />
        <Route path={paths.projectNew} element={<ProjectFormPage />} />
        <Route path={paths.projectDetail} element={<ProjectDetailPage />} />
        <Route path={paths.projectEdit} element={<ProjectFormPage />} />
        <Route path={paths.users} element={<UsersPage />} />
        <Route path={paths.clients} element={<ClientsPage />} />
        <Route path={paths.teams} element={<TeamsPage />} />
        <Route path="*" element={<Navigate to={paths.dashboard} replace />} />
      </Route>
    </Routes>
  );
}
