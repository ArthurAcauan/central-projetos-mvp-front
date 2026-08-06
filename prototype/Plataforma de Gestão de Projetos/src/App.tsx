import { useState } from "react";
import type { View, Project, User, Client, Team } from "./types";
import {
  users as initialUsers,
  clients as initialClients,
  teams as initialTeams,
  projects as initialProjects,
} from "./data/mockData";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectForm from "./pages/ProjectForm";
import Users from "./pages/Users";
import Clients from "./pages/Clients";
import Teams from "./pages/Teams";

export default function App() {
  const [view, setView] = useState<View>("dashboard");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [teams, setTeams] = useState<Team[]>(initialTeams);

  const navigate = (v: View) => {
    setView(v);
    if (v !== "project-detail" && v !== "project-edit") setSelectedProjectId(null);
  };

  const viewProject = (id: string) => {
    setSelectedProjectId(id);
    setView("project-detail");
  };

  const editProject = (id: string) => {
    setSelectedProjectId(id);
    setView("project-edit");
  };

  const saveProject = (p: Project) => {
    setProjects((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = p;
        return updated;
      }
      return [...prev, p];
    });
    setSelectedProjectId(p.id);
    setView("project-detail");
  };

  const selectedProject = selectedProjectId ? projects.find((p) => p.id === selectedProjectId) : undefined;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar current={view} onChange={navigate} />

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {view === "dashboard" && (
          <Dashboard
            projects={projects}
            clients={clients}
            users={users}
            onViewProject={viewProject}
          />
        )}

        {view === "projects" && (
          <Projects
            projects={projects}
            clients={clients}
            users={users}
            teams={teams}
            onViewProject={viewProject}
            onNewProject={() => navigate("project-new")}
          />
        )}

        {view === "project-detail" && selectedProject && (
          <ProjectDetail
            project={selectedProject}
            clients={clients}
            users={users}
            teams={teams}
            onBack={() => navigate("projects")}
            onEdit={editProject}
          />
        )}

        {view === "project-new" && (
          <ProjectForm
            clients={clients}
            users={users}
            teams={teams}
            onSave={saveProject}
            onCancel={() => navigate("projects")}
          />
        )}

        {view === "project-edit" && selectedProject && (
          <ProjectForm
            project={selectedProject}
            clients={clients}
            users={users}
            teams={teams}
            onSave={saveProject}
            onCancel={() => { setView("project-detail"); }}
          />
        )}

        {view === "users" && (
          <Users
            users={users}
            onSave={(u) => setUsers((prev) => [...prev, u])}
          />
        )}

        {view === "clients" && (
          <Clients
            clients={clients}
            projects={projects}
            onSave={(c) => setClients((prev) => [...prev, c])}
          />
        )}

        {view === "teams" && (
          <Teams
            teams={teams}
            projects={projects}
            onSave={(t) => setTeams((prev) => [...prev, t])}
          />
        )}
      </main>
    </div>
  );
}
