class Router {
  constructor() {
    this.routes = {
      's1-dashboard': 'screens/s1-dashboard.html',
      's2-task-management': 'screens/s2-task-management.html',
      's3-task-detail': 'screens/s3-task-detail.html',
      's4-focus-mode': 'screens/s4-focus-mode.html',
      's5-reports': 'screens/s5-reports.html',
      's6-settings': 'screens/s6-settings.html',
      's7-command-palette': 'screens/s7-command-palette.html'
    };

    this.controllers = {};
    this.mainContent = document.getElementById('main-content');
  }

  registerController(route, controller) {
    this.controllers[route] = controller;
  }

  async navigate(route, params = {}) {
    if (!this.routes[route]) {
      console.error(`Route not found: ${route}`);
      return;
    }

    try {
      // Fetch HTML partial
      const response = await fetch(`${this.routes[route]}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const html = await response.text();

      // Inject into shell
      this.mainContent.innerHTML = html;

      // Update state
      window.appState.set('currentRoute', route);

      // Execute associated controller logic
      if (this.controllers[route]) {
        this.controllers[route].mount(params);
      }
    } catch (e) {
      console.error("Failed to load route:", e);
      this.mainContent.innerHTML = `<div>Error loading screen. Please check console.</div>`;
    }
  }
}

window.appRouter = new Router();
