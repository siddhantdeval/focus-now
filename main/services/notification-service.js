const { Notification } = require('electron');
const { db } = require('../db');

class NotificationService {
  constructor() {
    this.checkInterval = null;
    this.pollRate = 60000; // Check reminders every minute
  }

  startPolling() {
    if (this.checkInterval) clearInterval(this.checkInterval);
    this.checkInterval = setInterval(() => this.checkReminders(), this.pollRate);
    this.checkReminders(); // Initial check
  }

  stopPolling() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  showNotification(title, body, actions = []) {
    if (!Notification.isSupported()) return;

    // Only show if setting is enabled
    const enabled = db.prepare(`SELECT value FROM app_settings WHERE key = 'notifications_enabled'`).get();
    if (enabled && enabled.value === 'false') return;

    const notification = new Notification({
      title,
      body,
      actions: actions.map(a => ({ type: 'button', text: a.text }))
    });

    notification.on('action', (event, index) => {
      const action = actions[index];
      if (action && typeof action.handler === 'function') {
        action.handler();
      }
    });

    notification.show();
  }

  checkReminders() {
    const now = Date.now();
    // Get past due reminders that haven't fired yet
    const stmt = db.prepare(`
      SELECT r.*, t.title
      FROM reminders r
      JOIN tasks t ON r.task_id = t.id
      WHERE r.remind_at <= ? AND r.is_fired = 0
    `);

    const dueReminders = stmt.all(now);

    dueReminders.forEach(reminder => {
      this.showNotification(`Reminder: ${reminder.title}`, `Task due soon!`, [
        { text: 'Mark Complete', handler: () => {
           db.prepare(`UPDATE tasks SET is_completed = 1 WHERE id = ?`).run(reminder.task_id);
        }}
      ]);

      // Mark as fired
      db.prepare(`UPDATE reminders SET is_fired = 1 WHERE id = ?`).run(reminder.id);
    });
  }
}

module.exports = new NotificationService();
