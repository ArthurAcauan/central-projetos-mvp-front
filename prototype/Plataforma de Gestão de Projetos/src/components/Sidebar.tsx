import type { View } from "../types";

interface NavItem {
  id: View;
  label: string;
  icon: string;
  group?: string;
}

const nav: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: "⬛", group: "principal" },
  { id: "projects", label: "Projetos", icon: "◧", group: "principal" },
  { id: "users", label: "Usuários", icon: "◉", group: "cadastros" },
  { id: "clients", label: "Clientes", icon: "◈", group: "cadastros" },
  { id: "teams", label: "Equipes", icon: "◎", group: "cadastros" },
];

interface Props {
  current: View;
  onChange: (v: View) => void;
}

export default function Sidebar({ current, onChange }: Props) {
  const groups = ["principal", "cadastros"];

  return (
    <aside className="w-56 min-h-screen bg-slate-900 flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">GP</span>
          </div>
          <div>
            <div className="text-white text-sm font-semibold leading-tight">GestProject</div>
            <div className="text-slate-400 text-[10px] font-mono">TechConsult MVP</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5">
        {groups.map((group) => {
          const items = nav.filter((n) => n.group === group);
          return (
            <div key={group}>
              <div className="text-[10px] font-mono font-medium text-slate-500 uppercase tracking-widest px-2 mb-1.5">
                {group === "principal" ? "Principal" : "Cadastros"}
              </div>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = current === item.id || (current === "project-detail" && item.id === "projects") || (current === "project-new" && item.id === "projects") || (current === "project-edit" && item.id === "projects");
                  return (
                    <button
                      key={item.id}
                      onClick={() => onChange(item.id)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded text-sm transition-colors text-left ${
                        active
                          ? "bg-blue-600 text-white"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      <span className="text-base leading-none">{item.icon}</span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="px-5 py-4 border-t border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-xs text-white font-medium">
            RA
          </div>
          <div>
            <div className="text-slate-200 text-xs font-medium">Rodrigo Almeida</div>
            <div className="text-slate-500 text-[10px] font-mono">Gerente</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
