import { env } from 'cloudflare:workers';

let initialization: Promise<void> | undefined;
export function ensureDatabase() { initialization ??= initialize(); return initialization; }

async function initialize() {
  const db = env.DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, task_date TEXT NOT NULL,
      start_time TEXT, end_time TEXT, category TEXT NOT NULL DEFAULT 'personal', priority TEXT NOT NULL DEFAULT 'medium',
      tags TEXT NOT NULL DEFAULT '[]', notes TEXT NOT NULL DEFAULT '', done INTEGER NOT NULL DEFAULT 0,
      deleted_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_tasks_date_deleted ON tasks(task_date, deleted_at)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_tasks_category_date ON tasks(category, task_date)'),
    db.prepare(`CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active', progress INTEGER NOT NULL DEFAULT 0, manual_progress INTEGER,
      start_date TEXT, target_date TEXT, deleted_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, workout_date TEXT NOT NULL,
      duration INTEGER NOT NULL DEFAULT 0, exercises TEXT NOT NULL DEFAULT '[]', notes TEXT NOT NULL DEFAULT '',
      is_template INTEGER NOT NULL DEFAULT 0, completed INTEGER NOT NULL DEFAULT 0, deleted_at TEXT,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS meals (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, meal_date TEXT NOT NULL,
      meal_type TEXT NOT NULL DEFAULT 'other', calories REAL NOT NULL DEFAULT 0, protein REAL NOT NULL DEFAULT 0,
      carbs REAL NOT NULL DEFAULT 0, fat REAL NOT NULL DEFAULT 0, foods TEXT NOT NULL DEFAULT '[]',
      is_template INTEGER NOT NULL DEFAULT 0, deleted_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS weekly_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT, week_start TEXT NOT NULL UNIQUE, reflection TEXT NOT NULL DEFAULT '',
      next_week_focus TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)`),
    db.prepare(`CREATE TABLE IF NOT EXISTS project_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL, title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_project_notes_project ON project_notes(project_id, updated_at)'),
    db.prepare(`CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT, project_id INTEGER NOT NULL, file_name TEXT NOT NULL,
      object_key TEXT NOT NULL UNIQUE, content_type TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_attachments_project ON attachments(project_id, created_at)'),
  ]);
  await db.prepare('PRAGMA optimize').run();
}
