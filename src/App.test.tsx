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

describe('casca da aplicacao', () => {
  it('resolve cada tela por URL', () => {
    renderAt('/projects');
    expect(screen.getByRole('heading', { name: 'Projetos' })).toBeInTheDocument();
  });

  it('navega pela sidebar', async () => {
    const user = userEvent.setup();
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Clientes' }));
    expect(screen.getByRole('heading', { name: 'Clientes' })).toBeInTheDocument();
  });

  it('marca apenas o item da rota ativa', () => {
    renderAt('/teams');
    expect(screen.getByRole('link', { name: 'Equipes' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Dashboard' })).not.toHaveAttribute('aria-current');
  });

  it('redireciona rota desconhecida para o dashboard', () => {
    renderAt('/rota-inexistente');
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('exibe o usuario simulado no rodape', () => {
    renderAt('/');
    expect(screen.getByText('Rodrigo Almeida')).toBeInTheDocument();
    expect(screen.getByText('Gerente')).toBeInTheDocument();
  });
});
