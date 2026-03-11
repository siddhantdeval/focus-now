// Thin wrapper around the window.focusAPI exposed by contextBridge
const rawApi = window.focusAPI;

// Augmented API that syncs with appState (Reactive Pattern)
window.focusAPI = {
  ...rawApi,

  // Wrapper for refreshing the global tasks state
  async refreshTasks() {
    const tasks = await rawApi.getTasks({});
    window.appState.setTasks(tasks);
    return tasks;
  },

  // State-aware wrappers
  async createTask(data) {
    const task = await rawApi.createTask(data);
    await this.refreshTasks();
    return task;
  },

  async updateTask(id, changes) {
    const updated = await rawApi.updateTask(id, changes);
    await this.refreshTasks();
    return updated;
  }
};

const api = window.focusAPI;

// Listen to navigation events from main process
api.onNavigate((screenId) => {
  if (window.appRouter) {
    window.appRouter.navigate(screenId);
  }
});

// Setup global timer tick listener that updates state
api.onTimerTick((timerState) => {
  if (window.appState) {
    window.appState.setTimer(timerState);
  }
});

// Initial fetch on boot (Senior Architect Recommendation: Cold-start state hydration)
(async () => {
    await window.focusAPI.refreshTasks();
})();
