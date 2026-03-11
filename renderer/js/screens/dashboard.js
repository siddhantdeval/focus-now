class DashboardController {
  constructor() {
    this.tasks = [];
    this.timerState = null;
    this.activeTaskId = null;
    this.api = window.focusAPI;
  }

  async mount() {
    // DOM Elements
    this.taskListContainer = document.querySelector('.bg-white.border.rounded-xl.overflow-hidden .border-b')?.parentElement;

    // Add IDs if the parse script missed them due to different structure
    if (!this.taskListContainer) {
       this.taskListContainer = document.getElementById('s1-task-list-container');
       if (!this.taskListContainer) {
         console.error("Could not find task list container");
         return;
       }
    }

    this.timerDisplay = document.querySelector('.text-\\[120px\\]');
    this.timerToggleBtn = document.querySelector('.bg-black.text-white.font-bold.rounded-full');
    this.inlineAddInput = document.querySelector('input[placeholder^="Add a task"]');
    this.currentTaskTitle = document.querySelector('.text-2xl.font-bold');

    // Event Listeners
    if (this.timerToggleBtn) {
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

    // Load initial data
    await this.loadTasks();
    await this.loadTimerState();

    // Subscribe to timer tick
    this.api.onTimerTick((state) => this.updateTimerUI(state));
  }

  async loadTasks() {
    this.tasks = await this.api.getTasks({ dueToday: true });
    this.renderTasks();

    // Set active task if any
    const inProgress = this.tasks.find(t => t.status === 'IN_PROGRESS' || !t.is_completed);
    if (inProgress) {
        this.activeTaskId = inProgress.id;
        if (this.currentTaskTitle) this.currentTaskTitle.textContent = inProgress.title;
    } else {
        this.activeTaskId = null;
        if (this.currentTaskTitle) this.currentTaskTitle.textContent = 'No active task';
    }
  }

  async createTask(title) {
    await this.api.createTask({ title, due_date: Date.now() });
    await this.loadTasks(); // Reload to get new list
  }

  async toggleTaskCompletion(id, is_completed) {
    await this.api.updateTask(id, { is_completed: is_completed ? 1 : 0, status: is_completed ? 'COMPLETED' : 'TODO' });
    await this.loadTasks();
  }

  renderTasks() {
    if (!this.taskListContainer) return;

    // Keep the inline add container at the bottom
    const inlineAddHtml = this.taskListContainer.lastElementChild.outerHTML;

    let html = '';
    this.tasks.forEach(task => {
      const isCompleted = task.is_completed === 1 || task.status === 'COMPLETED';

      const checkboxClass = isCompleted
        ? 'size-5 rounded bg-black border-2 border-black flex items-center justify-center cursor-pointer'
        : 'size-5 rounded border-2 border-neutral-300 flex items-center justify-center group-hover:border-black transition-colors cursor-pointer';

      const checkIcon = isCompleted ? '<span class="material-symbols-outlined text-white text-xs font-bold">check</span>' : '';

      const textClass = isCompleted ? 'flex-1 text-neutral-400 line-through' : 'flex-1';

      html += `
        <div class="flex items-center gap-4 px-6 py-4 border-b border-[var(--border-color)] hover:bg-neutral-50 transition-colors group" data-task-id="${task.id}">
          <div class="${checkboxClass}" onclick="window.appControllers['s1-dashboard'].toggleTaskCompletion('${task.id}', ${!isCompleted})">
            ${checkIcon}
          </div>
          <div class="${textClass}">
            <p class="font-medium">${task.title}</p>
          </div>
          <div class="flex items-center gap-4 text-sm ${isCompleted ? 'text-neutral-300' : 'text-neutral-400'}">
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-base">calendar_today</span>Today</span>
          </div>
        </div>
      `;
    });

    this.taskListContainer.innerHTML = html + inlineAddHtml;

    // Rebind inline add input after render
    this.inlineAddInput = this.taskListContainer.querySelector('input[placeholder^="Add a task"]');
    if (this.inlineAddInput) {
      this.inlineAddInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && this.inlineAddInput.value.trim() !== '') {
          this.createTask(this.inlineAddInput.value.trim());
          this.inlineAddInput.value = '';
        }
      });
    }
  }

  async loadTimerState() {
    this.timerState = await this.api.getTimerState();
    this.updateTimerUI(this.timerState);
  }

  async toggleTimer() {
    if (this.timerState && this.timerState.state === 'RUNNING') {
      await this.api.pauseTimer();
    } else if (this.timerState && this.timerState.state === 'PAUSED') {
      await this.api.resumeTimer();
    } else {
      await this.api.startTimer(this.activeTaskId);
    }
    await this.loadTimerState();
  }

  updateTimerUI(state) {
    this.timerState = state;
    if (!this.timerDisplay || !this.timerToggleBtn) return;

    // Format MM:SS
    const mins = Math.floor(state.remaining / 60).toString().padStart(2, '0');
    const secs = (state.remaining % 60).toString().padStart(2, '0');
    this.timerDisplay.textContent = `${mins}:${secs}`;

    if (state.state === 'RUNNING') {
      this.timerToggleBtn.textContent = 'PAUSE';
    } else if (state.state === 'PAUSED') {
      this.timerToggleBtn.textContent = 'RESUME';
    } else {
      this.timerToggleBtn.textContent = 'START';
      // Reset to 25 mins display if idle (or fetch setting)
      if (state.state === 'IDLE' && state.remaining === 0) {
          this.api.getSetting('pomodoro_duration').then(val => {
              const dur = val || '25';
              this.timerDisplay.textContent = `${dur}:00`;
          });
      }
    }
  }
}

// Register controller globally so HTML event handlers can access it
if (!window.appControllers) window.appControllers = {};
window.appControllers['s1-dashboard'] = new DashboardController();
window.appRouter.registerController('s1-dashboard', window.appControllers['s1-dashboard']);
