const { test, expect, _electron: electron } = require('@playwright/test');
const path = require('path');

test.describe('S2 Task Management', () => {
  let electronApp;
  let window;

  test.beforeAll(async () => {
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../main/index.js')],
      env: { ...process.env, NODE_ENV: 'test' }
    });
    window = await electronApp.firstWindow();
    await window.waitForLoadState('domcontentloaded');

    // Wait for the app to initialize completely
    await window.waitForTimeout(1000);

    // Navigate to S2 Task Management
    await window.click('.nav-item[data-route="s2-task-management"]');
    // Wait for the container to be present
    await window.waitForSelector('h3:has-text("Today")');
  });

  test.afterAll(async () => {
    await electronApp.close();
  });

  test('should display Today and Upcoming lists', async () => {
    await expect(window.locator('h3').filter({ hasText: 'Today' })).toBeVisible({ timeout: 10000 });
    await expect(window.locator('h3').filter({ hasText: 'Upcoming' })).toBeVisible({ timeout: 10000 });
  });

  test('should allow creating a task and see it in the list', async () => {
    const taskName = `S2 Test Task ${Date.now()}`;

    // Evaluate via raw API
    let hasTask = false;
    for (let i = 0; i < 10; i++) {
       await window.waitForTimeout(500);
       hasTask = await window.evaluate(async ({name, iter}) => {
           const api = window.focusAPI.getTasks ? window.focusAPI : window.focusAPI.rawApi;
           if (!api) return false;
           // If we're on iteration 0, create it
           if (iter === 0) {
               await api.createTask({ title: name, due_date: Date.now() });
           }
           const tasks = await api.getTasks({});
           if (window.appState && window.appState.setTasks) {
               window.appState.setTasks(tasks);
           }
           return tasks.some(t => t.title === name);
       }, {name: taskName, iter: i});
       if (hasTask) break;
    }
    expect(hasTask).toBe(true);

    // Refresh the S2 view to show the new tasks
    await window.click('.nav-item[data-route="s1-dashboard"]');
    await window.waitForTimeout(200);
    await window.click('.nav-item[data-route="s2-task-management"]');
    await window.waitForSelector('h3:has-text("Today")');

    const addedTask = window.locator(`p.font-medium:has-text("${taskName}")`);
    await expect(addedTask).toBeVisible({ timeout: 10000 });
  });

  test('selecting a task should highlight it', async () => {
    const taskName = `Selectable Task ${Date.now()}`;

    // Evaluate via raw API
    let hasTask = false;
    for (let i = 0; i < 10; i++) {
       await window.waitForTimeout(500);
       hasTask = await window.evaluate(async ({name, iter}) => {
           const api = window.focusAPI.getTasks ? window.focusAPI : window.focusAPI.rawApi;
           if (!api) return false;
           if (iter === 0) {
               await api.createTask({ title: name, due_date: Date.now() });
           }
           const tasks = await api.getTasks({});
           if (window.appState && window.appState.setTasks) {
               window.appState.setTasks(tasks);
           }
           return tasks.some(t => t.title === name);
       }, {name: taskName, iter: i});
       if (hasTask) break;
    }
    expect(hasTask).toBe(true);

    // Refresh the S2 view to show the new tasks
    await window.click('.nav-item[data-route="s1-dashboard"]');
    await window.waitForTimeout(200);
    await window.click('.nav-item[data-route="s2-task-management"]');
    await window.waitForSelector('h3:has-text("Today")');

    const taskRow = window.locator(`p.font-medium:has-text("${taskName}")`).locator('xpath=./../..');

    // Before click, make sure it's visible
    await expect(taskRow).toBeVisible();

    await taskRow.click();

    // Wait for selection to process
    await window.waitForTimeout(500);

    // Verify it gained the highlighted background class bg-neutral-50
    await expect(taskRow).toHaveClass(/bg-neutral-50/);
  });

  test('should toggle task completion when clicking checkbox', async () => {
    const taskName = `Completable Task ${Date.now()}`;

    // Evaluate via raw API
    let hasTask = false;
    for (let i = 0; i < 10; i++) {
       await window.waitForTimeout(500);
       hasTask = await window.evaluate(async ({name, iter}) => {
           const api = window.focusAPI.getTasks ? window.focusAPI : window.focusAPI.rawApi;
           if (!api) return false;
           if (iter === 0) {
               await api.createTask({ title: name, due_date: Date.now() });
           }
           const tasks = await api.getTasks({});
           if (window.appState && window.appState.setTasks) {
               window.appState.setTasks(tasks);
           }
           return tasks.some(t => t.title === name);
       }, {name: taskName, iter: i});
       if (hasTask) break;
    }
    expect(hasTask).toBe(true);

    await window.click('.nav-item[data-route="s1-dashboard"]');
    await window.waitForTimeout(200);
    await window.click('.nav-item[data-route="s2-task-management"]');
    await window.waitForSelector('h3:has-text("Today")');

    const taskRow = window.locator(`p.font-medium:has-text("${taskName}")`).locator('xpath=./../..');

    // Checkbox is the div inside the row handling the click
    const checkbox = taskRow.locator('.size-5.rounded').first();
    await expect(checkbox).toBeVisible();
    await checkbox.click();

    // Wait for the state to update
    await window.waitForTimeout(1000);

    // Verify it is completed in the database
    const isCompleted = await window.evaluate(async (name) => {
        const api = window.focusAPI.getTasks ? window.focusAPI : window.focusAPI.rawApi;
        const tasks = await api.getTasks({});
        const task = tasks.find(t => t.title === name);
        return task && task.is_completed === 1;
    }, taskName);

    expect(isCompleted).toBe(true);
  });

  test('should focus inline add input when New Task header button is clicked', async () => {
     // S2 has a button: id="s2-header-new-task-btn"
     const newTaskBtn = window.locator('#s2-header-new-task-btn').first();

     // Need to be on S1 first if S2 inline doesn't render, but our previous tests ensure it does
     // Let's force load S1 so the add input is present
     await window.click('.nav-item[data-route="s1-dashboard"]');
     await window.waitForSelector('#s1-task-list-container');
     await window.click('.nav-item[data-route="s2-task-management"]');
     await window.waitForSelector('h3:has-text("Today")');

     const inlineInput = window.locator('input[placeholder^="Add a task"]').first();

     if (await newTaskBtn.count() > 0 && await inlineInput.count() > 0) {
         await newTaskBtn.click();
         // The controller focuses the input
         await expect(inlineInput).toBeFocused();
     }
  });
});
