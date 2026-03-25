# Focus

**Minimalist, Local-First Productivity for Deep Work.**

Focus is a high-fidelity Pomodoro and Task Management desktop application built with Electron.js. Designed for knowledge workers, it prioritizes a distraction-free experience, pixel-perfect aesthetics, and absolute data sovereignty.

---

## 🏛️ Architectural Principles

As a **Senior Architect-driven project**, Focus adheres to a set of strict engineering standards to ensure stability, performance, and security:

### 1. Local-First & Privacy
- **Zero Cloud Dependency**: All data resides in a local SQLite database using `better-sqlite3`.
- **Zero Telemetry**: No tracking, no outbound calls. Your focus data is yours alone.
- **Offline Reliability**: The app works perfectly without an internet connection.

### 2. Performance Engineering
- **Off-Main-Thread Timer**: The core Pomodoro engine runs in a Node.js `worker_thread`, ensuring clock precision even if the UI is under heavy load.
- **SQLite WAL Mode**: Employs Write-Ahead Logging for non-blocking database writes.
- **Vanilla Performance**: The frontend uses a custom, lightweight SPA router with vanilla JS and CSS to ensure zero framework overhead and instant startup.

### 3. Security-First IPC
- **Context Isolation & Preload**: All communication between the UI and system is strictly controlled through a secure `contextBridge`.
- **Hardened Electron**: `nodeIntegration` is disabled, and a strict Content Security Policy (CSP) is enforced.

### 4. Reactive UI (Pub/Sub)
- Features a **decoupled reactivity model**. Components subscribe to a central `appState` rather than calling each other directly, enabling a scalable and maintainable Master-Detail architecture.

---

## ✨ Features
- **Monochromatic UI**: A sleek, high-contrast design system optimized for concentration.
- **Smart Task Management**: Categorize, prioritize, and manage tasks with deep subtask support.
- **Persistent Pomodoro**: A robust state-machine timer that survives app reloads.
- **Command Palette (`Cmd+K`)**: Rapid navigation and actions via a powerful keyboard-driven modal.
- **System Tray Integration**: Ambient timer display and quick-add functionality from the OS menu bar.

## 📁 Project Structure
```text
focus-now/
├── main/               # Electron Main Process (Logic & Services)
│   ├── services/       # Decoupled business logic (Tasks, Timer, Reports)
│   ├── db.js           # SQLite schema and WAL-mode initialization
│   └── timer-worker.js # High-precision background timer
├── renderer/           # Electron Renderer Process (UI)
│   ├── assets/         # Static styles and fonts (No external CDNs)
│   ├── screens/        # Pixel-perfect HTML partials from Google Stitch
│   └── js/             # Reactive state and custom SPA router
└──Tray/                # Lightweight tray-popup implementation
```

## ⌨️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (Latest LTS)
- [npm](https://www.npmjs.com/)

### Installation
```bash
git clone https://github.com/your-repo/focus.git
cd focus
npm install
npx @electron/rebuild  # Required to sync native SQLite with Electron
```

### Development
```bash
npm start
```

### Building for Production
```bash
npm run build
```

---

*Focus — Reclaiming your deep work sessions.*
