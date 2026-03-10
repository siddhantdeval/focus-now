# Focus App — Google Jules Implementation Plan
## Electron.js · Production-Ready · Local-First Productivity App

> **For Google Jules:** This document is the single authoritative implementation brief.
> All UI screens are produced by **Google Stitch** and must be reproduced pixel-perfectly.
> Each screen section contains the Stitch Project ID + Screen ID for Jules to pull the exact
> reference design. Do **not** invent UI — render the Stitch HTML/CSS output as-is inside
> Electron's renderer process.

---

## 0. Project Identity

| Field | Value |
|---|---|
| **App Name** | Focus |
| **Runtime** | Electron.js (latest stable) |
| **Renderer** | Vanilla HTML + CSS (Stitch-generated, no framework) |
| **Main Process** | Node.js (Electron main) |
| **Database** | SQLite via `better-sqlite3` (bundled, local) |
| **IPC Layer** | Electron `contextBridge` + `ipcMain` / `ipcRenderer` |
| **Stitch Project ID** | `14675736852343732341` |
| **Design Assets** | `project_documentations/design_asset/` |
| **Screen Specs** | `project_documentations/screen_specifications/` |

---

## 1. Product Purpose

Focus is a **minimalist, local-first Pomodoro + Task Management** desktop application.
It targets knowledge workers who need deep-work sessions with zero distraction.

**Core user workflows:**
1. **Capture** — Press `N` → type task → `Enter` → task created instantly.
2. **Focus** — Select task → press `Space` → Pomodoro timer starts.
3. **Review** — Open Reports → view daily/weekly session summary.

**Design contract:** Monochromatic (black / white / grays). No gradients. No bright colors.
The active timer is always the primary visual element on screen.

---

## 2. Technology Stack

| Layer | Choice | Reason |
|---|---|---|
| **Shell** | Electron.js | Cross-platform native window + OS tray + system notifications |
| **Renderer** | HTML/CSS (Stitch output) | Pixel-perfect Stitch fidelity, zero framework overhead |
| **IPC** | `contextBridge` (preload) | Secure context isolation; no `nodeIntegration` in renderer |
| **Database** | `better-sqlite3` | Synchronous, bundled SQLite — no async complexity |
| **Timer Engine** | Node.js `worker_threads` | Off-main-thread tick; survives renderer reload |
| **Notifications** | Electron `Notification` API | Native OS notification (macOS / Windows) |
| **Tray** | Electron `Tray` + `Menu` | Menu bar / system tray persistent icon |
| **Global Shortcuts** | Electron `globalShortcut` | `Cmd+K`, `Cmd+Shift+Space`, etc. |
| **Auto-updater** | `electron-updater` | GitHub Releases rolling updates |
| **Packager** | `electron-builder` | `.dmg` (macOS), `.exe` NSIS (Windows) |

---

## 3. Project Structure

```
focus-electron/
├── main/                        # Electron main process (Node.js)
│   ├── index.js                 # App entry point — BrowserWindow, Tray, IPC
│   ├── ipc-handlers.js          # All ipcMain.handle() registrations
│   ├── timer-worker.js          # worker_threads timer engine
│   ├── db.js                    # better-sqlite3 init + migrations
│   ├── services/
│   │   ├── task-service.js      # CRUD + FTS search
│   │   ├── timer-service.js     # Start/pause/stop/tick orchestration
│   │   ├── report-service.js    # Aggregate queries for analytics
│   │   ├── settings-service.js  # Read/write app_settings table
│   │   └── notification-service.js  # Electron Notification + scheduling
│   └── preload.js               # contextBridge API surface
│
├── renderer/                    # Electron renderer (HTML/CSS/JS)
│   ├── index.html               # App shell — single-page with view routing
│   ├── styles/
│   │   └── design-system.css    # Design tokens from Stitch (colors, type, spacing)
│   ├── screens/                 # One HTML partial per Stitch screen
│   │   ├── s1-dashboard.html
│   │   ├── s2-task-management.html
│   │   ├── s3-task-detail.html
│   │   ├── s4-focus-mode.html
│   │   ├── s5-reports.html
│   │   ├── s6-settings.html
│   │   ├── s7-command-palette.html
│   │   └── s8-menu-bar-popup.html
│   ├── js/
│   │   ├── router.js            # Client-side view switcher (no framework)
│   │   ├── state.js             # In-memory reactive state (pub/sub)
│   │   ├── ipc-bridge.js        # Thin wrapper around window.focusAPI
│   │   └── screens/             # Per-screen controller JS
│   │       ├── dashboard.js
│   │       ├── task-management.js
│   │       ├── task-detail.js
│   │       ├── focus-mode.js
│   │       ├── reports.js
│   │       ├── settings.js
│   │       ├── command-palette.js
│   │       └── menu-bar.js
│   └── assets/
│       └── icons/
│
├── tray/                        # Separate lightweight BrowserWindow for tray popup
│   └── tray-popup.html          # Stitch S8 rendered standalone
│
├── project_documentations/      # Reference docs (read-only for Jules)
│   ├── DESIGN_PLAN.md
│   ├── design_asset/            # Stitch mockup PNGs + HTML source files
│   └── screen_specifications/   # Detailed per-screen functional specs
│
├── package.json
├── electron-builder.config.js
└── .env                         # DEV flags (e.g., OPEN_DEVTOOLS=true)
```

---

## 4. Database Schema (SQLite via `better-sqlite3`)

Run all `CREATE TABLE IF NOT EXISTS` statements on app launch in `db.js`.

```sql
-- Core task store
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    parent_id TEXT NULL,
    title TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0,
    due_date INTEGER,          -- Unix timestamp (UTC)
    priority TEXT DEFAULT 'MEDIUM', -- LOW | MEDIUM | HIGH
    category TEXT DEFAULT 'WORK',   -- WORK | PERSONAL
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Full-text search on task titles
CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts5(
    id UNINDEXED,
    title,
    content='tasks',
    content_rowid='rowid'
);

-- Pomodoro session log
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    start_time INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    is_completed INTEGER DEFAULT 0,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
);

-- Reminder scheduling
CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    remind_at INTEGER NOT NULL,     -- Unix timestamp (UTC)
    is_fired INTEGER DEFAULT 0,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- Markdown notes (1:1 with task)
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    task_id TEXT UNIQUE NOT NULL,
    content TEXT,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- App-wide preferences
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Default settings seed
INSERT OR IGNORE INTO app_settings (key, value) VALUES
    ('pomodoro_duration', '25'),
    ('short_break', '5'),
    ('long_break', '15'),
    ('sessions_before_long_break', '4'),
    ('notifications_enabled', 'true'),
    ('theme', 'light'),
    ('global_shortcut_palette', 'CommandOrControl+K'),
    ('global_shortcut_quick_add', 'CommandOrControl+Shift+Space');
```

---

## 5. IPC API Contract

All renderer↔main communication goes through `contextBridge`. The preload exposes:

```js
// preload.js — window.focusAPI
window.focusAPI = {
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
};
```

---

## 6. Screen Implementation Guide

> **Jules instruction:** For each screen below:
> 1. Copy the Stitch HTML output from `design_asset/<screen>_code.html` into the corresponding `renderer/screens/` partial.
> 2. Wire the DOM elements to the IPC bridge calls listed in the **Functional Requirements** section.
> 3. Do NOT alter the Stitch CSS classes or layout — only add `id` attributes and JS event listeners.
> 4. Use the Screen ID to pull the exact Stitch reference if re-generation is needed.

---

### S1 — Productivity Dashboard

| Field | Value |
|---|---|
| **Stitch Project ID** | `14675736852343732341` |
| **Stitch Screen ID** | `834685fa805e48cd86d4cf847750c685` |
| **Mockup** | `design_asset/productivity_dashboard_mockup.png` |
| **Stitch HTML Source** | `design_asset/productivity_dashboard_code.html` |
| **Full Spec** | `screen_specifications/S1_PRODUCTIVITY_DASHBOARD.md` |
| **Renderer File** | `renderer/screens/s1-dashboard.html` |
| **Controller** | `renderer/js/screens/dashboard.js` |

**Functional Requirements:**

| UI Element | IPC Call | Behavior |
|---|---|---|
| `START` button on Pomodoro card | `timer:start(activeTaskId)` | Button label toggles to `PAUSE`; timer countdown begins |
| `PAUSE` button (active state) | `timer:pause` | Timer freezes; label reverts to `RESUME` |
| Task checkbox | `tasks:update(id, {is_completed: true})` | Strikethrough + gray text applied via CSS class |
| Inline add input (`Enter` key) | `tasks:create({title})` | New task appended to list without full reload |
| `+ New Task` button (top bar) | focus inline add input | Scrolls to and focuses the inline add field |
| `Start focus session` footer button | `timer:start(activeTaskId)` | Same as Pomodoro START; routes to S4 if timer running |
| Filter chips (All / Personal / Work) | Local filter on in-memory task array | Re-render task list — no DB call |
| `timer:tick` listener | Update timer display text | Fires every 1 second from main process worker |

**State subscribed on mount:**
- `focusAPI.getTasks({ dueToday: true })` → populate Daily Tasks list
- `focusAPI.getTimerState()` → restore timer UI on window re-focus
- `focusAPI.onTimerTick(cb)` → live countdown display

---

### S2 — Task Management View

| Field | Value |
|---|---|
| **Stitch Project ID** | `14675736852343732341` |
| **Stitch Screen ID** | `4561bf01b3e94bdf9ab4e1d1cac92281` |
| **Mockup** | `design_asset/task_management_view_mockup.png` |
| **Stitch HTML Source** | `design_asset/task_management_view_code.html` |
| **Full Spec** | `screen_specifications/S2_TASK_MANAGEMENT.md` |
| **Renderer File** | `renderer/screens/s2-task-management.html` |
| **Controller** | `renderer/js/screens/task-management.js` |

**Functional Requirements:**

| UI Element | IPC Call | Behavior |
|---|---|---|
| Task row click | local state: `selectedTaskId = id` | Slides in Detail Panel (S3 partial rendered inline) |
| `+ New Task` header button | focus inline add input | Opens inline text field at top of TODAY section |
| Inline add input (`Enter`) | `tasks:create({title})` | Task appears in TODAY section immediately |
| Reminder bell icon toggle | `reminders:set` / `reminders:delete` | Bell icon fills/unfills; schedules OS notification |
| Task checkbox | `tasks:update(id, {is_completed: true})` | Row moves to COMPLETED section with fade |
| Section grouping | `tasks:get({ groupBy: 'date' })` | TODAY / UPCOMING / COMPLETED sections populated |
| Search icon | reveal search input | Local FTS: `tasks:search(query)` on each keystroke |

**State subscribed on mount:**
- `focusAPI.getTasks()` → all tasks grouped by date
- Task selection drives S3 detail panel render (see S3)

---

### S3 — Task Detail Panel

| Field | Value |
|---|---|
| **Stitch Project ID** | `14675736852343732341` |
| **Stitch Screen ID** | `9b35d536a7604974bc9f4d548cd4a162` |
| **Mockup** | `design_asset/task_detail_panel_view_mockup.png` |
| **Stitch HTML Source** | `design_asset/task_detail_panel_view_code.html` |
| **Full Spec** | `screen_specifications/S3_TASK_DETAIL.md` |
| **Renderer File** | `renderer/screens/s3-task-detail.html` |
| **Controller** | `renderer/js/screens/task-detail.js` |

**Functional Requirements:**

| UI Element | IPC Call | Behavior |
|---|---|---|
| Title field (`contenteditable`) | `tasks:update(id, {title})` on `blur` | Debounce 500ms before IPC call |
| Subtask checkbox | `tasks:update(subtaskId, {is_completed})` | Updates percent label + progress bar in master list |
| Add subtask input | `tasks:create({title, parent_id: taskId})` | Subtask appended; limited to **1 level deep** |
| Notes textarea | `notes:upsert(taskId, content)` | Debounce 1500ms before saving to SQLite |
| Due date selector | `tasks:update(id, {due_date})` | Native date picker; stores Unix UTC timestamp |
| Reminder time input | `reminders:set(taskId, remindAt)` | Schedules OS notification via main process |
| Repeat rule dropdown | `tasks:update(id, {recurrence_rule})` | iCal RRULE string stored; recurrence engine handles generation |
| `START FOCUS` button | `timer:start(taskId)` + navigate to S4 | Launches focus mode with this task context |
| Delete task (footer icon) | `tasks:delete(id)` | Confirm dialog → delete cascade to subtasks + notes |

**State subscribed on mount (given `taskId`):**
- `focusAPI.getTaskWithSubtasks(taskId)` → task + subtask array + note

---

### S4 — Focus Mode (Distraction-Free)

| Field | Value |
|---|---|
| **Stitch Project ID** | `14675736852343732341` |
| **Stitch Screen ID** | `95683e0c61694cc0987c83f90968972b` |
| **Mockup** | `design_asset/distraction_free_focus_mode_mockup.png` |
| **Stitch HTML Source** | `design_asset/distraction_free_focus_mode_code.html` |
| **Full Spec** | `screen_specifications/S4_FOCUS_MODE.md` |
| **Renderer File** | `renderer/screens/s4-focus-mode.html` |
| **Controller** | `renderer/js/screens/focus-mode.js` |

**Functional Requirements:**

| UI Element | IPC Call | Behavior |
|---|---|---|
| Full-screen on enter | Electron `win.setFullScreen(true)` | Via `ipcMain` on S4 navigation |
| Large timer display | `onTimerTick(cb)` listener | Updates every second; snap on OS wake |
| `PAUSE` button | `timer:pause` | Timer holds; button shows `RESUME` |
| `SKIP BREAK` button | `timer:skipBreak` | Advances state machine to next work session |
| `RESET` button | `timer:stop` | Returns timer to `IDLE`; exits full-screen |
| OS wake recovery | On `ipcRenderer.on('app:resume')` | Call `timer:getState` and recalculate remaining = `endTime - now` |
| Exit full-screen | Electron `win.setFullScreen(false)` | Triggered on `RESET` or `Esc` key |
| **PiP Mini Mode** | `new BrowserWindow({ alwaysOnTop: true, width: 160, height: 48, frame: false })` | Always-on-top frameless window showing live time only |

**Note:** This screen hides ALL navigation. The sidebar must not be rendered in this view.

---

### S5 — Reports & Analytics

| Field | Value |
|---|---|
| **Stitch Project ID** | `14675736852343732341` |
| **Stitch Screen ID** | `137123b61b7042fdbd4addb1f332d1df` |
| **Mockup** | `design_asset/productivity_reports_view_mockup.png` |
| **Stitch HTML Source** | `design_asset/productivity_reports_view_code.html` |
| **Full Spec** | `screen_specifications/S5_REPORTS.md` |
| **Renderer File** | `renderer/screens/s5-reports.html` |
| **Controller** | `renderer/js/screens/reports.js` |

**Functional Requirements:**

| UI Element | IPC Call | Behavior |
|---|---|---|
| Daily summary cards | `reports:daily(todayUnix)` | Show focus time, tasks completed, sessions done |
| Weekly bar chart | `reports:weekly()` | Returns 7-day array of `{date, sessions, focusMinutes}` |
| Chart render | Vanilla Canvas API (no charting lib) | Draw bar chart using `<canvas>` element |
| Top tasks section | From weekly report payload | List top 5 tasks by total Pomodoro sessions |
| Insights panel | Derived locally from report payload | Static computed strings ("You focused 3h more than last week") |

**Report query logic (in `report-service.js`):**
```sql
-- Daily summary
SELECT COUNT(*) as sessions, SUM(duration_seconds)/60 as focus_minutes
FROM pomodoro_sessions
WHERE is_completed = 1 AND date(start_time/1000, 'unixepoch') = date('now', 'localtime');

-- Weekly sessions per day
SELECT date(start_time/1000, 'unixepoch', 'localtime') as day, COUNT(*) as sessions
FROM pomodoro_sessions
WHERE is_completed = 1 AND start_time >= strftime('%s', 'now', '-7 days') * 1000
GROUP BY day ORDER BY day;
```

---

### S6 — Settings

| Field | Value |
|---|---|
| **Stitch Project ID** | `14675736852343732341` |
| **Stitch Screen ID** | `624156aa196a4791b239c1dd2529ec6e` |
| **Mockup** | `design_asset/application_settings_view_mockup.png` |
| **Stitch HTML Source** | `design_asset/application_settings_view_code.html` |
| **Full Spec** | `screen_specifications/S6_SETTINGS.md` |
| **Renderer File** | `renderer/screens/s6-settings.html` |
| **Controller** | `renderer/js/screens/settings.js` |

**Functional Requirements:**

| Setting | IPC Call | Key |
|---|---|---|
| Pomodoro duration (minutes) | `settings:set('pomodoro_duration', val)` | Slider / number input |
| Short break duration | `settings:set('short_break', val)` | Number input |
| Long break duration | `settings:set('long_break', val)` | Number input |
| Sessions before long break | `settings:set('sessions_before_long_break', val)` | Number input |
| Notifications toggle | `settings:set('notifications_enabled', val)` | Toggle switch |
| Global shortcut (palette) | `settings:set('global_shortcut_palette', val)` | Key-capture input → `globalShortcut.register` |
| Global shortcut (quick add) | `settings:set('global_shortcut_quick_add', val)` | Key-capture input → `globalShortcut.register` |
| Export data | `ipcRenderer.invoke('data:export')` | Writes JSON dump of all tables to user-selected file path |

**State subscribed on mount:**
- `focusAPI.getAllSettings()` → pre-populate all form fields

---

### S7 — Command Palette (`Cmd+K`)

| Field | Value |
|---|---|
| **Stitch Project ID** | `14675736852343732341` |
| **Stitch Screen ID** | `32c0c09f808241dba081d3ab71eae2da` |
| **Mockup** | `design_asset/command_palette_modal_view_mockup.png` |
| **Stitch HTML Source** | `design_asset/command_palette_modal_view_code.html` |
| **Full Spec** | `screen_specifications/S7_COMMAND_PALETTE.md` |
| **Renderer File** | `renderer/screens/s7-command-palette.html` |
| **Controller** | `renderer/js/screens/command-palette.js` |

**Functional Requirements:**

| Interaction | Behavior |
|---|---|
| `Cmd+K` global shortcut | `globalShortcut.register` in main → sends `ipcMain → renderer 'app:openPalette'` |
| Modal overlay appears | Blurred backdrop + centered floating input (Stitch design) |
| Text input → keystroke | `tasks:search(query)` via FTS5; debounce 150ms |
| Results rendered | Task title rows shown below input; arrow keys navigate |
| **Built-in commands** | "Start Timer", "New Task", "Go to Settings", "Go to Reports" — static list filtered by query |
| `Enter` on task result | Navigate to S3 (Task Detail) with selected task |
| `Enter` on command result | Execute the mapped action (e.g., `timer:start`, navigate) |
| `Esc` key | Close modal; restore focus to previous view |
| Keyboard hint footer | Show `↵ select` · `↑↓ navigate` · `Esc close` (exactly as Stitch design) |

---

### S8 — Menu Bar / System Tray Dropdown

| Field | Value |
|---|---|
| **Stitch Project ID** | `14675736852343732341` |
| **Stitch Screen ID** | `dee40ed0aaf14439aed7a827339368c7` |
| **Mockup** | `design_asset/menu_bar_status_app_dropdown_mockup.png` |
| **Stitch HTML Source** | `design_asset/menu_bar_status_app_dropdown_code.html` |
| **Full Spec** | `screen_specifications/S8_MENU_BAR.md` |
| **Renderer File** | `tray/tray-popup.html` |

**Implementation Notes:**
- The tray popup is a **separate lightweight `BrowserWindow`** (`frame: false`, `alwaysOnTop: true`, `transparent: true`).
- It is positioned programmatically below the tray icon bounds using `Tray.getBounds()`.
- It communicates with main via the same `contextBridge` preload.

| UI Element | IPC Call | Behavior |
|---|---|---|
| Compact timer display (`24:15 \| Focus`) | `onTimerTick` listener | Text color shifts to active accent while timer running |
| Play / Pause icon buttons | `timer:start` / `timer:pause` | Icon toggles |
| Stop icon button | `timer:stop` | Resets to `IDLE` |
| Quick add task input | `tasks:create({title})` on `Enter` | Creates task without opening main window |
| Top 3 upcoming tasks list | `tasks:get({ limit: 3, upcoming: true })` on popup open | Read-only checklist |
| Click anywhere on popup → open main | `ipcRenderer.invoke('app:showMain')` | Focuses or shows the main BrowserWindow |

---

### S9 — Desktop Widgets *(Reference Only)*

| Field | Value |
|---|---|
| **Stitch Project ID** | `14675736852343732341` |
| **Stitch Screen ID** | `36100c0e6c3f4d7cbf579343b28f871a` |
| **Mockup** | `design_asset/productivity_desktop_widgets_mockup.png` |
| **Stitch HTML Source** | `design_asset/productivity_desktop_widgets_code.html` |
| **Full Spec** | `screen_specifications/S9_OS_WIDGETS.md` |

> **Jules note:** Native OS widgets (macOS Sonoma WidgetKit, Windows 11) are **outside Electron's scope**. This screen is included as a reference for future native extension. In Electron, the **Tray Popup (S8)** and the **PiP Mini Window (S4)** serve an equivalent ambient-display purpose. No implementation required for this screen in the Electron build.

---

### S10 — Rich Notifications

| Field | Value |
|---|---|
| **Stitch Project ID** | `14675736852343732341` |
| **Stitch Screen ID** | `e18fb17488754f0eb20e87678d837cec` |
| **Mockup** | `design_asset/macos_rich_notification_popup_mockup.png` |
| **Stitch HTML Source** | `design_asset/macos_rich_notification_popup_code.html` |
| **Full Spec** | `screen_specifications/S10_NOTIFICATIONS.md` |

> **Jules note:** Electron handles notifications via `new Notification()` in the main process (maps to macOS Notification Center / Windows Action Center natively). The Stitch mockup is a visual reference for the content and action layout. Implement using Electron's `Notification` API, not a custom HTML popup.

**Functional Requirements:**

| Trigger | Notification Content | Actions |
|---|---|---|
| Pomodoro session ends | Title: "Session Complete 🎉" · Body: task title | `Start Break` · `Skip Break` · `+5 Mins` |
| Break session ends | Title: "Break Over" · Body: "Ready for your next session?" | `Start Focus` · `Snooze 5m` |
| Reminder fires | Title: task title · Body: reminder note | `Mark Complete` · `Snooze` |

**Notification click handler:** `Notification.on('click')` → `app.focus()` + navigate to S3 (Task Detail) for the triggering task.

---

## 7. Timer Engine (Main Process Worker Thread)

The timer runs in `main/timer-worker.js` via `worker_threads` to survive renderer
navigation and reloads.

**State Machine:**
```
IDLE → RUNNING (on start)
RUNNING → PAUSED (on pause)
PAUSED → RUNNING (on resume)
RUNNING → BREAK (on session complete)
BREAK → RUNNING (on break end / skip break)
RUNNING/BREAK → IDLE (on stop / reset)
```

**Tick events** are forwarded from the worker to the renderer via:
```
worker → ipcMain → BrowserWindow.webContents.send('timer:tick', { remaining, state, sessionCount })
```

**OS Sleep/Wake recovery:**
On `app.on('browser-window-focus')` and Power Monitor `resume` event:
```js
const remaining = timerState.endTime - Date.now();
// Snap timer to correct remaining value; fire notification if endTime has passed
```

**Session persistence:** On each `RUNNING → BREAK` transition, insert a `pomodoro_sessions` row via `db.js`.

---

## 8. Global Shortcuts

Registered in `main/index.js` via `globalShortcut.register()` on `app.ready`.

| Shortcut | Default | Action |
|---|---|---|
| Command Palette | `Cmd+K` | `webContents.send('app:openPalette')` |
| Quick Add Task | `Cmd+Shift+Space` | Open tray popup or floating quick-add window |
| Show/Hide App | `Cmd+Shift+F` | Toggle main BrowserWindow visibility |

Shortcuts are re-registered when the user changes them in S6 Settings.

---

## 9. Security Model

| Concern | Implementation |
|---|---|
| `nodeIntegration` | `false` in all `BrowserWindow` configs |
| `contextIsolation` | `true` — all node access through `contextBridge` only |
| `webSecurity` | `true` (default) |
| Content Security Policy | `meta` CSP header in `index.html`: `script-src 'self'` |
| SQLite path | Stored in `app.getPath('userData')` — user's OS data dir |
| No external network calls | App is fully local-first; no outbound HTTP in MVP |

---

## 10. Packaging & Distribution

Configured in `electron-builder.config.js`:

| Platform | Output | Distribution |
|---|---|---|
| **macOS** | `.dmg` + `.app` bundle | Direct download (GitHub Releases) + Mac App Store |
| **Windows** | `.exe` NSIS installer | Direct download (GitHub Releases) |
| **Auto-update** | `electron-updater` | Polls GitHub Releases feed |
| **Code signing** | macOS: Apple Developer cert · Windows: EV cert | Required for notarization |

**`electron-builder.config.js` key fields:**
```js
module.exports = {
  appId: 'com.focus.app',
  productName: 'Focus',
  directories: { output: 'dist' },
  mac: { category: 'public.app-category.productivity', hardenedRuntime: true },
  win: { target: 'nsis' },
  nsis: { oneClick: false, allowToChangeInstallationDirectory: true },
  files: ['main/**', 'renderer/**', 'tray/**', 'package.json'],
  asarUnpack: ['**/*.node'],  // unpack better-sqlite3 native module
  afterSign: 'scripts/notarize.js',
};
```

---

## 11. Functional Requirements Summary

| # | Screen | Stitch Screen ID | Core Feature |
|---|---|---|---|
| S1 | Productivity Dashboard | `834685fa805e48cd86d4cf847750c685` | Live timer + today's tasks + inline add |
| S2 | Task Management View | `4561bf01b3e94bdf9ab4e1d1cac92281` | Master-detail task list + grouping |
| S3 | Task Detail Panel | `9b35d536a7604974bc9f4d548cd4a162` | Edit task + subtasks + notes + reminders |
| S4 | Focus Mode | `95683e0c61694cc0987c83f90968972b` | Fullscreen distraction-free timer + PiP |
| S5 | Reports | `137123b61b7042fdbd4addb1f332d1df` | Daily/weekly analytics + canvas chart |
| S6 | Settings | `624156aa196a4791b239c1dd2529ec6e` | Preferences + shortcut config + export |
| S7 | Command Palette | `32c0c09f808241dba081d3ab71eae2da` | Cmd+K modal + FTS search + commands |
| S8 | Menu Bar / Tray | `dee40ed0aaf14439aed7a827339368c7` | Ambient timer + quick add (tray window) |
| S9 | OS Widgets | `36100c0e6c3f4d7cbf579343b28f871a` | Reference only (future native ext.) |
| S10 | Rich Notifications | `e18fb17488754f0eb20e87678d837cec` | Session-end OS notifications + actions |

---

## 12. Jules Implementation Order

Execute in the following sequence to minimize blocking dependencies:

```
1. [Foundation]   Package setup: electron, better-sqlite3, electron-builder
2. [Foundation]   db.js — schema creation + default settings seed
3. [Foundation]   main/index.js — BrowserWindow + preload + contextBridge
4. [Foundation]   timer-worker.js — timer state machine + tick emission
5. [Foundation]   ipc-handlers.js — all ipcMain.handle registrations
6. [Services]     task-service.js, timer-service.js, settings-service.js, notes-service.js
7. [Services]     notification-service.js + reminder polling interval
8. [Renderer]     router.js + state.js + ipc-bridge.js shell
9. [Screen S1]    Dashboard — wire timer + task list + inline add
10. [Screen S2]   Task Management — master list + grouping + selection
11. [Screen S3]   Task Detail — subtasks + notes + reminders + start focus
12. [Screen S4]   Focus Mode — fullscreen + PiP window + OS wake recovery
13. [Screen S7]   Command Palette — globalShortcut + FTS search + commands
14. [Screen S8]   Tray Popup — separate BrowserWindow + positioning
15. [Screen S5]   Reports — query aggregation + canvas chart render
16. [Screen S6]   Settings — form binding + shortcut re-registration
17. [Screen S10]  Notifications — Electron Notification + click routing
18. [Polish]      electron-builder config + code signing + notarization script
```

---

*Stitch Project ID: `14675736852343732341` · All screen references are exact Stitch output — reproduce UI with zero visual deviation.*
*Generated by Antigravity for Google Jules · Focus App · Electron.js*
