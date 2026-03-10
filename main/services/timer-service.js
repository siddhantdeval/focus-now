const { Worker } = require('worker_threads');
const path = require('path');
const { BrowserWindow } = require('electron');

class TimerService {
  constructor() {
    this.worker = null;
    this.activeTaskId = null;
    this.state = {
      status: 'IDLE',
      remaining: 0,
      totalDuration: 0,
      sessionCount: 0,
      currentType: 'FOCUS'
    };
  }

  initWorker() {
    if (this.worker) return;

    this.worker = new Worker(path.join(__dirname, '../timer-worker.js'));

    this.worker.on('message', (message) => {
      this.state = message;

      // Broadcast tick to all renderer windows
      const windows = BrowserWindow.getAllWindows();
      windows.forEach(win => {
        if (!win.isDestroyed()) {
          win.webContents.send('timer:tick', this.state);
        }
      });

      // If session completes, notify (handle DB in worker or main process later)
      if (message.status === 'BREAK' && message.remaining === message.totalDuration) {
          // Just completed a focus session
          const notificationService = require('./notification-service');
          notificationService.showNotification('Session Complete 🎉', 'Great job focusing!', [
              { text: 'Start Break', handler: () => this.resumeTimer() }
          ]);
      }
    });

    this.worker.on('error', (err) => console.error('Timer worker error:', err));
  }

  startTimer(taskId, durationSeconds, type = 'FOCUS') {
    this.initWorker();
    this.activeTaskId = taskId;
    this.worker.postMessage({ type: 'START', payload: { durationSeconds, sessionType: type, taskId } });
  }

  pauseTimer() {
    if (this.worker) this.worker.postMessage({ type: 'PAUSE' });
  }

  resumeTimer() {
    if (this.worker) this.worker.postMessage({ type: 'RESUME' });
  }

  stopTimer() {
    if (this.worker) {
        this.worker.postMessage({ type: 'STOP' });
        this.activeTaskId = null;
    }
  }

  skipBreak() {
    if (this.worker) this.worker.postMessage({ type: 'SKIP_BREAK' });
  }

  getState() {
    return this.state;
  }
}

module.exports = new TimerService();
