import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from '@/components/layout/AppShell';
import ClientsPage from '@/pages/ClientsPage';
import DashboardPage from '@/pages/DashboardPage';
import ProjectDetailPage from '@/pages/ProjectDetailPage';
import ProjectFormPage from '@/pages/ProjectFormPage';
import ProjectsPage from '@/pages/ProjectsPage';
import TeamsPage from '@/pages/TeamsPage';
import UsersPage from '@/pages/UsersPage';
import { paths } from '@/routes/paths';

/**
 * Rotas da aplicação. O Router fica em main.tsx (BrowserRouter) e nos testes
 * (MemoryRouter), para que a navegação possa ser exercitada sem browser.
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
