import { useState } from "react";
import type { Client, Project } from "../types";

interface Props {
  clients: Client[];
  projects: Project[];
  onSave: (c: Client) => void;
}

export default function Clients({ clients, projects, onSave }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!name.trim()) { setError("Nome é obrigatório"); return false; }
    if (clients.some((c) => c.name.toLowerCase() === name.toLowerCase().trim())) {
      setError("Cliente já cadastrado"); return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const now = new Date().toISOString();
    onSave({ id: `c${Date.now()}`, name: name.trim(), created_at: now, updated_at: now });
    setName("");
    setShowForm(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500 font-mono mt-0.5">{clients.length} clientes cadastrados</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
        >
          {showForm ? "Cancelar" : "+ Novo Cliente"}
        </button>
      </div>

      {success && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded px-4 py-2.5">
          Cliente cadastrado com sucesso!
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-5">
          <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest mb-4">Novo Cliente</div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Nome<span className="text-red-500">*</span></label>
              <input
                className={`w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white ${error ? "border-red-400" : "border-slate-200"}`}
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="Ex.: Grupo Bancário Meridional"
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>
            <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded transition-colors shrink-0">
              Cadastrar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono text-slate-400 uppercase">
              <th className="text-left px-4 py-3 font-medium">Cliente</th>
              <th className="text-left px-4 py-3 font-medium">Projetos</th>
              <th className="text-left px-4 py-3 font-medium">Cadastrado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {clients.map((c) => {
              const count = projects.filter((p) => p.client_id === c.id).length;
              return (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-blue-50 flex items-center justify-center text-[10px] font-mono font-bold text-blue-500">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 rounded px-2 py-0.5">
                      {count} projeto{count !== 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                    {new Date(c.created_at).toLocaleDateString("pt-BR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
