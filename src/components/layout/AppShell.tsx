import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';

/** Casca da aplicação: sidebar fixa + área de conteúdo alimentada pela rota ativa. */
export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
