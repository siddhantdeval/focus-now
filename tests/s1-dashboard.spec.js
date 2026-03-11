const { test, expect, _electron: electron } = require('@playwright/test');
const path = require('path');

test.describe('S1 Dashboard', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    // Launch Electron app
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../main/index.js')],
      env: { ...process.env, NODE_ENV: 'test' }
    });
    // Wait for the first window
    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('should render the timer and it should be initially 00:00 before start', async () => {
    // The controller uses the selector '.text-\\[120px\\]'
    const timerDisplay = await window.locator('.text-\\[120px\\]');
    await expect(timerDisplay).toBeVisible();
    await expect(timerDisplay).toHaveText('00:00', { timeout: 10000 });
  });

  test('should allow inline adding a task', async () => {
    // Wait for tasks to load initially
    await window.waitForTimeout(1000);

    const inlineInput = window.locator('input[placeholder^="Add a task"]');
    await expect(inlineInput).toBeVisible();

    const taskName = `Test task ${Date.now()}`;
    await inlineInput.fill(taskName);
    await inlineInput.press('Enter');

    // Wait for the IPC handler to finish and refresh state
    // Let's use focusAPI directly to check if it's there
    let hasTask = false;
    for (let i = 0; i < 10; i++) {
       await window.waitForTimeout(500);
       hasTask = await window.evaluate(async (name) => {
           // use rawApi if focusAPI.refreshTasks doesn't exist
           const api = window.focusAPI.getTasks ? window.focusAPI : window.focusAPI.rawApi;
           if (!api) return false;
           // If we have to hit the db manually from renderer
           const tasks = await window.focusAPI.getTasks({});
           return tasks.some(t => t.title === name);
       }, taskName);
       if (hasTask) break;
    }

    expect(hasTask).toBe(true);
  });

  test('should toggle timer state on button click', async () => {
    // Make sure timer is stopped initially
    await window.evaluate(async () => {
        const api = window.focusAPI.getTasks ? window.focusAPI : window.focusAPI.rawApi;
        await api.stopTimer();
    });

    await window.waitForTimeout(1000);

    // S1 timer button has text 'START' or 'PAUSE'
    // Controller uses `.bg-black.text-white.font-bold.rounded-full`
    // Let's be safer and use the id if possible, but controller looks for class:
    // `this.timerToggleBtn = document.querySelector('.bg-black.text-white.font-bold.rounded-full');`
    const timerBtn = window.locator('.bg-black.text-white.font-bold.rounded-full, .bg-neutral-800.text-white.font-bold.rounded-full').first();

    // Check initial state
    await expect(timerBtn).toBeVisible({ timeout: 5000 });

    // START
    await timerBtn.click();
    await window.waitForTimeout(1000);

    const isRunning = await window.evaluate(async () => {
        const api = window.focusAPI.getTasks ? window.focusAPI : window.focusAPI.rawApi;
        const state = await api.getTimerState();
        return state.status === 'RUNNING';
    });

    expect(isRunning).toBe(true);

    // PAUSE
    await timerBtn.click();
    await window.waitForTimeout(1000);

    const isPaused = await window.evaluate(async () => {
        const api = window.focusAPI.getTasks ? window.focusAPI : window.focusAPI.rawApi;
        const state = await api.getTimerState();
        return state.status === 'PAUSED';
    });

    expect(isPaused).toBe(true);

    // Cleanup timer state for other tests if necessary
    await window.evaluate(async () => {
        const api = window.focusAPI.getTasks ? window.focusAPI : window.focusAPI.rawApi;
        await api.stopTimer();
    });
  });
});
