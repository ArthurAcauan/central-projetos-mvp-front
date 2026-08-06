import { NavLink } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { paths, type AppPath } from '@/routes/paths';
import { userRoleLabels } from '@/types/user';

/**
 * Sidebar da aplicação. Layout portado do Sidebar.tsx do protótipo (ADR-0003),
 * trocando a navegação por `useState` do protótipo por NavLink (L-002).
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

export default function Sidebar() {
  const user = useCurrentUser();

  return (
    <aside className="flex min-h-screen w-56 shrink-0 flex-col bg-slate-900">
      <div className="border-b border-slate-800 px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-blue-500">
            <span className="text-xs font-bold text-white">GP</span>
          </div>
          <div>
            <div className="text-sm leading-tight font-semibold text-white">GestProject</div>
            <div className="font-mono text-[10px] text-slate-400">TechConsult MVP</div>
          </div>
        </div>
      </div>

      <nav aria-label="Navegação principal" className="flex-1 space-y-5 px-3 py-4">
        {(Object.keys(groupLabels) as NavGroup[]).map((group) => (
          <div key={group}>
            <div className="mb-1.5 px-2 font-mono text-[10px] font-medium tracking-widest text-slate-500 uppercase">
              {groupLabels[group]}
            </div>
            <div className="space-y-0.5">
              {navItems
                .filter((item) => item.group === group)
                .map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === paths.dashboard}
                    className={({ isActive }) =>
                      `flex w-full items-center gap-2.5 rounded px-2.5 py-2 text-left text-sm transition-colors ${
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
            <div className="font-mono text-[10px] text-slate-500">{userRoleLabels[user.role]}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
