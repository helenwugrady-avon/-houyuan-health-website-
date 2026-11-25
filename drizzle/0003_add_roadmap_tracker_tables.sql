CREATE TABLE roadmap_settings (
  id INTEGER PRIMARY KEY,
  week1_start_date TEXT
);
--> statement-breakpoint
CREATE TABLE roadmap_task_progress (
  task_id TEXT PRIMARY KEY,
  is_done INTEGER NOT NULL DEFAULT 0,
  notes TEXT NOT NULL DEFAULT '',
  updated_at INTEGER NOT NULL
);
