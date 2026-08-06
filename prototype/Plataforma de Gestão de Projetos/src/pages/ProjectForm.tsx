import { useState, useEffect } from "react";
import type { Project, Client, User, Team, ProjectStatus } from "../types";

interface Props {
  project?: Project;
  clients: Client[];
  users: User[];
  teams: Team[];
  onSave: (p: Project) => void;
  onCancel: () => void;
}

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "PLANEJAMENTO", label: "Planejamento" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "EM_RISCO", label: "Em risco" },
  { value: "CONCLUIDO", label: "Concluído" },
  { value: "CANCELADO", label: "Cancelado" },
];

type FormState = {
  name: string;
  client_id: string;
  objective: string;
  manager_id: string;
  team_id: string;
  start_date: string;
  deadline: string;
  budget: string;
  budget_spent: string;
  hours_worked: string;
  status: ProjectStatus;
  observations: string;
};

const blank: FormState = {
  name: "",
  client_id: "",
  objective: "",
  manager_id: "",
  team_id: "",
  start_date: "",
  deadline: "",
  budget: "",
  budget_spent: "0",
  hours_worked: "0",
  status: "PLANEJAMENTO",
  observations: "",
};

export default function ProjectForm({ project, clients, users, teams, onSave, onCancel }: Props) {
  const isEdit = !!project;
  const [form, setForm] = useState<FormState>(blank);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        client_id: project.client_id,
        objective: project.objective,
        manager_id: project.manager_id,
        team_id: project.team_id,
        start_date: project.start_date,
        deadline: project.deadline,
        budget: String(project.budget),
        budget_spent: String(project.budget_spent),
        hours_worked: String(project.hours_worked),
        status: project.status,
        observations: project.observations ?? "",
      });
    }
  }, [project]);

  const set = (key: keyof FormState, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = "Nome é obrigatório";
    if (!form.client_id) e.client_id = "Selecione um cliente";
    if (!form.objective.trim()) e.objective = "Objetivo é obrigatório";
    if (!form.manager_id) e.manager_id = "Selecione um gestor";
    if (!form.team_id) e.team_id = "Selecione uma equipe";
    if (!form.start_date) e.start_date = "Data de início é obrigatória";
    if (!form.deadline) e.deadline = "Prazo final é obrigatório";
    if (form.start_date && form.deadline && form.deadline < form.start_date)
      e.deadline = "Prazo deve ser igual ou posterior à data de início";
    const budget = parseFloat(form.budget);
    if (isNaN(budget) || budget < 0) e.budget = "Orçamento deve ser ≥ 0";
    const spent = parseFloat(form.budget_spent);
    if (isNaN(spent) || spent < 0) e.budget_spent = "Orçamento consumido deve ser ≥ 0";
    const hours = parseFloat(form.hours_worked);
    if (isNaN(hours) || hours < 0) e.hours_worked = "Horas devem ser ≥ 0";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const now = new Date().toISOString();
    const saved: Project = {
      id: project?.id ?? `p${Date.now()}`,
      name: form.name.trim(),
      client_id: form.client_id,
      objective: form.objective.trim(),
      manager_id: form.manager_id,
      team_id: form.team_id,
      start_date: form.start_date,
      deadline: form.deadline,
      budget: parseFloat(form.budget),
      budget_spent: parseFloat(form.budget_spent),
      hours_worked: parseFloat(form.hours_worked),
      status: form.status,
      observations: form.observations.trim() || null,
      created_at: project?.created_at ?? now,
      updated_at: now,
    };
    onSave(saved);
  };

  const Field = ({
    label, id, required, error, children,
  }: { label: string; id: string; required?: boolean; error?: string; children: React.ReactNode }) => (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );

  const inputCls = (err?: string) =>
    `w-full border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-shadow ${err ? "border-red-400" : "border-slate-200"}`;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 text-sm flex items-center gap-1 transition-colors">
          ← Cancelar
        </button>
        <div className="w-px h-5 bg-slate-200" />
        <h1 className="text-xl font-semibold text-slate-900">{isEdit ? "Editar Projeto" : "Novo Projeto"}</h1>
      </div>

      <div className="max-w-3xl space-y-4">
        {/* Basic */}
        <section className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest mb-4">Informações Básicas</div>
          <div className="grid grid-cols-1 gap-4">
            <Field label="Nome do Projeto" id="name" required error={errors.name}>
              <input id="name" className={inputCls(errors.name)} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex.: Plataforma de Open Banking" />
            </Field>
            <Field label="Objetivo" id="objective" required error={errors.objective}>
              <textarea id="objective" rows={3} className={inputCls(errors.objective)} value={form.objective} onChange={(e) => set("objective", e.target.value)} placeholder="Descreva o objetivo do projeto..." />
            </Field>
            <Field label="Observações" id="observations" error={errors.observations}>
              <textarea id="observations" rows={2} className={inputCls()} value={form.observations} onChange={(e) => set("observations", e.target.value)} placeholder="Informações adicionais (opcional)" />
            </Field>
          </div>
        </section>

        {/* Parties */}
        <section className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest mb-4">Responsáveis</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Cliente" id="client_id" required error={errors.client_id}>
              <select id="client_id" className={inputCls(errors.client_id)} value={form.client_id} onChange={(e) => set("client_id", e.target.value)}>
                <option value="">Selecione...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Gestor Responsável" id="manager_id" required error={errors.manager_id}>
              <select id="manager_id" className={inputCls(errors.manager_id)} value={form.manager_id} onChange={(e) => set("manager_id", e.target.value)}>
                <option value="">Selecione...</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </Field>
            <Field label="Equipe" id="team_id" required error={errors.team_id}>
              <select id="team_id" className={inputCls(errors.team_id)} value={form.team_id} onChange={(e) => set("team_id", e.target.value)}>
                <option value="">Selecione...</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
          </div>
        </section>

        {/* Dates & Status */}
        <section className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest mb-4">Prazo e Status</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Data de Início" id="start_date" required error={errors.start_date}>
              <input id="start_date" type="date" className={inputCls(errors.start_date)} value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
            </Field>
            <Field label="Prazo Final" id="deadline" required error={errors.deadline}>
              <input id="deadline" type="date" className={inputCls(errors.deadline)} value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
            </Field>
            <Field label="Status" id="status" required>
              <select id="status" className={inputCls()} value={form.status} onChange={(e) => set("status", e.target.value as ProjectStatus)}>
                {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>
        </section>

        {/* Financials */}
        <section className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="text-xs font-mono font-medium text-slate-400 uppercase tracking-widest mb-4">Financeiro e Horas</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Orçamento Previsto (R$)" id="budget" required error={errors.budget}>
              <input id="budget" type="number" min="0" step="0.01" className={inputCls(errors.budget)} value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="0,00" />
            </Field>
            <Field label="Orçamento Consumido (R$)" id="budget_spent" required error={errors.budget_spent}>
              <input id="budget_spent" type="number" min="0" step="0.01" className={inputCls(errors.budget_spent)} value={form.budget_spent} onChange={(e) => set("budget_spent", e.target.value)} placeholder="0,00" />
            </Field>
            <Field label="Horas Realizadas" id="hours_worked" required error={errors.hours_worked}>
              <input id="hours_worked" type="number" min="0" step="0.5" className={inputCls(errors.hours_worked)} value={form.hours_worked} onChange={(e) => set("hours_worked", e.target.value)} placeholder="0" />
            </Field>
          </div>
          {form.budget && form.budget_spent && parseFloat(form.budget_spent) > parseFloat(form.budget) && (
            <p className="text-xs text-orange-600 mt-2 font-mono">
              Atenção: orçamento consumido ultrapassa o previsto ({((parseFloat(form.budget_spent) / parseFloat(form.budget)) * 100).toFixed(1)}%)
            </p>
          )}
        </section>

        {/* Actions */}
        <div className="flex gap-3 pb-6">
          <button
            onClick={handleSubmit}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded transition-colors"
          >
            {isEdit ? "Salvar Alterações" : "Cadastrar Projeto"}
          </button>
          <button
            onClick={onCancel}
            className="border border-slate-200 hover:border-slate-300 text-slate-600 text-sm font-medium px-6 py-2.5 rounded transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
