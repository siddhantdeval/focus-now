# Screen Specification: S5 — Reports (Analytics)

## 1. Screen Overview
**Purpose:** Visualization of productivity metrics to provide the user with insights into their work habits.
- **Primary User Goal:** Review historical performance and identify "peak focus" windows.
- **Expected User Outcomes:** Data-driven decisions on scheduling and workload management.

---

## 2. UI Layout Structure
The screen follows a dashboard format with variable-width widgets:
1.  **Summary Row (Top):** High-level daily totals.
2.  **Main Stat Area (Middle Left):** Weekly activity visualization (Bar chart).
3.  **Insight Sidebar (Right):** Automated text-based analysis of habits.
4.  **Rankings (Bottom Left):** List of most focused tasks.

---

## 3. Component Hierarchy
- Screen
    - Sidebar (Standard)
    - Content Header: "Daily Summary" + Date
    - KPI Row
        - MetricCard: "TOTAL FOCUS TIME" ("4h 20m")
        - MetricCard: "TASKS COMPLETED" ("12")
        - MetricCard: "SESSIONS COMPLETED" ("8")
    - Main Dashboard Body
        - WeeklyActivityWidget
            - Header: "Weekly Activity" + Total Count
            - Chart: Custom 7-day Bar Chart (Daily Pomodoro Counts)
        - RankingsWidget
            - Header: "Top Focused Tasks"
            - Table: Rank, Title, Session Count, Chevron link
        - InsightsPanel (Sidebar Right)
            - Header: "INSIGHTS"
            - InsightList (Bullet points with habit analysis)
            - `DOWNLOAD FULL REPORT` Button (Black)

---

## 4. UI Component Specification
| Component | Type | Label | Default State |
| :--- | :--- | :--- | :--- |
| **KPI Value** | Large Label | Numeric Value | High Contrast Black |
| **Activity Bar** | Graphic | Day Name (Mon, Tue...) | Muted Gray fill |
| **Ranking Row** | List Item | Task Name | Hover state background highlight |
| **Download Button**| Primary Button| DOWNLOAD FULL REPORT | Black |

---

## 5. Interaction Model
- **Hover on Activity Bar:** Tooltip shows the exact number of sessions for that specific day.
- **Click Ranking Row:** Navigates back to S3 (Task Detail) for that task.
- **Click `DOWNLOAD FULL REPORT`**: Triggers PDF/CSV generation of the local SQLite data.

---

## 6. State Management
- **`ReportingWindow`**: `TODAY` | `THIS_WEEK` | `THIS_MONTH`.
- **`MetricsObject`**: Aggregated data from `pomodoro_sessions` and `tasks` tables.

---

## 7. Data Model
### Report Aggregate
```json
{
  "totalSeconds": 15600,
  "tasksCompleted": 12,
  "sessionsByDay": [1, 5, 8, 2, 4, 0, 0],
  "topTasks": [{"title": "UI Refactor", "sessions": 14}]
}
```

---

## 8. Data Flow
- **Page Load**: `ReportingService` executes SQL `GROUP BY` queries on local `pomodoro_sessions` -> Generates JSON payload for the UI.

---

## 9. Design System Specification
- **Charts:** Use thin, minimalist bars. Avoid 3D or heavy borders.
- **Typography:** 32pt Semibold for main KPI values.

---

## 10. Implementation Plan
- **Library Choice:** Build charts using native drawing paths (`Path` in SwiftUI / `DrawingContext` in WinUI) rather than heavy external libraries to maintain zero-dependency performance.
