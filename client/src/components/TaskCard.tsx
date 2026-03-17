import { AlertCircle, Calendar, ChevronDown, ChevronUp, Lock, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn, formatDate } from "../lib/utils";
import type { Task, User, TaskStatus } from "../lib/types";
import { Avatar } from "./Avatar";
import { StatusBadge, PriorityBadge } from "./Badge";

interface TaskCardProps {
  task: Task;
  allTasks: Task[];
  users: User[];
  currentUser: User;
  onUpdate: (taskId: string, data: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onSetDeps: (taskId: string, depIds: string[]) => void;
}

export function TaskCard({ task, allTasks, users, currentUser, onUpdate, onDelete, onSetDeps }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingDeps, setEditingDeps] = useState(false);
  const [selectedDeps, setSelectedDeps] = useState<string[]>(task.dependencies.map((d) => d.id));

  const statusOptions: TaskStatus[] = ["todo", "in_progress", "done"];

  const handleStatusChange = (status: TaskStatus) => {
    if (status === "done" && task.is_blocked) return;
    onUpdate(task.id, { status });
  };

  const saveDeps = () => {
    onSetDeps(task.id, selectedDeps);
    setEditingDeps(false);
  };

  const otherTasks = allTasks.filter((t) => t.id !== task.id);

  return (
    <div className={cn(
      "bg-white rounded-lg border shadow-sm transition-all",
      task.is_blocked ? "border-orange-200 bg-orange-50/30" : "border-border hover:shadow-md"
    )}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              {task.is_blocked && (
                <span title="Blokeret af ufærdige afhængigheder">
                  <Lock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                </span>
              )}
              <h3 className={cn("font-medium text-sm", task.is_blocked && "text-orange-800")}>{task.title}</h3>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.due_date && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {formatDate(task.due_date)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {task.assignee && (
              <Avatar name={task.assignee.name} color={task.assignee.avatar_color} platform={task.assignee.platform} showPlatform size="sm" />
            )}
            <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {task.is_blocked && (
          <div className="mt-2 flex items-center gap-1 text-xs text-orange-600">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            <span>Venter på: {task.blocked_by.map((d) => d.title).join(", ")}</span>
          </div>
        )}
      </div>

      {expanded && (
        <div className="border-t px-4 py-3 space-y-4 bg-gray-50/50 rounded-b-lg">
          {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}

          {/* Status */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={s === "done" && task.is_blocked}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                    task.status === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary",
                    s === "done" && task.is_blocked && "opacity-40 cursor-not-allowed"
                  )}
                >
                  {s === "todo" ? "Ikke startet" : s === "in_progress" ? "I gang" : "Færdig"}
                </button>
              ))}
            </div>
            {task.is_blocked && task.status !== "done" && (
              <p className="text-xs text-orange-600 mt-1">Kan ikke sættes til Færdig - har blokerende afhængigheder</p>
            )}
          </div>

          {/* Assignee */}
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Tildelt til</label>
            <select
              value={task.assigned_to || ""}
              onChange={(e) => onUpdate(task.id, { assigned_to: e.target.value || null } as Partial<Task>)}
              className="text-xs border rounded px-2 py-1 bg-white w-full max-w-xs"
            >
              <option value="">Ingen</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.platform === "microsoft" ? "MS" : u.platform === "google" ? "Google" : "Andet"})</option>
              ))}
            </select>
          </div>

          {/* Dependencies */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-muted-foreground">Afhængigheder</label>
              {!editingDeps ? (
                <button onClick={() => { setSelectedDeps(task.dependencies.map((d) => d.id)); setEditingDeps(true); }} className="text-xs text-primary hover:underline">Rediger</button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={saveDeps} className="text-xs text-green-600 hover:underline">Gem</button>
                  <button onClick={() => setEditingDeps(false)} className="text-xs text-muted-foreground hover:underline">Annuller</button>
                </div>
              )}
            </div>
            {!editingDeps ? (
              task.dependencies.length === 0 ? (
                <p className="text-xs text-muted-foreground">Ingen afhængigheder</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {task.dependencies.map((d) => (
                    <span key={d.id} className={cn(
                      "px-2 py-0.5 rounded text-xs",
                      d.status === "done" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {d.status === "done" ? "✓" : "⏳"} {d.title}
                    </span>
                  ))}
                </div>
              )
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {otherTasks.map((t) => (
                  <label key={t.id} className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedDeps.includes(t.id)}
                      onChange={(e) => {
                        setSelectedDeps(e.target.checked
                          ? [...selectedDeps, t.id]
                          : selectedDeps.filter((id) => id !== t.id)
                        );
                      }}
                    />
                    <span>{t.title}</span>
                    <StatusBadge status={t.status} />
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Delete */}
          <div className="flex justify-end">
            <button
              onClick={() => onDelete(task.id)}
              className="flex items-center gap-1 text-xs text-destructive hover:underline"
            >
              <Trash2 className="w-3 h-3" /> Slet opgave
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
