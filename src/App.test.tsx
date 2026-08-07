import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>
  );
}

/**
 * O dashboard e os detalhes vêm em pedaço próprio desde F5-2, então a asserção
 * precisa esperar o `import()` resolver — `findBy`, não `getBy`. As demais telas
 * continuam síncronas.
 *
 * O primeiro `import()` do dashboard carrega o Recharts junto, e a
 * transformação sob demanda do Vitest passa do 1 s padrão do `findBy` — com a
 * suíte inteira rodando em paralelo, passa também dos 5 s de timeout do próprio
 * teste. Os dois tetos sobem juntos: subir só o do `findBy` faz o teste morrer
 * antes de ele expirar, com uma mensagem que não explica nada.
 *
 * É limite do ferramental, não da aplicação: no navegador o pedaço já vem
 * compilado e chega em milissegundos.
 */
const CHUNK_TIMEOUT = { timeout: 10_000 };
const CHUNK_TEST_TIMEOUT = 15_000;

describe('casca da aplicacao', () => {
  it('resolve cada tela por URL', () => {
    renderAt('/projects');
    expect(screen.getByRole('heading', { name: 'Projetos' })).toBeInTheDocument();
  });

  it(
    'navega pela sidebar',
    async () => {
      renderAt('/');
      expect(
        await screen.findByRole('heading', { name: 'Dashboard' }, CHUNK_TIMEOUT)
      ).toBeInTheDocument();

      await userEvent.click(screen.getByRole('link', { name: 'Clientes' }));
      expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument();
    },
    CHUNK_TEST_TIMEOUT
  );

  // Não há teste do fallback de `<Suspense>`: depois que o primeiro teste
  // carrega o pedaço, ele fica em cache do módulo e o segundo já renderiza a
  // tela direto. Um teste que só passa em primeiro lugar na fila é pior do que
  // nenhum — o comportamento está coberto pelo `findBy` das rotas divididas.

  it('marca apenas o item da rota ativa', () => {
    renderAt('/teams');
    expect(screen.getByRole('link', { name: 'Equipes' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  it('resolve /projects/new como cadastro, e nao como detalhe de id "new"', () => {
    renderAt('/projects/new');
    expect(screen.getByRole('heading', { name: 'Novo projeto' })).toBeInTheDocument();
  });

  it(
    'redireciona rota desconhecida para o dashboard',
    async () => {
      renderAt('/rota-inexistente');
      expect(
        await screen.findByRole('heading', { name: 'Dashboard' }, CHUNK_TIMEOUT)
      ).toBeInTheDocument();
    },
    CHUNK_TEST_TIMEOUT
  );

  it('exibe o usuario simulado no rodape', () => {
    renderAt('/');
    expect(screen.getByText('Rodrigo Almeida')).toBeInTheDocument();
    expect(screen.getByText('Gerente')).toBeInTheDocument();
  });
});
