import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(__dirname, "../data/colabtool.db");

// Ensure data directory exists
import fs from "fs";
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    platform TEXT NOT NULL CHECK(platform IN ('microsoft', 'google', 'other')),
    avatar_color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS project_members (
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('owner', 'member')),
    PRIMARY KEY (project_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in_progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
    assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
    due_date TEXT,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS task_dependencies (
    task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, depends_on_id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Seed demo data if empty
const userCount = (db.prepare("SELECT COUNT(*) as n FROM users").get() as { n: number }).n;
if (userCount === 0) {
  const seedUsers = [
    { id: "u1", name: "Anna Nielsen", email: "anna@yourcompany.dk", platform: "microsoft", avatar_color: "#6366f1" },
    { id: "u2", name: "Lars Sørensen", email: "lars@yourcompany.dk", platform: "microsoft", avatar_color: "#0ea5e9" },
    { id: "u3", name: "Maria Jensen", email: "maria@yourcompany.dk", platform: "microsoft", avatar_color: "#10b981" },
    { id: "u4", name: "Thomas Koch", email: "thomas@supplier.com", platform: "google", avatar_color: "#f59e0b" },
    { id: "u5", name: "Sara Schmidt", email: "sara@supplier.com", platform: "google", avatar_color: "#ef4444" },
  ];

  const insertUser = db.prepare(
    "INSERT INTO users (id, name, email, platform, avatar_color) VALUES (@id, @name, @email, @platform, @avatar_color)"
  );
  for (const u of seedUsers) insertUser.run(u);

  const insertProject = db.prepare(
    "INSERT INTO projects (id, name, description, created_by) VALUES (@id, @name, @description, @created_by)"
  );
  insertProject.run({
    id: "p1",
    name: "Website Redesign",
    description: "Fælles projekt med leverandør om ny hjemmeside",
    created_by: "u1",
  });

  const insertMember = db.prepare(
    "INSERT INTO project_members (project_id, user_id, role) VALUES (@project_id, @user_id, @role)"
  );
  for (const uid of ["u1", "u2", "u3", "u4", "u5"]) {
    insertMember.run({ project_id: "p1", user_id: uid, role: uid === "u1" ? "owner" : "member" });
  }

  const insertTask = db.prepare(
    `INSERT INTO tasks (id, project_id, title, description, status, priority, assigned_to, due_date, created_by)
     VALUES (@id, @project_id, @title, @description, @status, @priority, @assigned_to, @due_date, @created_by)`
  );

  const tasks = [
    { id: "t1", project_id: "p1", title: "Kravspecifikation", description: "Beskriv alle krav til den nye hjemmeside", status: "done", priority: "high", assigned_to: "u1", due_date: "2026-03-10", created_by: "u1" },
    { id: "t2", project_id: "p1", title: "Design mockups", description: "Lav wireframes og visuelle designs", status: "in_progress", priority: "high", assigned_to: "u4", due_date: "2026-03-25", created_by: "u1" },
    { id: "t3", project_id: "p1", title: "Frontend udvikling", description: "Implementer design i kode", status: "todo", priority: "medium", assigned_to: "u5", due_date: "2026-04-15", created_by: "u1" },
    { id: "t4", project_id: "p1", title: "Backend API", description: "Byg REST API til hjemmesiden", status: "todo", priority: "medium", assigned_to: "u2", due_date: "2026-04-20", created_by: "u1" },
    { id: "t5", project_id: "p1", title: "QA & test", description: "Test alt funktionalitet grundigt", status: "todo", priority: "medium", assigned_to: "u3", due_date: "2026-05-01", created_by: "u1" },
    { id: "t6", project_id: "p1", title: "Go-live", description: "Lancér den nye hjemmeside", status: "todo", priority: "high", assigned_to: "u1", due_date: "2026-05-10", created_by: "u1" },
  ];

  for (const t of tasks) insertTask.run(t);

  const insertDep = db.prepare(
    "INSERT INTO task_dependencies (task_id, depends_on_id) VALUES (@task_id, @depends_on_id)"
  );
  insertDep.run({ task_id: "t2", depends_on_id: "t1" });
  insertDep.run({ task_id: "t3", depends_on_id: "t2" });
  insertDep.run({ task_id: "t4", depends_on_id: "t1" });
  insertDep.run({ task_id: "t5", depends_on_id: "t3" });
  insertDep.run({ task_id: "t5", depends_on_id: "t4" });
  insertDep.run({ task_id: "t6", depends_on_id: "t5" });

  const insertMessage = db.prepare(
    "INSERT INTO messages (id, project_id, user_id, content, task_id) VALUES (@id, @project_id, @user_id, @content, @task_id)"
  );
  insertMessage.run({ id: "m1", project_id: "p1", user_id: "u1", content: "Kravspecifikationen er godkendt - vi kan gå videre med designs!", task_id: "t1" });
  insertMessage.run({ id: "m2", project_id: "p1", user_id: "u4", content: "Super! Jeg er gået i gang med mockups. Forventer første udkast i slutningen af ugen.", task_id: "t2" });
  insertMessage.run({ id: "m3", project_id: "p1", user_id: "u2", content: "Jeg er klar til at starte på API'et så snart vi har endt kravspecifikationen.", task_id: null });
}

export default db;
