import { NavLink } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { paths, type AppPath } from '@/routes/paths';
import { userRoleLabels } from '@/types/user';

/**
 * Sidebar da aplicação. Layout portado do Sidebar.tsx do protótipo (ADR-0003),
 * trocando a navegação por `useState` do protótipo por NavLink (L-002).
 *
 * Coluna fixa a partir de `lg`; abaixo disso é a gaveta que o `AppShell` abre
 * (F5-2). Fechada, sai do fluxo com `hidden` — e não deslocada para fora da
 * tela —, para o Tab não percorrer uma navegação invisível.
 *
 * Sobre fundo escuro, `slate-400` é o tom mais fraco que ainda passa em
 * contraste (6,8:1); `slate-500` fica em 3,7:1 e não serve para texto. É por
 * isso que os rótulos aqui não acompanham o `slate-500` usado no conteúdo
 * claro. O anel de foco também muda: branco, porque o azul do `--ring` sobre
 * `slate-900` fica no limite.
 */

type NavGroup = 'principal' | 'cadastros';

interface NavItem {
  to: AppPath;
  label: string;
  icon: string;
  group: NavGroup;
}

const navItems: NavItem[] = [
  { to: paths.dashboard, label: 'Dashboard', icon: '⬛', group: 'principal' },
  { to: paths.projects, label: 'Projetos', icon: '◧', group: 'principal' },
  { to: paths.users, label: 'Usuários', icon: '◉', group: 'cadastros' },
  { to: paths.clients, label: 'Clientes', icon: '◈', group: 'cadastros' },
  { to: paths.teams, label: 'Equipes', icon: '◎', group: 'cadastros' },
];

const groupLabels: Record<NavGroup, string> = {
  principal: 'Principal',
  cadastros: 'Cadastros',
};

export interface SidebarProps {
  /** Estado da gaveta em telas estreitas. Ignorado a partir de `lg`. */
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const user = useCurrentUser();

  return (
    <aside
      className={`min-h-screen w-56 shrink-0 flex-col overflow-y-auto bg-slate-900 ${
        isOpen
          ? 'fixed inset-y-0 left-0 z-40 flex shadow-xl lg:static lg:z-auto lg:shadow-none'
          : 'hidden lg:flex'
      }`}
      id="navegacao-principal"
    >
      <div className="flex items-center justify-between border-b border-slate-800 px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-500">
            <span className="text-xs font-bold text-white">GP</span>
          </div>
          <div>
            <div className="text-sm leading-tight font-semibold text-white">GestProject</div>
            <div className="font-mono text-[10px] text-slate-400">TechConsult MVP</div>
          </div>
        </div>
        <button
          className="rounded px-2 py-1 text-sm text-slate-400 transition-colors hover:text-white focus-visible:outline-white lg:hidden"
          onClick={onClose}
          type="button"
        >
          <span aria-hidden="true">✕</span>
          <span className="sr-only">Fechar menu</span>
        </button>
      </div>

      <nav aria-label="Navegação principal" className="flex-1 space-y-5 px-3 py-4">
        {(Object.keys(groupLabels) as NavGroup[]).map((group) => (
          <div key={group}>
            <div className="mb-1.5 px-2 font-mono text-[10px] font-medium tracking-widest text-slate-400 uppercase">
              {groupLabels[group]}
            </div>
            <div className="space-y-0.5">
              {navItems
                .filter((item) => item.group === group)
                .map((item) => (
                  <NavLink
                    key={item.to}
                    // Fecha a gaveta ao navegar: em telas estreitas ela cobre a
                    // tela que a pessoa acabou de pedir.
                    onClick={onClose}
                    to={item.to}
                    end={item.to === paths.dashboard}
                    className={({ isActive }) =>
                      `flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm transition-colors focus-visible:outline-white ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <span aria-hidden="true" className="text-base leading-none">
                      {item.icon}
                    </span>
                    {item.label}
                  </NavLink>
                ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-800 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-700 text-xs font-medium text-white">
            {user.initials}
          </div>
          <div>
            <div className="text-xs font-medium text-slate-200">{user.name}</div>
            <div className="font-mono text-[10px] text-slate-400">{userRoleLabels[user.role]}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
