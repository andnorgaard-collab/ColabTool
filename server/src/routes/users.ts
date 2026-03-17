import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import db from "../db";

const router = Router();

router.get("/", (_req, res) => {
  const users = db.prepare("SELECT * FROM users ORDER BY name").all();
  res.json(users);
});

router.post("/", (req, res) => {
  const { name, email, platform, avatar_color } = req.body;
  if (!name || !email || !platform) {
    res.status(400).json({ error: "name, email, platform required" });
    return;
  }
  const id = uuidv4();
  const colors = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
  const color = avatar_color || colors[Math.floor(Math.random() * colors.length)];
  try {
    db.prepare(
      "INSERT INTO users (id, name, email, platform, avatar_color) VALUES (?, ?, ?, ?, ?)"
    ).run(id, name, email, platform, color);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    res.status(201).json(user);
  } catch {
    res.status(409).json({ error: "Email already exists" });
  }
});

export default router;
