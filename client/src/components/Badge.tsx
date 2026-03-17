import { cn } from "../lib/utils";
import type { TaskStatus, TaskPriority } from "../lib/types";

const statusConfig: Record<TaskStatus, { label: string; cls: string }> = {
  todo: { label: "Ikke startet", cls: "bg-slate-100 text-slate-600" },
  in_progress: { label: "I gang", cls: "bg-blue-100 text-blue-700" },
  done: { label: "Færdig", cls: "bg-green-100 text-green-700" },
};

const priorityConfig: Record<TaskPriority, { label: string; cls: string }> = {
  low: { label: "Lav", cls: "bg-gray-100 text-gray-600" },
  medium: { label: "Medium", cls: "bg-yellow-100 text-yellow-700" },
  high: { label: "Høj", cls: "bg-red-100 text-red-700" },
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg = statusConfig[status];
  return <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", cfg.cls)}>{cfg.label}</span>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cfg = priorityConfig[priority];
  return <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", cfg.cls)}>{cfg.label}</span>;
}

export function PlatformBadge({ platform }: { platform: "microsoft" | "google" | "other" }) {
  const configs = {
    microsoft: { label: "Microsoft", cls: "bg-blue-50 text-blue-700 border border-blue-200" },
    google: { label: "Google", cls: "bg-red-50 text-red-700 border border-red-200" },
    other: { label: "Andet", cls: "bg-gray-50 text-gray-600 border border-gray-200" },
  };
  const cfg = configs[platform];
  return <span className={cn("px-2 py-0.5 rounded text-xs font-medium", cfg.cls)}>{cfg.label}</span>;
}
