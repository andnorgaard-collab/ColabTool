export type Platform = "microsoft" | "google" | "other";
export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type ProjectRole = "owner" | "member";

export interface User {
  id: string;
  name: string;
  email: string;
  platform: Platform;
  avatar_color: string;
  created_at: string;
}

export interface ProjectMember extends User {
  role: ProjectRole;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  creator_name: string;
  created_at: string;
  member_count: number;
  task_count: number;
}

export interface ProjectDetail extends Project {
  members: ProjectMember[];
}

export interface TaskDep {
  id: string;
  title: string;
  status: TaskStatus;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to: string | null;
  assignee: User | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  dependencies: TaskDep[];
  is_blocked: boolean;
  blocked_by: TaskDep[];
}

export interface Message {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  user_platform: Platform;
  user_avatar_color: string;
  content: string;
  task_id: string | null;
  task_title: string | null;
  created_at: string;
}
