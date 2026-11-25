DROP TABLE IF EXISTS entries;
--> statement-breakpoint
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  sex TEXT NOT NULL,
  age INTEGER NOT NULL,
  source TEXT NOT NULL,
  stage TEXT NOT NULL,
  follow_up TEXT NOT NULL,
  goal TEXT NOT NULL,
  status TEXT NOT NULL,
  checkin_days INTEGER NOT NULL,
  measures_json TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE staff_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id TEXT NOT NULL,
  week TEXT NOT NULL,
  role TEXT NOT NULL,
  entry_date TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
