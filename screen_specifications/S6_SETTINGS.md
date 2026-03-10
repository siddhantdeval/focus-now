# Screen Specification: S6 — Settings

## 1. Screen Overview
**Purpose:** Configuration hub for managing application behavior, focus parameters, and data synchronization.
- **Primary User Goal:** Customize Pomodoro intervals, toggle notifications, and manage account sync.
- **Expected User Outcomes:** A tailored productivity experience and data safety.

---

## 2. UI Layout Structure
The screen uses a vertically segmented "Form" layout:
1.  **Sidebar:** Standard navigation.
2.  **Sectioned Settings Area:** Grouped configurations with clear headers and icons.
    - General (Timer defaults)
    - Notifications (Triggers)
    - Synchronization (Cloud Status)
    - Data Management (Import/Export)

---

## 3. Component Hierarchy
- Screen
    - Sidebar
    - Content Header: "Settings" + Subtitle
    - SettingsBody (Scrollable)
        - Section: GENERAL
            - DropdownGroup
                - Label: "Default Pomodoro Duration" + Picker ("25 minutes")
                - Label: "Break Duration" + Picker ("5 minutes")
        - Section: NOTIFICATIONS
            - ToggleRow: "Session Reminders" + Description + Switch (ON)
            - ToggleRow: "Completion Alerts" + Description + Switch (OFF)
        - Section: SYNCHRONIZATION
            - SyncStatusCard (Gray Bordered Box)
                - Icon: Cloud
                - Text: User Email + Last Synced Time
                - `Sync Now` Button (White/Outlined)
        - Section: DATA MANAGEMENT
            - ActionRow:
                - `Export Data (.json)` Button
                - `Create Backup` Button

---

## 4. UI Component Specification
| Component | Type | Default State | Interaction |
| :--- | :--- | :--- | :--- |
| **Setting Toggle** | Switch | ON/OFF | Native toggle animation |
| **Duration Picker**| Dropdown | 25 min | Contextual popup menu |
| **Sync Now** | Ghost Button | Outlined | Spins during active sync |
| **Data Action** | Button | Full Width (Mobile) | Primary Outline |

---

## 5. Interaction Model
- **Change Duration Dropdown**: Immediately updates the `TimerEngine` defaults in Rust.
- **Toggle Switch**: Persists Boolean to SQLite `settings` table instantly (No "Save" button required).
- **Click `Sync Now`**: Manually triggers the Rust `SyncService` background worker.

---

## 6. State Management
- **`SettingsStore`**: A reactive object synced with the local `settings` table.

---

## 7. Data Flow
- **Update Setting**: UI -> `update_setting(key, value)` -> SQLite -> Rust Core emits `SettingsChanged`.

---

## 8. Backend / Storage Requirements
- **Cloud Interface**: The Synchronization section requires a valid session token from the Cloud API.
- **File System**: Export/Backup buttons require OS-level File Picker access.

---

## 9. Design System Specification
- **Icon Style:** Outline Icons (24px).
- **Spacing:** 24px between setting rows. 48px between sections.

---

## 10. Code Generation Preparation
- **Component Tree:** `SettingsSection`, `ToggleRow`, `PickerRow`, `SyncStatusCard`.
- **State Schema:** `AppSettingsObject`.
