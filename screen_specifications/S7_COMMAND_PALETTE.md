# Screen Specification: S7 — Command Palette (Cmd+K)

## 1. Screen Overview
**Purpose:** A high-speed, keyboard-driven interface that allows users to perform any application action or navigate to any screen without using a mouse.
- **Primary User Goal:** Instant execution of commands (e.g., "Start Timer", "Create Task").
- **Application Flow:** A global modal overlay accessible via `Cmd+K` (macOS) or `Ctrl+K` (Windows).
- **Expected User Outcomes:** Minimal friction in workflow and rapid navigation.

---

## 2. UI Layout Structure
The screen is a minimalist modal centered in the viewport:
1.  **Search Input (Header):** A single line field for fuzzy search.
2.  **Suggestion List (Body):** Segmented lists of commands and recent items.
3.  **Keyboard Hint Bar (Footer):** Instructions for selection and navigation.

---

## 4. UI Component Specification
| Component | Type | Label | Icon | Action |
| :--- | :--- | :--- | :--- | :--- |
| **Search Input** | Text Field | "Type a command..." | Search | Fuzzy filters the list below |
| **Command Row** | List Item | e.g., "Start Focus Session" | Timer | Triggers the specific service |
| **Search Result** | List Item | e.g., "Quarterly growth..." | History| Navigates to that specific entity|
| **Kbd Hint** | Legend | ENTER to select | None | Non-interactive indicator |

---

## 5. Interaction Model
- **`Arrows Up/Down`**: Changes the active selection highlight.
- **`Enter`**: Executes the selected command or navigates to the item.
- **`Esc`**: Dismisses the palette.
- **Live Filtering**: As the user types, the list re-ranks based on relevance.

---

## 8. Data Flow
- **Input Received**: UI -> `CommandService::search(query)` -> Returns list of `Action` and `Task` objects.

---

## 11. Design System Specification
- **Overlay:** Black backdrop with 20% opacity.
- **Background:** Pure White (`#FFFFFF`).
- **Corner Radius:** 12px.
- **Spacing:** 16px internal padding.
