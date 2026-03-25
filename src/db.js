const path = require("path");
const Database = require("better-sqlite3");

const db = new Database(path.join(process.cwd(), "danskabe.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    class_code TEXT NOT NULL,
    popup_count_per_day INTEGER NOT NULL DEFAULT 6,
    interval_minutes INTEGER NOT NULL DEFAULT 60,
    enabled_categories TEXT NOT NULL,
    teacher_password TEXT NOT NULL,
    dataset_version INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    prompt TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS student_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    question_id INTEGER NOT NULL,
    shown_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dataset_version INTEGER NOT NULL DEFAULT 1,
    correct INTEGER,
    FOREIGN KEY (question_id) REFERENCES questions(id)
  );
`);

const appSettingsColumns = db.prepare("PRAGMA table_info(app_settings)").all();
if (!appSettingsColumns.some((col) => col.name === "dataset_version")) {
  db.exec("ALTER TABLE app_settings ADD COLUMN dataset_version INTEGER NOT NULL DEFAULT 1");
}

const historyColumns = db.prepare("PRAGMA table_info(student_history)").all();
if (!historyColumns.some((col) => col.name === "dataset_version")) {
  db.exec("ALTER TABLE student_history ADD COLUMN dataset_version INTEGER NOT NULL DEFAULT 1");
}

const defaultCategories = ["time", "day_of_week", "vocab", "phrases"];
const existingSettings = db.prepare("SELECT id FROM app_settings WHERE id = 1").get();
if (!existingSettings) {
  db.prepare(
    `
      INSERT INTO app_settings (
        id,
        class_code,
        popup_count_per_day,
        interval_minutes,
        enabled_categories,
        teacher_password,
        dataset_version
      ) VALUES (
        1,
        @classCode,
        6,
        60,
        @enabledCategories,
        @teacherPassword,
        1
      )
    `
  ).run({
    classCode: process.env.CLASS_CODE || "DANSK101",
    enabledCategories: JSON.stringify(defaultCategories),
    teacherPassword: process.env.TEACHER_PASSWORD || "teacher123",
  });
}

const existingQuestionCount = db.prepare("SELECT COUNT(*) AS count FROM questions").get().count;
if (existingQuestionCount === 0) {
  const seed = db.prepare(
    "INSERT INTO questions (category, prompt, answer) VALUES (@category, @prompt, @answer)"
  );

  const defaults = [
    { category: "time", prompt: "Hvad er klokken?", answer: "Klokken er to." },
    { category: "day_of_week", prompt: "Hvilken dag er det i dag?", answer: "Det er mandag." },
    { category: "vocab", prompt: "Translate: apple", answer: "aeble" },
    { category: "phrases", prompt: "Hvordan siger man 'Good morning'?", answer: "Godmorgen" }
  ];

  const transaction = db.transaction((rows) => {
    for (const row of rows) {
      seed.run(row);
    }
  });

  transaction(defaults);
}

module.exports = db;
