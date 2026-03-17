import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import fs from "fs";
import db from "./db";
import { v4 as uuidv4 } from "uuid";

import usersRouter from "./routes/users";
import projectsRouter from "./routes/projects";
import tasksRouter from "./routes/tasks";
import messagesRouter from "./routes/messages";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.use(cors());
app.use(express.json());

app.use("/api/users", usersRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/projects/:projectId/tasks", tasksRouter);
app.use("/api/projects/:projectId/messages", messagesRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Serve built frontend
const clientDist = path.join(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

// Socket.io real-time layer
io.on("connection", (socket) => {
  socket.on("join_project", (projectId: string) => {
    socket.join(`project:${projectId}`);
  });

  socket.on("leave_project", (projectId: string) => {
    socket.leave(`project:${projectId}`);
  });

  socket.on("send_message", (data: { project_id: string; user_id: string; content: string; task_id?: string }) => {
    const { project_id, user_id, content, task_id } = data;
    if (!project_id || !user_id || !content) return;

    const id = uuidv4();
    db.prepare("INSERT INTO messages (id, project_id, user_id, content, task_id) VALUES (?, ?, ?, ?, ?)").run(
      id, project_id, user_id, content, task_id || null
    );

    const message = db.prepare(`
      SELECT m.*, u.name as user_name, u.platform as user_platform, u.avatar_color as user_avatar_color,
             t.title as task_title
      FROM messages m
      JOIN users u ON u.id = m.user_id
      LEFT JOIN tasks t ON t.id = m.task_id
      WHERE m.id = ?
    `).get(id);

    io.to(`project:${project_id}`).emit("new_message", message);
  });

  socket.on("task_updated", (data: { project_id: string; task: unknown }) => {
    socket.to(`project:${data.project_id}`).emit("task_updated", data.task);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`ColabTool server running on port ${PORT}`);
});
