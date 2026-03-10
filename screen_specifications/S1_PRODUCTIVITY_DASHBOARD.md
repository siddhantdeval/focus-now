# Screen Specification: S1 — Productivity Dashboard

## 1. Screen Overview
**Purpose:** The central mission control for the user's workday. It provides a glanceable summary of current focus progress and immediate tasks.
- **Primary User Goal:** Start a deep focus session (Pomodoro) and manage the daily to-do list.
- **Application Flow:** The default landing screen upon application launch.
- **Expected User Outcomes:** High motivation through visible progress, reduced cognitive load by highlighting only the "active" task, and rapid friction-free task entry.

---

## 2. UI Layout Structure
The screen is divided into four major functional zones:
1.  **Sidebar (Primary Navigation):** Fixed left navigation for switching between core app modules.
2.  **Top Navigation (Global Actions):** Contains date, global search, sync status, and the primary "New Task" trigger.
3.  **Active Workspace (Hero Section):** A two-column grid at the top containing the large Pomodoro Timer (Left) and the "Current Task" focus card (Right).
4.  **Actionable Content Area:** Bottom section containing the "Daily Tasks" list with filtering tabs and a persistent footer of "Quick Action" buttons.

---

## 3. Component Hierarchy
- Screen (Root)
    - Sidebar
        - App Branding (Logo + Name)
        - NavItems (Dashboard, Tasks, Reports, Settings)
        - User Profile (Avatar + Name + Plan Level)
    - Main Content
        - TopBar
            - Left: Current Date
            - Center: Search Field
            - Right: Sync Status Icon, Notifications Icon, `+ New Task` Button
        - Dashboard Grid
            - PomodoroCard
                - Label: "POMODORO"
                - Display: Huge Numeric Timer ("25:00")
                - Sub-label: "Deep Focus Session"
                - Primary Action: `START` Button
                - Footer: Horizontal Progress Bar
            - CurrentTaskCard
                - Label: "CURRENT TASK"
                - More Actions (...)
                - Title: "Refactor authentication module architecture"
                - Context: "Design System Improvements"
                - Progress Section: "Subtask Progress" + "3 / 5" + Progress Bar
        - DailyTasksSection
            - Header: "Daily Tasks"
            - FilterChips (All, Personal, Work)
            - TaskList
                - TaskItem (Repeatable)
                    - Checkbox
                    - Title Label
                    - Metadata: Date Label ("Today"), Priority Chip ("HIGH")
                - InlineAddInput
        - QuickActionFooter
            - `Start focus session` (Primary Black)
            - `Quick add task` (Secondary White)
            - `New quick note` (Secondary White)

---

## 4. UI Component Specification
| Component | Type | Label / Text | Icon | Default State |
| :--- | :--- | :--- | :--- | :--- |
| **New Task Button** | Primary Button | + New Task | Plus | Active (Black) |
| **Start Button** | Hero Button | START | None | Active (Black) |
| **Task Checkbox** | Checkbox | None | Checkmark (when checked) | Unchecked |
| **Priority Chip** | Badge | HIGH / MEDIUM | None | Colored Border/Text |
| **Filter Chip** | Choice Chip | All, Personal... | None | "All" is active |
| **Start Focus Footer**| Action Button | Start focus session | Timer | Primary Black |

---

## 5. User Interaction Model
- **Click `START` on PomodoroCard:** Initiates the countdown. UI feedback: Number starts decreasing, button label changes to "PAUSE".
- **Click `Checkbox` on TaskItem:** UI feedback: Strikethrough on text, title color fades to gray. State change: Task marked as `completed`.
- **Type in `InlineAddInput`:** Pressing `Enter` adds the task immediately to the list.
- **Click `...` on CurrentTaskCard:** Opens a context menu for "Edit", "Reschedule", or "Abandon".

---

## 6. State Management
- **`AppMode`**: `DASHBOARD` | `TASKS` | `REPORTS` | `SETTINGS`.
- **`TimerState`**: `IDLE` | `RUNNING` | `PAUSED` | `BREAK`.
- **`ActiveTask`**: The specific Task object currently linked to the Timer.
- **`DailyListFilter`**: `ALL` | `PERSONAL` | `WORK`.

---

## 7. Data Model
### Task Entity
```json
{
  "id": "uuid",
  "title": "String",
  "context": "String",
  "isCompleted": "Boolean",
  "dueDate": "ISO8601",
  "priority": "LOW | MEDIUM | HIGH",
  "subtaskCount": 5,
  "subtasksCompleted": 3,
  "category": "WORK | PERSONAL"
}
```

---

## 8. Data Flow
1.  **User clicks START**:
    - → Native UI calls `focus_core::timer::start()`.
    - → Rust Timer Engine begins emitting `TimerTick` events every second.
    - → SwiftUI `FocusViewModel` receives tick and updates `@Published var timeRemaining`.
    - → Hero Timer text re-renders.

---

## 9. Navigation Context
- **Arrival:** Default screen or Sidebar -> "Dashboard".
- **Departure:** Clicking a specific Task -> Goes to **S3 (Task Detail Panel)**. Clicking sidebar items -> Switches mode.

---

## 10. Backend / Storage Requirements
- **Local SQLite:** `tasks` table and `pomodoro_sessions` table.
- **Real-time:** The Timer must persist in the Rust Core even if the UI moves to "Settings".

---

## 11. Design System Specification
- **Typography:** Inter (San Francisco fallback). 48pt Bold for Timer, 18pt Semibold for Task Titles.
- **Spacing:** 24px padding within cards. 32px between sections.
- **Palette:** 
    - Foreground: `#000000`
    - Secondary: `#8E8E93` (Gray text)
    - Accents: `#1c7fe3` (Sync/Active Icons)
- **Component Sizing:** Sidebar width 240px. Hero Cards roughly 50% width on Desktop.

---

## 12. Accessibility Requirements
- **Keyboard:** `N` key for New Task. `Space` to start/pause timer.
- **Reader:** Timer display should announce: "Focus timer, 25 minutes remaining."
- **Contrast:** Pass WCAG AA (High contrast black on white).

---

## 13. Implementation Plan
- **View Hierarchy:** `MainContentView` -> `DashboardView` -> `ScrollView` containing `HStack` (Cards) and `VStack` (List).
- **Service Layer:** Use `TaskService` to fetch tasks where `due_date == today`.

---

## 14. Code Generation Preparation (LLM Input)
- **Component Tree:** `Sidebar`, `TopBar`, `PomodoroCard`, `FocusCard`, `DailyTaskList`, `QuickActions`.
- **State Schema:** `TimerState`, `TaskArray`, `FilterState`.
- **Handlers:** `onStartTimer`, `onCheckTask`, `onFilterChange`.
