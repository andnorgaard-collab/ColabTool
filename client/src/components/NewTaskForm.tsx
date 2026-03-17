import { useState } from "react";
import { X } from "lucide-react";
import type { User, Task, TaskPriority } from "../lib/types";

interface NewTaskFormProps {
  users: User[];
  allTasks: Task[];
  currentUser: User;
  onSubmit: (data: { title: string; description: string; priority: TaskPriority; assigned_to: string; due_date: string; dependency_ids: string[] }) => void;
  onCancel: () => void;
}

export function NewTaskForm({ users, allTasks, currentUser, onSubmit, onCancel }: NewTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assigned_to, setAssignedTo] = useState("");
  const [due_date, setDueDate] = useState("");
  const [dependency_ids, setDependencyIds] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title, description, priority, assigned_to, due_date, dependency_ids });
  };

  return (
    <div className="bg-white rounded-lg border border-primary/40 shadow-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Ny opgave</h3>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Opgavetitel *"
          className="w-full text-sm border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beskrivelse (valgfrit)"
          rows={2}
          className="w-full text-sm border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Prioritet</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="w-full text-xs border rounded px-2 py-1.5">
              <option value="low">Lav</option>
              <option value="medium">Medium</option>
              <option value="high">Høj</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Deadline</label>
            <input type="date" value={due_date} onChange={(e) => setDueDate(e.target.value)} className="w-full text-xs border rounded px-2 py-1.5" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Tildel til</label>
          <select value={assigned_to} onChange={(e) => setAssignedTo(e.target.value)} className="w-full text-xs border rounded px-2 py-1.5">
            <option value="">Ingen</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.platform === "microsoft" ? "MS" : u.platform === "google" ? "Google" : "Andet"})</option>
            ))}
          </select>
        </div>
        {allTasks.length > 0 && (
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Afhænger af</label>
            <div className="space-y-1 max-h-28 overflow-y-auto border rounded p-2">
              {allTasks.map((t) => (
                <label key={t.id} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dependency_ids.includes(t.id)}
                    onChange={(e) =>
                      setDependencyIds(e.target.checked ? [...dependency_ids, t.id] : dependency_ids.filter((id) => id !== t.id))
                    }
                  />
                  {t.title}
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs rounded border hover:bg-secondary">Annuller</button>
          <button type="submit" className="px-3 py-1.5 text-xs rounded bg-primary text-primary-foreground hover:bg-primary/90">Opret opgave</button>
        </div>
      </form>
    </div>
  );
}
