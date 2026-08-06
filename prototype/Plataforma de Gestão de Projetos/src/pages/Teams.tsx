import { useState } from "react";
import type { Team, Project } from "../types";

interface Props {
  teams: Team[];
  projects: Project[];
  onSave: (t: Team) => void;
}

export default function Teams({ teams, projects, onSave }: Props) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    if (!name.trim()) { setError("Nome é obrigatório"); return false; }
    if (teams.some((t) => t.name.toLowerCase() === name.toLowerCase().trim())) {
      setError("Equipe já cadastrada"); return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({ id: `t${Date.now()}`, name: name.trim(), created_at: new Date().toISOString() });
    setName("");
    setShowForm(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Equipes</h1>
          <p className="text-sm text-slate-500 font-mono mt-0.5">{teams.length} equipes cadastradas</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(""); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
        >
          {showForm ? "Cancelar" : "+ Nova Equipe"}
        </button>
      </div>

      {success && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded px-4 py-2.5">
          Equipe cadastrada com sucesso!
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-5">
          <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest mb-4">Nova Equipe</div>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Nome<span className="text-red-500">*</span></label>
              <input
                className={`w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white ${error ? "border-red-400" : "border-slate-200"}`}
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="Ex.: Squad Alpha"
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((t) => {
          const teamProjects = projects.filter((p) => p.team_id === t.id);
          const active = teamProjects.filter((p) => p.status === "EM_ANDAMENTO" || p.status === "EM_RISCO" || p.status === "PLANEJAMENTO").length;
          const done = teamProjects.filter((p) => p.status === "CONCLUIDO").length;
          return (
            <div key={t.id} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                    {t.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{t.name}</div>
                    <div className="text-[10px] font-mono text-slate-400">
                      desde {new Date(t.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                <div className="text-center">
                  <div className="text-lg font-bold font-mono text-slate-800">{teamProjects.length}</div>
                  <div className="text-[10px] text-slate-400">total</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold font-mono text-blue-600">{active}</div>
                  <div className="text-[10px] text-slate-400">ativos</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold font-mono text-emerald-600">{done}</div>
                  <div className="text-[10px] text-slate-400">concluídos</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
