export type Role = "GERENTE" | "COORDENADOR" | "GESTOR_PROJETO";

export type ProjectStatus =
  | "PLANEJAMENTO"
  | "EM_ANDAMENTO"
  | "EM_RISCO"
  | "CONCLUIDO"
  | "CANCELADO";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  created_at: string;
}

export interface Project {
  id: string;
  name: string;
  client_id: string;
  objective: string;
  manager_id: string;
  team_id: string;
  start_date: string;
  deadline: string;
  budget: number;
  budget_spent: number;
  hours_worked: number;
  status: ProjectStatus;
  observations: string | null;
  created_at: string;
  updated_at: string;
}

export type View =
  | "dashboard"
  | "projects"
  | "project-detail"
  | "project-new"
  | "project-edit"
  | "users"
  | "clients"
  | "teams";
