import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';

/** Casca da aplicação: sidebar fixa + área de conteúdo alimentada pela rota ativa. */
export default function AppShell() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex min-h-screen flex-1 flex-col overflow-hidden">
        {/* Espera das rotas divididas em pedaço próprio (F5-2). Fica aqui, e não
            em volta das `<Routes>`, para a sidebar não sumir enquanto o pedaço
            do gráfico chega — quem navegou continua vendo onde está. */}
        <Suspense fallback={<RouteLoading />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

function RouteLoading() {
  return (
    <div className="flex-1 p-6">
      <p
        className="rounded-lg border border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-400"
        role="status"
      >
        Carregando tela...
      </p>
    </div>
  );
}
