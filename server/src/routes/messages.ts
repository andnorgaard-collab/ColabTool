import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";

const router = Router({ mergeParams: true });

router.get("/", (req, res) => {
  const { projectId } = req.params as { projectId: string };
  const limit = parseInt(req.query.limit as string) || 50;
  const before = req.query.before as string | undefined;

  const messages = before
    ? db.prepare(`
        SELECT m.*, u.name as user_name, u.platform as user_platform, u.avatar_color as user_avatar_color,
               t.title as task_title
        FROM messages m
        JOIN users u ON u.id = m.user_id
        LEFT JOIN tasks t ON t.id = m.task_id
        WHERE m.project_id = ? AND m.created_at < ?
        ORDER BY m.created_at DESC LIMIT ?
      `).all(projectId, before, limit)
    : db.prepare(`
        SELECT m.*, u.name as user_name, u.platform as user_platform, u.avatar_color as user_avatar_color,
               t.title as task_title
        FROM messages m
        JOIN users u ON u.id = m.user_id
        LEFT JOIN tasks t ON t.id = m.task_id
        WHERE m.project_id = ?
        ORDER BY m.created_at ASC LIMIT ?
      `).all(projectId, limit);

  res.json(messages);
});

router.post("/", (req, res) => {
  const { projectId } = req.params as { projectId: string };
  const { user_id, content, task_id } = req.body;
  if (!user_id || !content) { res.status(400).json({ error: "user_id and content required" }); return; }

  const id = uuidv4();
  db.prepare("INSERT INTO messages (id, project_id, user_id, content, task_id) VALUES (?, ?, ?, ?, ?)").run(
    id, projectId, user_id, content, task_id || null
  );

  const message = db.prepare(`
    SELECT m.*, u.name as user_name, u.platform as user_platform, u.avatar_color as user_avatar_color,
           t.title as task_title
    FROM messages m
    JOIN users u ON u.id = m.user_id
    LEFT JOIN tasks t ON t.id = m.task_id
    WHERE m.id = ?
  `).get(id);

  res.status(201).json(message);
});

export default router;
