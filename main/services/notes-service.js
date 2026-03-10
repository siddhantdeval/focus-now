const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');

class NotesService {
  constructor() {
    this.getStmt = db.prepare(`SELECT * FROM notes WHERE task_id = ?`);
    this.upsertStmt = db.prepare(`
      INSERT INTO notes (id, task_id, content, updated_at)
      VALUES (@id, @task_id, @content, @updated_at)
      ON CONFLICT(task_id) DO UPDATE SET
        content=excluded.content,
        updated_at=excluded.updated_at
    `);
  }

  getNote(taskId) {
    return this.getStmt.get(taskId) || null;
  }

  upsertNote(taskId, content) {
    const id = uuidv4();
    const now = Date.now();
    this.upsertStmt.run({
      id,
      task_id: taskId,
      content: content || '',
      updated_at: now
    });
    return this.getStmt.get(taskId);
  }
}

module.exports = new NotesService();
