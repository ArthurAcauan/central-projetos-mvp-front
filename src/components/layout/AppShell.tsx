import { Suspense, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';

/**
 * Casca da aplicação: navegação lateral + área de conteúdo alimentada pela rota
 * ativa.
 *
 * Em telas largas a sidebar é uma coluna fixa, como no protótipo. Abaixo de
 * `lg` ela vira gaveta, aberta pelo botão da barra superior (F5-2): 224 px de
 * coluna fixa em um aparelho de 375 px deixariam a tabela com menos de metade
 * da largura útil.
 *
 * A gaveta fechada usa `hidden`, não deslocamento fora da tela: item invisível
 * mas focável faz o Tab passar por uma navegação que não está lá. Como quem
 * decide entre gaveta e coluna é o `lg:` do CSS, e não o estado do React, o
 * mesmo par de classes precisa resolver os dois casos — `hidden lg:flex`.
 */
export default function AppShell() {
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Fecha ao navegar e no Esc. O fechamento vem sempre de um evento — nunca de
  // um `setState` no corpo de um efeito, que é a lição L-004.
  useEffect(() => {
    if (!isNavOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsNavOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isNavOpen]);

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      {/* Primeiro item focável da página: quem navega por teclado pula a
          navegação inteira em vez de tabular por ela em toda tela. */}
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        href="#conteudo"
      >
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200 bg-slate-900 px-4 py-3 lg:hidden">
        <button
          aria-controls="navegacao-principal"
          aria-expanded={isNavOpen}
          className="rounded border border-slate-700 px-2.5 py-1.5 text-sm text-slate-200 transition-colors hover:bg-slate-800 focus-visible:outline-white"
          onClick={() => setIsNavOpen(true)}
          type="button"
        >
          <span aria-hidden="true">☰</span> Menu
        </button>
        <span className="text-sm font-semibold text-white">GestProject</span>
      </header>

      {isNavOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
          onClick={() => setIsNavOpen(false)}
        />
      )}

      <Sidebar isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />

      {/* `tabIndex={-1}` para o link de pular conseguir mover o foco para cá:
          sem ele o navegador rola até a âncora, mas o foco fica onde estava. */}
      {/* `min-h-screen` só a partir de `lg`: abaixo disso a barra superior já
          ocupa parte da altura, e somar uma tela inteira aqui deixaria a página
          sempre com uma sobra de rolagem. Quem garante o fundo em tela curta é o
          contêiner externo. */}
      <main
        className="flex flex-1 flex-col overflow-hidden lg:min-h-screen"
        id="conteudo"
        tabIndex={-1}
      >
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
    <div className="flex-1 p-4 sm:p-6">
      <p
        className="rounded-lg border border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-500"
        role="status"
      >
        Carregando tela...
      </p>
    </div>
  );
}
