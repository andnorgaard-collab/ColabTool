import type { User, Project, ProjectDetail, Task, Message } from "./types";

const BASE = "/api";

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const api = {
  // Users
  getUsers: () => req<User[]>("/users"),
  createUser: (data: { name: string; email: string; platform: string }) =>
    req<User>("/users", { method: "POST", body: JSON.stringify(data) }),

  // Projects
  getProjects: () => req<Project[]>("/projects"),
  getProject: (id: string) => req<ProjectDetail>(`/projects/${id}`),
  createProject: (data: { name: string; description?: string; created_by: string }) =>
    req<Project>("/projects", { method: "POST", body: JSON.stringify(data) }),
  addMember: (projectId: string, userId: string) =>
    req(`/projects/${projectId}/members`, { method: "POST", body: JSON.stringify({ user_id: userId }) }),
  removeMember: (projectId: string, userId: string) =>
    req(`/projects/${projectId}/members/${userId}`, { method: "DELETE" }),

  // Tasks
  getTasks: (projectId: string) => req<Task[]>(`/projects/${projectId}/tasks`),
  createTask: (projectId: string, data: Partial<Task> & { created_by: string; dependency_ids?: string[] }) =>
    req<Task>(`/projects/${projectId}/tasks`, { method: "POST", body: JSON.stringify(data) }),
  updateTask: (projectId: string, taskId: string, data: Partial<Task>) =>
    req<Task>(`/projects/${projectId}/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteTask: (projectId: string, taskId: string) =>
    req(`/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" }),
  setDependencies: (projectId: string, taskId: string, dependency_ids: string[]) =>
    req<Task>(`/projects/${projectId}/tasks/${taskId}/dependencies`, {
      method: "PUT",
      body: JSON.stringify({ dependency_ids }),
    }),

  // Messages
  getMessages: (projectId: string) => req<Message[]>(`/projects/${projectId}/messages`),
  sendMessage: (projectId: string, data: { user_id: string; content: string; task_id?: string }) =>
    req<Message>(`/projects/${projectId}/messages`, { method: "POST", body: JSON.stringify(data) }),
};
