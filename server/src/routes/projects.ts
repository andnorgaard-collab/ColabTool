import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";

const router = Router();

router.get("/", (_req, res) => {
  const projects = db.prepare(`
    SELECT p.*, u.name as creator_name,
      (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count,
      (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count
    FROM projects p
    JOIN users u ON u.id = p.created_by
    ORDER BY p.created_at DESC
  `).all();
  res.json(projects);
});

router.get("/:id", (req, res) => {
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(req.params.id);
  if (!project) { res.status(404).json({ error: "Not found" }); return; }

  const members = db.prepare(`
    SELECT u.*, pm.role FROM users u
    JOIN project_members pm ON pm.user_id = u.id
    WHERE pm.project_id = ?
    ORDER BY u.name
  `).all(req.params.id);

  res.json({ ...project as object, members });
});

router.post("/", (req, res) => {
  const { name, description, created_by } = req.body;
  if (!name || !created_by) { res.status(400).json({ error: "name and created_by required" }); return; }

  const id = uuidv4();
  db.prepare("INSERT INTO projects (id, name, description, created_by) VALUES (?, ?, ?, ?)").run(id, name, description || null, created_by);
  db.prepare("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, 'owner')").run(id, created_by);
  const project = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  res.status(201).json(project);
});

router.post("/:id/members", (req, res) => {
  const { user_id, role } = req.body;
  if (!user_id) { res.status(400).json({ error: "user_id required" }); return; }
  try {
    db.prepare("INSERT INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)").run(req.params.id, user_id, role || "member");
    res.status(201).json({ ok: true });
  } catch {
    res.status(409).json({ error: "Already a member" });
  }
});

router.delete("/:id/members/:userId", (req, res) => {
  db.prepare("DELETE FROM project_members WHERE project_id = ? AND user_id = ?").run(req.params.id, req.params.userId);
  res.json({ ok: true });
});

export default router;
