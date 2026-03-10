# Screen Specification: S3 — Task Detail Panel (Full)

## 1. Screen Overview
**Purpose:** Comprehensive management of an individual task's life cycle, providing granular control over subtasks, notes, and scheduling.
- **Primary User Goal:** Fine-tune task metadata, track historical activity, and start focus sessions.
- **Application Flow:** Secondary level view reached from Dashboard or Task Management.
- **Expected User Outcomes:** Complete historical context and organized plan for a specific work item.

---

## 2. UI Layout Structure
The screen is organized as a centered document or card:
1.  **Header Navigation:** Global top bar with app title and primary navigation links.
2.  **Breadcrumb/Category Row:** Information about the task's context (e.g., "Marketing Q4").
3.  **Task Header:** Large title with completion checkbox.
4.  **Information Panes:**
    - Left Column: Subtasks list, Notes field, Scheduling (Reminders/Repeat).
    - Right Sidebar: Task Info (metadata) and Activity Log.
5.  **Sticky Footer:** Persistent session tracking and "Start Focus" button.

---

## 3. Component Hierarchy
- Screen
    - Header
        - Branding ("TaskFocus")
        - Nav: Tasks, Focus, Analytics
        - Search Bar
        - Icons: Notification, User Profile
    - Content Area (2-Column Grid)
        - Left Column (Main Specs)
            - Task Title Section
                - Huge Checkbox
                - H1 Title ("Finalize quarterly marketing report")
                - Metadata Line: Due Date, Category Tag
            - Subtasks Section
                - Header: "SUBTASKS" + Progress ("2 of 4 complete")
                - Subtask List (Drag-and-drop enabled)
                - `+ Add subtask...` placeholder
            - Notes Section
                - Header: "NOTES"
                - Text Area (Markdown support)
            - Temporal Section
                - Reminders (Time + Frequency)
                - Repeat (Cycle description)
        - Right Sidebar (Metadata/Audit)
            - Task Info Card
                - Created Date
                - Project Name
                - Priority Level
            - Activity Section
                - Header: "ACTIVITY"
                - Chronological List (Icon + Event + Timestamp)
    - Footer
        - Progress Info ("3 / 5 sessions completed")
        - Icon: Timer
        - `Start Focus` Button (Black)

---

## 4. UI Component Specification
| Component | Type | Label / Text | Icon | Default State |
| :--- | :--- | :--- | :--- | :--- |
| **Task Checkbox** | Large Toggle | None | Check | Minimal Border |
| **Category Tag** | Badge | MARKETING | Tag | Outlined |
| **Subtask Row** | Checkbox List Item| Subtask Title | Checkbox | Native OS text style |
| **Activity Item** | Audit Row | Event Name | Pencil/Check | Muted Gray Text |

---

## 5. User Interaction Model
- **Click Subtask Checkbox:** Triggers immediate progress bar update in the footer.
- **Type in "Add subtask..."**: Creates a new row on `Enter`.
- **Edit Notes:** Auto-saves with periodic debounce to the `notes` table in SQLite.
- **Click `Start Focus`**: Triggers transition to S4 (Focus Mode).

---

## 6. State Management
- **`currentTask`**: Full Task object including `ActivityArray` and `SubtaskArray`.
- **`editMode`**: Boolean for individual text components.

---

## 7. Data Model
### Activity Log Item
```json
{
  "id": "uuid",
  "taskId": "uuid",
  "event": "CREATED | UPDATED | COMPLETED | SUBTASK_DONE",
  "description": "String",
  "timestamp": "ISO8601"
}
```

---

## 8. Data Flow
- **Edit Title**: UI -> `update_task_title(id, new_title)` -> SQLite -> Rust Core emits `ActivityCreated` -> UI Appends to Activity Log.

---

## 9. Implementation Plan
- **Backend Service**: `Service::get_full_task_context(id)` to recursively fetch all related notes and subtasks.

---

## 10. Code Generation Preparation
- **Component Tree:** `TaskHeader`, `MetadataSidebar`, `SubtaskManager`, `MarkdownEditor`, `ActivityLog`.
- **State Schema:** `TaskContext`, `SubtaskProgress`.
