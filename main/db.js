const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

// Get the user data path for the OS
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'focus.db');

// Initialize database
const db = new Database(dbPath);

db.pragma('journal_mode = WAL'); // Better performance

// Run all migrations on startup
function initializeDb() {
  db.exec(`
    -- Core task store
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        parent_id TEXT NULL,
        title TEXT NOT NULL,
        is_completed INTEGER DEFAULT 0,
        due_date INTEGER,          -- Unix timestamp (UTC)
        priority TEXT DEFAULT 'MEDIUM', -- LOW | MEDIUM | HIGH
        category TEXT DEFAULT 'WORK',   -- WORK | PERSONAL
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    -- Full-text search on task titles
    CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts5(
        id UNINDEXED,
        title,
        content='tasks',
        content_rowid='rowid'
    );

    -- Pomodoro session log
    CREATE TABLE IF NOT EXISTS pomodoro_sessions (
        id TEXT PRIMARY KEY,
        task_id TEXT,
        start_time INTEGER NOT NULL,
        duration_seconds INTEGER NOT NULL,
        is_completed INTEGER DEFAULT 0,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
    );

    -- Reminder scheduling
    CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        remind_at INTEGER NOT NULL,     -- Unix timestamp (UTC)
        is_fired INTEGER DEFAULT 0,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    -- Markdown notes (1:1 with task)
    CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        task_id TEXT UNIQUE NOT NULL,
        content TEXT,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    );

    -- App-wide preferences
    CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );

    -- Default settings seed
    INSERT OR IGNORE INTO app_settings (key, value) VALUES
        ('pomodoro_duration', '25'),
        ('short_break', '5'),
        ('long_break', '15'),
        ('sessions_before_long_break', '4'),
        ('notifications_enabled', 'true'),
        ('theme', 'light'),
        ('global_shortcut_palette', 'CommandOrControl+K'),
        ('global_shortcut_quick_add', 'CommandOrControl+Shift+Space');
  `);
}

initializeDb();
module.exports = { db };
