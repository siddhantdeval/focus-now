const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('focusAPI', {
  // Tasks
  getTasks: (filter) => ipcRenderer.invoke('tasks:get', filter),
  createTask: (data) => ipcRenderer.invoke('tasks:create', data),
  updateTask: (id, changes) => ipcRenderer.invoke('tasks:update', { id, changes }),
  deleteTask: (id) => ipcRenderer.invoke('tasks:delete', id),
  searchTasks: (query) => ipcRenderer.invoke('tasks:search', query),
  getTaskWithSubtasks: (id) => ipcRenderer.invoke('tasks:getWithSubtasks', id),

  // Timer
  startTimer: (taskId) => ipcRenderer.invoke('timer:start', taskId),
  pauseTimer: () => ipcRenderer.invoke('timer:pause'),
  resumeTimer: () => ipcRenderer.invoke('timer:resume'),
  stopTimer: () => ipcRenderer.invoke('timer:stop'),
  skipBreak: () => ipcRenderer.invoke('timer:skipBreak'),
  getTimerState: () => ipcRenderer.invoke('timer:getState'),
  onTimerTick: (cb) => ipcRenderer.on('timer:tick', (_, data) => cb(data)),

  // Reports
  getDailySummary: (dateUnix) => ipcRenderer.invoke('reports:daily', dateUnix),
  getWeeklySummary: () => ipcRenderer.invoke('reports:weekly'),

  // Settings
  getSetting: (key) => ipcRenderer.invoke('settings:get', key),
  setSetting: (key, value) => ipcRenderer.invoke('settings:set', { key, value }),
  getAllSettings: () => ipcRenderer.invoke('settings:getAll'),

  // Notes
  getNote: (taskId) => ipcRenderer.invoke('notes:get', taskId),
  upsertNote: (taskId, content) => ipcRenderer.invoke('notes:upsert', { taskId, content }),

  // Reminders
  setReminder: (taskId, remindAt) => ipcRenderer.invoke('reminders:set', { taskId, remindAt }),
  deleteReminder: (taskId) => ipcRenderer.invoke('reminders:delete', taskId),

  // Navigation (main → renderer)
  onNavigate: (cb) => ipcRenderer.on('app:navigate', (_, screen) => cb(screen)),
});
