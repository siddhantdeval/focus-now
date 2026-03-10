const { ipcMain } = require('electron');
const taskService = require('./services/task-service');
const timerService = require('./services/timer-service');
const reportService = require('./services/report-service');
const settingsService = require('./services/settings-service');
const notesService = require('./services/notes-service');
const { db } = require('./db');
const { v4: uuidv4 } = require('uuid');

function registerIpcHandlers() {
  // Tasks
  ipcMain.handle('tasks:get', (e, filter) => taskService.getTasks(filter));
  ipcMain.handle('tasks:create', (e, data) => taskService.createTask(data));
  ipcMain.handle('tasks:update', (e, { id, changes }) => taskService.updateTask(id, changes));
  ipcMain.handle('tasks:delete', (e, id) => taskService.deleteTask(id));
  ipcMain.handle('tasks:search', (e, query) => taskService.searchTasks(query));
  ipcMain.handle('tasks:getWithSubtasks', (e, id) => taskService.getTaskWithSubtasks(id));

  // Timer
  ipcMain.handle('timer:start', (e, taskId) => {
    // Default to 25 mins if not set
    const pomodoro_duration = settingsService.getSetting('pomodoro_duration') || '25';
    timerService.startTimer(taskId, parseInt(pomodoro_duration) * 60, 'FOCUS');
    return { success: true };
  });

  ipcMain.handle('timer:pause', () => { timerService.pauseTimer(); return true; });
  ipcMain.handle('timer:resume', () => { timerService.resumeTimer(); return true; });
  ipcMain.handle('timer:stop', () => { timerService.stopTimer(); return true; });
  ipcMain.handle('timer:skipBreak', () => { timerService.skipBreak(); return true; });
  ipcMain.handle('timer:getState', () => timerService.getState());

  // Reports
  ipcMain.handle('reports:daily', (e, dateUnix) => reportService.getDailySummary(dateUnix));
  ipcMain.handle('reports:weekly', () => reportService.getWeeklySummary());

  // Settings
  ipcMain.handle('settings:get', (e, key) => settingsService.getSetting(key));
  ipcMain.handle('settings:set', (e, { key, value }) => settingsService.setSetting(key, value));
  ipcMain.handle('settings:getAll', () => settingsService.getAllSettings());

  // Notes
  ipcMain.handle('notes:get', (e, taskId) => notesService.getNote(taskId));
  ipcMain.handle('notes:upsert', (e, { taskId, content }) => notesService.upsertNote(taskId, content));

  // Reminders
  ipcMain.handle('reminders:set', (e, { taskId, remindAt }) => {
    const id = uuidv4();
    db.prepare(`
      INSERT OR REPLACE INTO reminders (id, task_id, remind_at, is_fired)
      VALUES (?, ?, ?, 0)
    `).run(id, taskId, remindAt);
    return { success: true };
  });

  ipcMain.handle('reminders:delete', (e, taskId) => {
    db.prepare(`DELETE FROM reminders WHERE task_id = ?`).run(taskId);
    return { success: true };
  });
}

module.exports = { registerIpcHandlers };
