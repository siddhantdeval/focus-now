# Screen Specification: S4 — Focus Mode (Distraction-Free)

## 1. Screen Overview
**Purpose:** A hyper-minimalist environment designed for deep work, stripping away all UI elements except the absolute essentials.
- **Primary User Goal:** Maintain concentration during a Pomodoro session.
- **Expected User Outcomes:** Reduced visual distraction and high accountability to the current task.

---

## 2. UI Layout Structure
The screen is an immersive, high-contrast workspace:
1.  **Top Header (Status):** Small centered text indicating session status.
2.  **Center Stage:** Large-scale timer and active task title.
3.  **Bottom Navigation (Controls):** Simple text actions for session management.
4.  **Implicit Footer:** Motivational quote or session goal in very low contrast.

---

## 3. Component Hierarchy
- Screen (Fullscreen)
    - Fullscreen Toggle (Top Right Icon)
    - Header: "FOCUS SESSION ACTIVE" (Subtle Gray)
    - Main Visual Area (Centered)
        - Timer Display: Huge Typography ("24:59")
        - Task Highlight: "Design System Audit"
        - Progress Bar: Minimalist Underline Progress ("3 of 5 subtasks completed")
    - Control Bar (Lower Third)
        - Action: `PAUSE` (Blue Accent Underline)
        - Action: `SKIP BREAK` (Gray)
        - Action: `RESET SESSION` (Gray)
    - Quote Footer: "DEEP WORK IS A SUPERPOWER..." (Ultra-low contrast gray)

---

## 4. UI Component Specification
| Component | Type | Label / Text | Default State | Hover/Active State |
| :--- | :--- | :--- | :--- | :--- |
| **Timer Text** | Typography | HH:MM | Fixed | None |
| **Control Link** | Text Action | PAUSE / SKIP / RESET | Muted Gray | Blue Accent |
| **Progress Line** | Bar | None | Gray Track | Black Fill |

---

## 5. User Interaction Model
- **Keypress `Escape` or `F`**: Exit Fullscreen / Exit Focus Mode.
- **Click `PAUSE`**: Freezes the timer. UI feedback: Label changes to "RESUME", timer color shifts to subtle gray.
- **Click `SKIP BREAK`**: Immediately starts the next work interval.

---

## 6. State Management
- **`TimerValue`**: Countdown value from Rust Core.
- **`ActiveTaskTitle`**: Bound to the currently selected task.
- **`FullscreenMode`**: Boolean controlling system window state.

---

## 7. Data Flow
- **Timer Ticks**: Rust `TimerEngine` -> FFI Callback -> SwiftUI `FocusModeView`.
- **Completion**: Timer reaches 0 -> Rust Core triggers `SessionComplete` -> System alert + UI transition to "Break" state.

---

## 8. Implementation Plan
- **Native Logic**: Use macOS `NSWindow.toggleFullScreen()` to ensure true immersive focus.
- **View Logic**: The view should consume almost zero resources; no sidebar or background tasks should re-render during this mode.

---

## 9. Design System Specification
- **Timer Font Size:** 200pt+ (Fluid sizing based on window width).
- **Background:** Pure White (`#FFFFFF`) or Pure Black (`#000000`).
- **Typography:** Inter Bold for Task Name.

---

## 10. Code Generation Preparation
- **Component Tree:** `FocusTimer`, `ActiveTaskLabel`, `ControlBar`, `QuoteBox`.
- **State Schema:** `SessionTime`, `IsPaused`.
