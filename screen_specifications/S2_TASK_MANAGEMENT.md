# Screen Specification: S2 — Task Management View

## 1. Screen Overview
**Purpose:** A high-density organizational hub for managing the entire task lifecycle.
- **Primary User Goal:** Review, prioritize, and edit detailed task metadata.
- **Application Flow:** Reached by clicking "Tasks" in the sidebar.
- **Expected User Outcomes:** Complete clarity on deadlines, subtask progress, and historical completion.

---

## 2. UI Layout Structure
The screen uses a **Master-Detail** split view:
1.  **Sidebar (Primary Navigation):** Remains fixed.
2.  **Task List Panel (Master):** Middle column containing segmented lists by time orientation (Today, Upcoming, Completed).
3.  **Task Detail Panel (Detail):** Right-hand panel that slides in when a task is selected, providing full editing capabilities.

---

## 3. Component Hierarchy
- Screen (Root)
    - Sidebar
    - MasterPanel (Task List)
        - Header: "Today's Focus" + Search Icon + `+ New Task`
        - Section: TODAY
            - Count Badge ("3 Tasks")
            - TaskCard (Active/Selected)
                - Checkbox
                - Details (Title, Due Today, Subtask Ratio)
                - Reminder Bell Icon
        - Section: UPCOMING
            - TaskItem
        - Section: COMPLETED
            - TaskItem (Faded/Strikethrough)
    - DetailPanel (Task Details)
        - Header: Category Tag ("PRODUCTIVITY") + Share/More Actions
        - Title: Editable Header ("Design System Update")
        - SubtaskSection
            - Header: "SUBTASKS" + Percent Complete ("40%")
            - SubtaskList
                - SubtaskRow (Checkbox + Title)
        - NoteSection
            - Header: "NOTES"
            - NoteBox (Rich text container with light gray background)
        - FocusIntegrationCard (Dark)
            - Label: "POMODORO SESSION" + Session Ratio ("2/4")
            - Display: "25:00"
            - Action: `START FOCUS` Button
        - Footer: "Created 2 days ago" + Delete Icon

---

## 4. UI Component Specification
| Component | Type | Label / Text | Icon | Default State |
| :--- | :--- | :--- | :--- | :--- |
| **Category Tag** | Badge | PRODUCTIVITY | None | Light Gray |
| **Reminder Bell** | Toggle Icon | None | Bell | Active (Filled) |
| **Action Icon (Right)**| Button | None | Delete / Trash | Secondary Gray |
| **Start Focus (Right)** | Primary Button | START FOCUS | Play | White on Dark |
| **Subtask Checkbox** | Small Checkbox | None | Check | Minimal Border |

---

## 5. User Interaction Model
- **Select Task in Master List:** Triggers `DetailPanel` to update with current task ID. Feedback: Master row gains subtle background highlight.
- **Toggle Subtask Checkbox:** Triggers `subtaskCount` update in Master List. Progress bar in DetailPanel increments immediately.
- **Click `START FOCUS` in DetailPanel:** Automatically transitions the main app state to **Focus Mode (S4)** with the current task context.
- **Click Bell Icon:** Toggles notification scheduling for the task in the Rust Core.

---

## 6. State Management
- **`SelectedTaskID`**: String (UUID) or Null.
- **`SearchQuery`**: String for live filtering.
- **`DetailPanelVisibility`**: Boolean (True by default on large screens).

---

## 7. Data Model (Extended)
### Subtask
```json
{
  "id": "uuid",
  "parentId": "uuid",
  "title": "String",
  "isCompleted": "Boolean"
}
```

---

## 8. Data Flow
1.  **User checks a Subtask**:
    - → UI calls `focus_core::task::toggle_subtask(id)`.
    - → Database updates.
    - → Rust Core emits `TaskUpdated` event.
    - → Master list refreshes the "2/5" counter.
    - → Detail panel refreshes the "40% Complete" label.

---

## 9. Navigation Context
- **Next screens:** Clicking `START FOCUS` -> **S4 (Focus Mode)**.

---

## 10. Backend / Storage Requirements
- **Recursive Query:** Rust Core must handle fetching all subtasks associated with the `selectedTaskID`.
- **Note Persistence:** Text area debounce (500ms) before saving to SQLite `notes` table.

---

## 11. Design System Specification
- **Color:** Background Detail Panel is pure white. Master list sections use `#F2F2F7` background for the selected state.
- **Spacing:** Subtask list items have 16px vertical padding.

---

## 12. Accessibility Requirements
- **Keyboard:** `Esc` to close Detail Panel. `Arrow Keys` to navigate the Master List.
- **Reader:** Detail panel title should be an `h1` equivalent.

---

## 13. Implementation Plan
- **Layout:** `NavigationSplitView` (macOS native) or custom `HStack`.
- **Logic:** `FocusViewModel` manages the selection state.

---

## 14. Code Generation Preparation (LLM Input)
- **Component Tree:** `TaskMasterView`, `TaskDetailView`, `SubtaskListView`, `NoteEditor`.
- **State Schema:** `SelectedItem`, `TaskList`, `NoteContent`.
- **Handlers:** `onSelectTask`, `onToggleSubtask`, `onSaveNote`.
