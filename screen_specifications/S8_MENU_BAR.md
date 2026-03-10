# Screen Specification: S8 — Menu Bar Dropdown

## 1. Screen Overview
**Purpose:** An ambient companion that keeps the timer and top tasks visible while the user is inside other applications (IDE, Browser, etc.).
- **Primary User Goal:** Glance at time and mark tasks as done without switching apps.
- **Expected User Outcomes:** Continuous awareness of focus progress.

---

## 2. UI Layout Structure
A narrow vertical popover anchored to the system menu bar:
1.  **Compact Timer (Top):** Time and current status.
2.  **Focus Controls:** Action buttons for the active session.
3.  **Quick Entry:** Small text field for adding tasks.
4.  **Minified List:** Top 3 upcoming tasks.

---

## 4. UI Component Specification
| Component | Type | Label | Icon | Default State |
| :--- | :--- | :--- | :--- | :--- |
| **Status Text** | Label | 24:15 | Focus | Blue Accent Color |
| **Media Controls** | Button Group | None | Play, Pause, Stop | Circular Outline |
| **Quick Entry** | Slim Input | Hit Enter to add... | Plus | Secondary Gray |
| **Checklist Row** | Mini Row | Task Title | Checkbox | Minimalist text |

---

## 8. Data Flow
- **Click Play/Pause**: Native `NSStatusItem` callback -> `TimerService::toggle()`.
- **Add Task**: Native input handler -> `TaskService::create_task()` -> Emits event -> Refresh the 3 list items.

---

## 13. Implementation Plan
- **macOS Implementation**: Use `NSStatusItem` with a `NSPopover` containing a SwiftUI view.
- **Windows Implementation**: Use `System.Windows.Forms.NotifyIcon`.
