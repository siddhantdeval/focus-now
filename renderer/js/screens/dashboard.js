class DashboardController {
  constructor() {
    this.tasks = [];
    this.timerState = null;
    this.activeTaskId = null;
    this.api = window.focusAPI;
    this.state = window.appState;
    this.unsubTasks = null;
    this.unsubTimer = null;
  }

  async mount() {
    // DOM Elements - Using resilient selectors
    this.taskListContainer = document.getElementById('s1-task-list-container') || 
                             document.querySelector('.bg-white.border.rounded-xl.overflow-hidden .border-b')?.parentElement;

    if (!this.taskListContainer) {
       console.error("Dashboard: Could not find task list container");
       return;
    }

    this.timerDisplay = document.querySelector('.text-\\[120px\\]');
    this.timerToggleBtn = document.querySelector('.bg-black.text-white.font-bold.rounded-full');
    this.inlineAddInput = document.querySelector('input[placeholder^="Add a task"]');
    this.currentTaskTitle = document.querySelector('.text-2xl.font-bold');

    // Attach Action Listeners
    if (this.timerToggleBtn) {
      this.timerToggleBtn.replaceWith(this.timerToggleBtn.cloneNode(true)); // Clear old listeners
      this.timerToggleBtn = document.querySelector('.bg-black.text-white.font-bold.rounded-full');
      this.timerToggleBtn.addEventListener('click', () => this.toggleTimer());
    }

    if (this.inlineAddInput) {
      this.inlineAddInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && this.inlineAddInput.value.trim() !== '') {
          this.createTask(this.inlineAddInput.value.trim());
          this.inlineAddInput.value = '';
        }
      });
    }

    // Reactive State Subscriptions
    this.unsubTasks = this.state.subscribe('tasks', (tasks) => {
        this.tasks = tasks.filter(t => !t.parent_id); // Only top-level today
        this.renderTasks();
    });

    this.unsubTimer = this.state.subscribe('timer', (state) => {
        this.updateTimerUI(state);
    });

    // Initial hydration from state
    this.tasks = this.state.get('tasks').filter(t => !t.parent_id);
    this.timerState = this.state.get('timer');
    
    this.renderTasks();
    this.updateTimerUI(this.timerState);
  }

  async createTask(title) {
    await this.api.createTask({ title, due_date: Date.now() });
    // State is updated automatically by ipc-bridge wrapper
  }

  async toggleTaskCompletion(id, is_completed) {
    await this.api.updateTask(id, { is_completed });
  }

  renderTasks() {
    if (!this.taskListContainer) return;

    // Detect active task (first non-completed today)
    const inProgress = this.tasks.find(t => !t.is_completed);
    if (inProgress) {
        this.activeTaskId = inProgress.id;
        if (this.currentTaskTitle) this.currentTaskTitle.textContent = inProgress.title;
    } else {
        this.activeTaskId = null;
        if (this.currentTaskTitle) this.currentTaskTitle.textContent = 'Capture a new focus task below';
    }

    // Preserve the bottom border/add-row layout from Stitch
    const containers = Array.from(this.taskListContainer.children);
    const inlineAddRow = containers.find(child => child.querySelector('input'));
    const inlineAddHtml = inlineAddRow ? inlineAddRow.outerHTML : '';

    let html = '';
    this.tasks.forEach(task => {
      const isCompleted = task.is_completed === 1;

      const checkboxClass = isCompleted
        ? 'size-5 rounded bg-black border-2 border-black flex items-center justify-center cursor-pointer'
        : 'size-5 rounded border-2 border-neutral-300 flex items-center justify-center group-hover:border-black transition-colors cursor-pointer';

      const checkIcon = isCompleted ? '<span class="material-symbols-outlined text-white text-xs font-bold">check</span>' : '';
      const textClass = isCompleted ? 'flex-1 text-neutral-400 line-through' : 'flex-1';

      html += `
        <div class="flex items-center gap-4 px-6 py-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors group" data-task-id="${task.id}">
          <div class="${checkboxClass}" onclick="window.appControllers['s1-dashboard'].toggleTaskCompletion('${task.id}', ${!isCompleted})">
            ${checkIcon}
          </div>
          <div class="${textClass}">
            <p class="font-medium">${task.title}</p>
          </div>
          <div class="flex items-center gap-4 text-sm ${isCompleted ? 'text-neutral-200' : 'text-neutral-400'}">
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-base">calendar_today</span>Today</span>
          </div>
        </div>
      `;
    });

    this.taskListContainer.innerHTML = html + inlineAddHtml;

    // Rebind inline add input after render
    this.inlineAddInput = this.taskListContainer.querySelector('input');
    if (this.inlineAddInput) {
      this.inlineAddInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && this.inlineAddInput.value.trim() !== '') {
          this.createTask(this.inlineAddInput.value.trim());
          this.inlineAddInput.value = '';
        }
      });
    }
  }

  async toggleTimer() {
    if (this.timerState && this.timerState.status === 'RUNNING') {
      await this.api.pauseTimer();
    } else if (this.timerState && this.timerState.status === 'PAUSED') {
      await this.api.resumeTimer();
    } else {
      await this.api.startTimer(this.activeTaskId);
    }
  }

  updateTimerUI(state) {
    this.timerState = state;
    if (!this.timerDisplay || !this.timerToggleBtn) return;

    // MM:SS Formatting
    const mins = Math.floor(state.remaining / 60).toString().padStart(2, '0');
    const secs = (state.remaining % 60).toString().padStart(2, '0');
    this.timerDisplay.textContent = `${mins}:${secs}`;

    if (state.status === 'RUNNING') {
      this.timerToggleBtn.textContent = 'PAUSE';
      this.timerToggleBtn.classList.replace('bg-black', 'bg-neutral-800');
    } else if (state.status === 'PAUSED') {
      this.timerToggleBtn.textContent = 'RESUME';
      this.timerToggleBtn.classList.replace('bg-neutral-800', 'bg-black');
    } else {
      this.timerToggleBtn.textContent = 'START';
      this.timerToggleBtn.classList.replace('bg-neutral-800', 'bg-black');
    }
  }
}

// Register controller globally
if (!window.appControllers) window.appControllers = {};
window.appControllers['s1-dashboard'] = new DashboardController();
window.appRouter.registerController('s1-dashboard', window.appControllers['s1-dashboard']);
