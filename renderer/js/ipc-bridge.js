// Thin wrapper around the window.focusAPI exposed by contextBridge
// This allows global access without directly referencing window object everywhere if needed
const api = window.focusAPI;

// Listen to navigation events from main process (e.g. from Tray or Menu)
api.onNavigate((screenId) => {
  if (window.appRouter) {
    window.appRouter.navigate(screenId);
  }
});

// Setup global timer tick listener that updates state
api.onTimerTick((timerState) => {
  if (window.appState) {
    window.appState.set('timer', timerState);
  }
});
