const { app, BrowserWindow, globalShortcut } = require('electron');
const path = require('path');
require('./db'); // auto-initializes on require
const { registerIpcHandlers } = require('./ipc-handlers');
const notificationService = require('./services/notification-service');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Open the DevTools if in dev mode
  if (process.env.OPEN_DEVTOOLS === 'true') {
    mainWindow.webContents.openDevTools();
  }

  // OS Wake/Focus recovery for timer
  mainWindow.on('focus', () => {
    mainWindow.webContents.send('app:resume');
  });
}

app.whenReady().then(() => {
  // database already initialized on require
  registerIpcHandlers();

  createWindow();

  notificationService.startPolling();

  // Initial dummy shortcut registration
  globalShortcut.register('CommandOrControl+K', () => {
    if (mainWindow) mainWindow.webContents.send('app:openPalette');
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    notificationService.stopPolling();
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
