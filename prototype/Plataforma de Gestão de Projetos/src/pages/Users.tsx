import { useState } from "react";
import type { User, Role } from "../types";

interface Props {
  users: User[];
  onSave: (u: User) => void;
}

const ROLES: { value: Role; label: string }[] = [
  { value: "GERENTE", label: "Gerente" },
  { value: "COORDENADOR", label: "Coordenador" },
  { value: "GESTOR_PROJETO", label: "Gestor de Projeto" },
];

const ROLE_COLORS: Record<Role, string> = {
  GERENTE: "bg-purple-50 text-purple-700 border-purple-200",
  COORDENADOR: "bg-blue-50 text-blue-700 border-blue-200",
  GESTOR_PROJETO: "bg-slate-50 text-slate-600 border-slate-200",
};

const ROLE_LABELS: Record<Role, string> = {
  GERENTE: "Gerente",
  COORDENADOR: "Coordenador",
  GESTOR_PROJETO: "Gestor de Projeto",
};

type FormState = { name: string; email: string; role: Role };
const blank: FormState = { name: "", email: "", role: "GESTOR_PROJETO" };

export default function Users({ users, onSave }: Props) {
  const [form, setForm] = useState<FormState>(blank);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [showForm, setShowForm] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k: keyof FormState, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const validate = () => {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = "Nome é obrigatório";
    if (!form.email.trim()) e.email = "E-mail é obrigatório";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "E-mail inválido";
    else if (users.some((u) => u.email === form.email.trim())) e.email = "E-mail já cadastrado";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({ id: `u${Date.now()}`, name: form.name.trim(), email: form.email.trim(), role: form.role, created_at: new Date().toISOString() });
    setForm(blank);
    setShowForm(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const inputCls = (err?: string) =>
    `w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white ${err ? "border-red-400" : "border-slate-200"}`;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Usuários</h1>
          <p className="text-sm text-slate-500 font-mono mt-0.5">{users.length} usuários cadastrados</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setErrors({}); }}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
        >
          {showForm ? "Cancelar" : "+ Novo Usuário"}
        </button>
      </div>

      {success && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded px-4 py-2.5">
          Usuário cadastrado com sucesso!
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-5 mb-5">
          <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest mb-4">Novo Usuário</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nome<span className="text-red-500">*</span></label>
              <input className={inputCls(errors.name)} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nome completo" />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">E-mail<span className="text-red-500">*</span></label>
              <input type="email" className={inputCls(errors.email)} value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="usuario@empresa.com.br" />
              {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Perfil de Acesso<span className="text-red-500">*</span></label>
              <select className={inputCls()} value={form.role} onChange={(e) => set("role", e.target.value as Role)}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded transition-colors">
              Cadastrar
            </button>
            <button onClick={() => { setShowForm(false); setForm(blank); setErrors({}); }} className="border border-slate-200 text-slate-600 text-sm font-medium px-5 py-2 rounded transition-colors hover:border-slate-300">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-mono text-slate-400 uppercase">
              <th className="text-left px-4 py-3 font-medium">Nome</th>
              <th className="text-left px-4 py-3 font-medium">E-mail</th>
              <th className="text-left px-4 py-3 font-medium">Perfil</th>
              <th className="text-left px-4 py-3 font-medium">Cadastrado em</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
                      {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <span className="font-medium text-slate-800">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`text-[11px] font-mono border rounded px-2 py-0.5 ${ROLE_COLORS[u.role]}`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                  {new Date(u.created_at).toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
