# Screen Specification: S9 — OS Widgets

## 1. Screen Overview
**Purpose:** Deeply integrated desktop/mobile widgets for at-a-glance monitoring.
- **Primary User Goal:** Monitor focus without being "inside" the app.
- **Platform Specifics:** macOS Dashboard/Widgets, iOS Home Screen, Windows 11 Widgets.

---

## 3. Component Hierarchy
- Small Widget (1x1)
    - Circular Progress Ring
    - Centered Timer Text
    - Subtitle: Project Name
- Medium Widget (2x1 / 2x2)
    - Left: Timer + Progress
    - Right: "Today's Tasks" Checklist (Top 3)

---

## 5. Interaction Model
- **Deep Linking**: Tapping the widget launches the main app and focuses that specific task.
- **Interactive Checkbox** (macOS Sonoma / iOS 17+): Checking the box on the widget updates the database *without* launching the app.

---

## 13. Implementation Plan
- **Apple Target**: Build using `WidgetKit`. Shares data via `AppGroup` with the main binary.
- **Windows Target**: Use `Windows Widget` API for the Widgets Board.
