import { useState } from "react";
import { Plus, FolderOpen, Users, CheckSquare, LogOut } from "lucide-react";
import type { Project, User } from "../lib/types";
import { api } from "../lib/api";
import { Avatar } from "../components/Avatar";
import { formatDate } from "../lib/utils";

interface ProjectListPageProps {
  projects: Project[];
  currentUser: User;
  onSelectProject: (projectId: string) => void;
  onProjectCreated: () => void;
  onLogout: () => void;
}

export function ProjectListPage({ projects, currentUser, onSelectProject, onProjectCreated, onLogout }: ProjectListPageProps) {
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.createProject({ name, description, created_by: currentUser.id });
      setName("");
      setDescription("");
      setShowNew(false);
      onProjectCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="text-xl font-bold">ColabTool</h1>
          </div>
          <div className="flex items-center gap-3">
            <Avatar name={currentUser.name} color={currentUser.avatar_color} platform={currentUser.platform} showPlatform size="sm" />
            <span className="text-sm font-medium hidden sm:block">{currentUser.name}</span>
            <button onClick={onLogout} title="Log ud" className="text-muted-foreground hover:text-foreground p-1">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Projekter</h2>
          <button
            onClick={() => setShowNew(!showNew)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nyt projekt
          </button>
        </div>

        {showNew && (
          <div className="bg-white border rounded-xl p-4 mb-6 shadow-sm">
            <h3 className="font-medium mb-3">Opret nyt projekt</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Projektnavn *" required className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Beskrivelse (valgfrit)" rows={2} className="w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowNew(false)} className="px-3 py-2 text-sm rounded-lg border hover:bg-secondary">Annuller</button>
                <button type="submit" disabled={loading} className="px-3 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {loading ? "Opretter..." : "Opret projekt"}
                </button>
              </div>
            </form>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Ingen projekter endnu. Opret dit første!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((p) => (
              <button
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="bg-white rounded-xl border p-5 text-left hover:shadow-md hover:border-primary/40 transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold group-hover:text-primary transition-colors">{p.name}</h3>
                </div>
                {p.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{p.description}</p>}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{p.member_count}</span>
                  <span className="flex items-center gap-1"><CheckSquare className="w-3 h-3" />{p.task_count} opgaver</span>
                  <span>{formatDate(p.created_at)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
