import { useEffect, useState } from "react";
import type { User, Project } from "./lib/types";
import { api } from "./lib/api";
import { LoginPage } from "./pages/LoginPage";
import { ProjectListPage } from "./pages/ProjectListPage";
import { ProjectPage } from "./pages/ProjectPage";

type View = "login" | "projects" | "project";

export default function App() {
  const [view, setView] = useState<View>("login");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const loadUsers = async () => {
    const u = await api.getUsers();
    setUsers(u);
  };

  const loadProjects = async () => {
    const p = await api.getProjects();
    setProjects(p);
  };

  useEffect(() => {
    loadUsers();
    // Try restoring session from localStorage
    const saved = localStorage.getItem("colabtool_user");
    if (saved) {
      try {
        const user = JSON.parse(saved) as User;
        setCurrentUser(user);
        setView("projects");
        loadProjects();
      } catch {
        localStorage.removeItem("colabtool_user");
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("colabtool_user", JSON.stringify(user));
    loadProjects();
    setView("projects");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("colabtool_user");
    setView("login");
  };

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    setView("project");
  };

  if (view === "login") {
    return <LoginPage users={users} onLogin={handleLogin} onRefresh={loadUsers} />;
  }

  if (view === "projects" && currentUser) {
    return (
      <ProjectListPage
        projects={projects}
        currentUser={currentUser}
        onSelectProject={handleSelectProject}
        onProjectCreated={loadProjects}
        onLogout={handleLogout}
      />
    );
  }

  if (view === "project" && currentUser && selectedProjectId) {
    return (
      <ProjectPage
        projectId={selectedProjectId}
        currentUser={currentUser}
        allUsers={users}
        onBack={() => { setView("projects"); loadProjects(); }}
        onUsersRefresh={loadUsers}
      />
    );
  }

  return null;
}
