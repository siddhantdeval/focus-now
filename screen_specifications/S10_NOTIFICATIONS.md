# Screen Specification: S10 — Rich Notifications

## 1. Screen Overview
**Purpose:** Actionable system-level alerts that trigger when a timer concludes or a reminder is due.
- **Primary User Goal:** Transition to the next work/break phase without re-entering the app.
- **Expected User Outcomes:** High continuity between work blocks.

---

## 3. Component Hierarchy
- Native Notification Banner
    - App Icon + "PRODUCTIVITY APP" Title
    - Event Header: "Focus Complete" / "Rest Over"
    - Body Text: Motivational guidance.
    - Media Frame: Simple high-key focused imagery (optional).
    - Action Buttons
        - `Start Break` (Primary Accent)
        - `Add +5 Mins` (Secondary)
        - `Skip` (Tertiary)

---

## 5. Interaction Model
- **`Start Break`**: Updates `TimerState` to `BREAK` and begins the new countdown in the background core.
- **`Add +5 Mins`**: Extends the current `TimerValue` by 300 seconds.

---

## 13. Implementation Plan
- **Registration**: Request `UNAuthorization` (Apple) or `ToastNotificationManager` (Windows).
- **Triggers**: Schedule Local Notifications in the Rust Core upon `SessionComplete`.
