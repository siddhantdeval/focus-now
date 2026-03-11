const { db } = require('../db');
const { v4: uuidv4 } = require('uuid');

class TaskService {
  constructor() {
    this.createStmt = db.prepare(`
      INSERT INTO tasks (id, parent_id, title, is_completed, due_date, priority, category, created_at, updated_at)
      VALUES (@id, @parent_id, @title, @is_completed, @due_date, @priority, @category, @created_at, @updated_at)
    `);

    this.updateStmt = db.prepare(`
      UPDATE tasks
      SET title = COALESCE(@title, title),
          is_completed = COALESCE(@is_completed, is_completed),
          due_date = COALESCE(@due_date, due_date),
          priority = COALESCE(@priority, priority),
          category = COALESCE(@category, category),
          updated_at = @updated_at
      WHERE id = @id
    `);

    this.deleteStmt = db.prepare(`DELETE FROM tasks WHERE id = ?`);
    this.getByIdStmt = db.prepare(`SELECT * FROM tasks WHERE id = ?`);
    this.getSubtasksStmt = db.prepare(`SELECT * FROM tasks WHERE parent_id = ?`);
    this.searchStmt = db.prepare(`SELECT * FROM tasks_fts WHERE title MATCH ? ORDER BY rank`);
  }

  getTasks(filter = {}) {
    let query = `SELECT * FROM tasks WHERE parent_id IS NULL`;
    const params = [];

    if (filter.dueToday) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      query += ` AND due_date >= ? AND due_date < ?`;
      params.push(today.getTime(), tomorrow.getTime());
    }

    if (filter.upcoming) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query += ` AND (due_date > ? OR due_date IS NULL)`;
      params.push(today.getTime());
    }

    if (filter.limit) {
      query += ` LIMIT ?`;
      params.push(filter.limit);
    }

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  createTask(data) {
    const now = Date.now();
    const task = {
      id: uuidv4(),
      parent_id: data.parent_id || null,
      title: data.title,
      is_completed: 0,
      due_date: data.due_date || null,
      priority: data.priority || 'MEDIUM',
      category: data.category || 'WORK',
      created_at: now,
      updated_at: now,
    };

    // Use transaction to ensure FTS table stays in sync
    const insertTx = db.transaction(() => {
      this.createStmt.run(task);
      db.prepare(`INSERT INTO tasks_fts (id, title) VALUES (?, ?)`).run(task.id, task.title);
    });
    insertTx();

    return task;
  }

  updateTask(id, changes) {
    const now = Date.now();

    const updateTx = db.transaction(() => {
      this.updateStmt.run({
        id,
        title: changes.title !== undefined ? changes.title : null,
        is_completed: changes.is_completed !== undefined ? (changes.is_completed ? 1 : 0) : null,
        due_date: changes.due_date !== undefined ? changes.due_date : null,
        priority: changes.priority !== undefined ? changes.priority : null,
        category: changes.category !== undefined ? changes.category : null,
        updated_at: now
      });

      if (changes.title !== undefined) {
         db.prepare(`UPDATE tasks_fts SET title = ? WHERE id = ?`).run(changes.title, id);
      }
    });

    updateTx();
    return this.getByIdStmt.get(id);
  }

  deleteTask(id) {
    const deleteTx = db.transaction(() => {
      this.deleteStmt.run(id);
      db.prepare(`DELETE FROM tasks_fts WHERE id = ?`).run(id);
    });
    deleteTx();
    return { success: true };
  }

  searchTasks(query) {
    if (!query || query.trim() === '') return [];
    // Basic FTS prefix matching: "search query*"
    const matchStr = query.replace(/[^a-zA-Z0-9 ]/g, '').trim().split(/\s+/).map(word => word + '*').join(' ');
    return this.searchStmt.all(matchStr);
  }

  getTaskWithSubtasks(id) {
    const task = this.getByIdStmt.get(id);
    if (!task) return null;
    const subtasks = this.getSubtasksStmt.all(id);
    return { task, subtasks };
  }
}

module.exports = new TaskService();
