import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";

const router = Router({ mergeParams: true });

function enrichTask(task: Record<string, unknown>) {
  const deps = db.prepare(`
    SELECT t.id, t.title, t.status FROM tasks t
    JOIN task_dependencies td ON td.depends_on_id = t.id
    WHERE td.task_id = ?
  `).all(task.id as string) as { id: string; title: string; status: string }[];

  const blockedBy = deps.filter((d) => d.status !== "done");
  return {
    ...task,
    dependencies: deps,
    is_blocked: blockedBy.length > 0,
    blocked_by: blockedBy,
    assignee: task.assigned_to
      ? db.prepare("SELECT id, name, email, platform, avatar_color FROM users WHERE id = ?").get(task.assigned_to as string)
      : null,
  };
}

router.get("/", (req, res) => {
  const { projectId } = req.params as { projectId: string };
  const tasks = db.prepare(`
    SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at ASC
  `).all(projectId) as Record<string, unknown>[];
  res.json(tasks.map(enrichTask));
});

router.post("/", (req, res) => {
  const { projectId } = req.params as { projectId: string };
  const { title, description, priority, assigned_to, due_date, created_by, dependency_ids } = req.body;
  if (!title || !created_by) { res.status(400).json({ error: "title and created_by required" }); return; }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO tasks (id, project_id, title, description, priority, assigned_to, due_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, projectId, title, description || null, priority || "medium", assigned_to || null, due_date || null, created_by);

  if (Array.isArray(dependency_ids)) {
    for (const depId of dependency_ids) {
      db.prepare("INSERT INTO task_dependencies (task_id, depends_on_id) VALUES (?, ?)").run(id, depId);
    }
  }

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as Record<string, unknown>;
  res.status(201).json(enrichTask(task));
});

router.patch("/:taskId", (req, res) => {
  const { projectId, taskId } = req.params as { projectId: string; taskId: string };
  const { title, description, status, priority, assigned_to, due_date } = req.body;
  const task = db.prepare("SELECT * FROM tasks WHERE id = ? AND project_id = ?").get(taskId, projectId) as Record<string, unknown> | undefined;
  if (!task) { res.status(404).json({ error: "Not found" }); return; }

  // Prevent completing blocked tasks
  if (status === "done") {
    const blocked = db.prepare(`
      SELECT COUNT(*) as n FROM task_dependencies td
      JOIN tasks t ON t.id = td.depends_on_id
      WHERE td.task_id = ? AND t.status != 'done'
    `).get(taskId) as { n: number };
    if (blocked.n > 0) {
      res.status(400).json({ error: "Task er blokeret af ufærdige afhængigheder" });
      return;
    }
  }

  db.prepare(`
    UPDATE tasks SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      status = COALESCE(?, status),
      priority = COALESCE(?, priority),
      assigned_to = CASE WHEN ? IS NOT NULL THEN ? ELSE assigned_to END,
      due_date = COALESCE(?, due_date),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    title ?? null, description ?? null, status ?? null, priority ?? null,
    assigned_to !== undefined ? assigned_to : null, assigned_to ?? null,
    due_date ?? null, taskId
  );

  const updated = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as Record<string, unknown>;
  res.json(enrichTask(updated));
});

router.delete("/:taskId", (req, res) => {
  const { projectId, taskId } = req.params as { projectId: string; taskId: string };
  db.prepare("DELETE FROM tasks WHERE id = ? AND project_id = ?").run(taskId, projectId);
  res.json({ ok: true });
});

router.put("/:taskId/dependencies", (req, res) => {
  const { taskId } = req.params as { projectId: string; taskId: string };
  const { dependency_ids } = req.body;
  db.prepare("DELETE FROM task_dependencies WHERE task_id = ?").run(taskId);
  if (Array.isArray(dependency_ids)) {
    for (const depId of dependency_ids) {
      if (depId !== taskId) {
        db.prepare("INSERT INTO task_dependencies (task_id, depends_on_id) VALUES (?, ?)").run(taskId, depId);
      }
    }
  }
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as Record<string, unknown>;
  res.json(enrichTask(task));
});

export default router;
