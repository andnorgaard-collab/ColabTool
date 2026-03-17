import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft, MessageSquare, CheckSquare, Users,
  Plus, UserPlus, UserMinus, RefreshCw
} from "lucide-react";
import type { Task, User, ProjectDetail } from "../lib/types";
import { api } from "../lib/api";
import { TaskCard } from "../components/TaskCard";
import { NewTaskForm } from "../components/NewTaskForm";
import { Chat } from "../components/Chat";
import { Avatar } from "../components/Avatar";
import { PlatformBadge, StatusBadge } from "../components/Badge";

type Tab = "tasks" | "chat" | "team";

interface ProjectPageProps {
  projectId: string;
  currentUser: User;
  allUsers: User[];
  onBack: () => void;
  onUsersRefresh: () => void;
}

export function ProjectPage({ projectId, currentUser, allUsers, onBack, onUsersRefresh }: ProjectPageProps) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tab, setTab] = useState<Tab>("tasks");
  const [showNewTask, setShowNewTask] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadProject = useCallback(async () => {
    const [proj, taskList] = await Promise.all([
      api.getProject(projectId),
      api.getTasks(projectId),
    ]);
    setProject(proj);
    setTasks(taskList);
    setLoading(false);
  }, [projectId]);

  useEffect(() => { loadProject(); }, [loadProject]);

  const handleUpdateTask = async (taskId: string, data: Partial<Task>) => {
    try {
      const updated = await api.updateTask(projectId, taskId, data);
      setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t));
      // Refresh all tasks to update blocked status
      const fresh = await api.getTasks(projectId);
      setTasks(fresh);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Fejl ved opdatering");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Slet denne opgave?")) return;
    await api.deleteTask(projectId, taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleSetDeps = async (taskId: string, depIds: string[]) => {
    try {
      const updated = await api.setDependencies(projectId, taskId, depIds);
      const fresh = await api.getTasks(projectId);
      setTasks(fresh.map((t) => t.id === taskId ? updated : t));
      // Full refresh to update all blocked statuses
      setTasks(fresh);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Fejl");
    }
  };

  const handleCreateTask = async (data: { title: string; description: string; priority: import("../lib/types").TaskPriority; assigned_to: string; due_date: string; dependency_ids: string[] }) => {
    await api.createTask(projectId, { ...data, created_by: currentUser.id });
    const fresh = await api.getTasks(projectId);
    setTasks(fresh);
    setShowNewTask(false);
  };

  const handleAddMember = async (userId: string) => {
    await api.addMember(projectId, userId);
    await loadProject();
    setAddingMember(false);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Fjern dette teammedlem?")) return;
    await api.removeMember(projectId, userId);
    await loadProject();
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const memberIds = new Set(project.members.map((m) => m.id));
  const nonMembers = allUsers.filter((u) => !memberIds.has(u.id));

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === "todo"),
    in_progress: tasks.filter((t) => t.status === "in_progress"),
    done: tasks.filter((t) => t.status === "done"),
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate">{project.name}</h1>
            {project.description && <p className="text-xs text-muted-foreground truncate">{project.description}</p>}
          </div>
          <div className="flex -space-x-2">
            {project.members.slice(0, 5).map((m) => (
              <div key={m.id} className="ring-2 ring-white rounded-full">
                <Avatar name={m.name} color={m.avatar_color} platform={m.platform} showPlatform size="sm" />
              </div>
            ))}
            {project.members.length > 5 && (
              <div className="w-7 h-7 rounded-full bg-muted border-2 border-white flex items-center justify-center text-xs text-muted-foreground">
                +{project.members.length - 5}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="max-w-6xl mx-auto flex">
          {([
            { id: "tasks", label: "Opgaver", icon: CheckSquare, count: tasks.length as number | undefined },
            { id: "chat", label: "Chat", icon: MessageSquare, count: undefined as number | undefined },
            { id: "team", label: "Team", icon: Users, count: project.members.length as number | undefined },
          ] as const).map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {count !== undefined && (
                <span className="bg-secondary rounded-full px-1.5 py-0.5 text-xs">{count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-6 py-6">
        {/* Tasks Tab */}
        {tab === "tasks" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{tasksByStatus.todo.length} ikke startet</span>
                <span className="text-blue-600">{tasksByStatus.in_progress.length} i gang</span>
                <span className="text-green-600">{tasksByStatus.done.length} færdige</span>
              </div>
              <button
                onClick={() => setShowNewTask(!showNewTask)}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
              >
                <Plus className="w-4 h-4" /> Ny opgave
              </button>
            </div>

            {showNewTask && (
              <div className="mb-4">
                <NewTaskForm
                  users={project.members}
                  allTasks={tasks}
                  currentUser={currentUser}
                  onSubmit={handleCreateTask}
                  onCancel={() => setShowNewTask(false)}
                />
              </div>
            )}

            {/* Kanban columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(["todo", "in_progress", "done"] as const).map((status) => {
                const labels = { todo: "Ikke startet", in_progress: "I gang", done: "Færdig" };
                const colors = { todo: "bg-slate-100", in_progress: "bg-blue-50", done: "bg-green-50" };
                return (
                  <div key={status} className={`rounded-xl p-3 ${colors[status]}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <StatusBadge status={status} />
                      <span className="text-xs text-muted-foreground">{tasksByStatus[status].length}</span>
                    </div>
                    <div className="space-y-2">
                      {tasksByStatus[status].map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          allTasks={tasks}
                          users={project.members}
                          currentUser={currentUser}
                          onUpdate={handleUpdateTask}
                          onDelete={handleDeleteTask}
                          onSetDeps={handleSetDeps}
                        />
                      ))}
                      {tasksByStatus[status].length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">Ingen opgaver</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {tab === "chat" && (
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden" style={{ height: "calc(100vh - 220px)" }}>
            <Chat projectId={projectId} currentUser={currentUser} tasks={tasks} />
          </div>
        )}

        {/* Team Tab */}
        {tab === "team" && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Teammedlemmer</h2>
              <button
                onClick={() => setAddingMember(!addingMember)}
                className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90"
              >
                <UserPlus className="w-4 h-4" /> Tilføj
              </button>
            </div>

            {addingMember && nonMembers.length > 0 && (
              <div className="bg-white border rounded-xl p-4 mb-4 shadow-sm">
                <h3 className="text-sm font-medium mb-3">Tilføj eksisterende bruger</h3>
                <div className="space-y-2">
                  {nonMembers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleAddMember(u.id)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg border hover:bg-secondary text-left"
                    >
                      <Avatar name={u.name} color={u.avatar_color} platform={u.platform} showPlatform size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                      <PlatformBadge platform={u.platform} />
                    </button>
                  ))}
                </div>
                {nonMembers.length === 0 && <p className="text-sm text-muted-foreground">Alle brugere er allerede med.</p>}
              </div>
            )}

            <div className="space-y-2">
              {project.members.map((m) => {
                const memberTasks = tasks.filter((t) => t.assigned_to === m.id);
                const doneTasks = memberTasks.filter((t) => t.status === "done").length;
                return (
                  <div key={m.id} className="bg-white rounded-xl border p-4 flex items-center gap-4">
                    <Avatar name={m.name} color={m.avatar_color} platform={m.platform} showPlatform />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{m.name}</span>
                        {m.role === "owner" && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Ejer</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{m.email}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {memberTasks.length} opgaver tildelt · {doneTasks} færdige
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PlatformBadge platform={m.platform} />
                      {m.id !== currentUser.id && m.role !== "owner" && (
                        <button onClick={() => handleRemoveMember(m.id)} title="Fjern fra projekt" className="text-muted-foreground hover:text-destructive">
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
