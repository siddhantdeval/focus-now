class TaskDetailController {
  constructor() {
    this.taskId = null;
    this.task = null;
    this.api = window.focusAPI;
    this.noteDebounceTimeout = null;
    this.titleDebounceTimeout = null;
  }

  async mountInContainer(container, taskId) {
    this.container = container;
    this.taskId = taskId;

    // Load HTML
    const response = await fetch('screens/s3-task-detail.html');
    if (!response.ok) {
        console.error("Failed to load S3 partial");
        return;
    }
    const html = await response.text();
    this.container.innerHTML = html;

    // Bind Elements
    this.titleEl = this.container.querySelector('h2');
    if (this.titleEl) this.titleEl.setAttribute('contenteditable', 'true');
    this.notesEl = this.container.querySelector('textarea');
    this.subtasksList = Array.from(this.container.querySelectorAll('h4')).find(el => el.textContent.includes('Subtasks'))?.parentElement.nextElementSibling;
    this.addSubtaskInput = Array.from(this.container.querySelectorAll('input')).find(i => i.placeholder && i.placeholder.includes('Add subtask'));
    this.startFocusBtn = Array.from(this.container.querySelectorAll('button')).find(el => el.textContent.includes('Start focus session'));
    this.closeBtn = this.container.querySelector('header button');

    // Setup Event Listeners
    if (this.titleEl) {
        this.titleEl.addEventListener('input', (e) => this.debounceTitleUpdate(e.target.innerText));
    }

    if (this.notesEl) {
        this.notesEl.addEventListener('input', (e) => this.debounceNoteUpdate(e.target.value));
    }

    if (this.addSubtaskInput) {
        this.addSubtaskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.addSubtaskInput.value.trim() !== '') {
                this.createSubtask(this.addSubtaskInput.value.trim());
                this.addSubtaskInput.value = '';
            }
        });
    }

    if (this.startFocusBtn) {
        this.startFocusBtn.addEventListener('click', async () => {
            await this.api.startTimer(this.taskId);
            window.appRouter.navigate('s4-focus-mode');
        });
    }

    if (this.closeBtn) {
        this.closeBtn.addEventListener('click', () => {
            this.container.innerHTML = ''; // Close panel
            if (window.appControllers['s2-task-management']) {
                window.appControllers['s2-task-management'].selectedTaskId = null;
                window.appControllers['s2-task-management'].loadTasks(); // Remove highlight
            }
        });
    }

    await this.loadData();
  }

  async loadData() {
    if (!this.taskId) return;

    // Fetch task and subtasks
    this.taskData = await this.api.getTaskWithSubtasks(this.taskId);
    if (!this.taskData) return;

    this.task = this.taskData.task;
    this.subtasks = this.taskData.subtasks || [];

    // Fetch notes
    this.note = await this.api.getNote(this.taskId);

    this.render();
  }

  render() {
    if (this.titleEl && document.activeElement !== this.titleEl) {
        this.titleEl.innerText = this.task.title;
    }

    if (this.notesEl && document.activeElement !== this.notesEl) {
        this.notesEl.value = this.note ? this.note.content : '';
    }

    this.renderSubtasks();
  }

  renderSubtasks() {
    if (!this.subtasksList) return;

    let html = '';
    this.subtasks.forEach(st => {
        const isCompleted = st.is_completed === 1;
        html += `
            <div class="flex items-center gap-3">
                <input type="checkbox" class="w-4 h-4 rounded border-slate-300 text-primary cursor-pointer"
                       ${isCompleted ? 'checked' : ''}
                       onchange="window.appControllers['s3-task-detail'].toggleSubtask('${st.id}', this.checked)" />
                <span class="text-sm ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-700'}">${st.title}</span>
            </div>
        `;
    });

    // Maintain the add subtask input if it was in this container (though usually it's separate)
    this.subtasksList.innerHTML = html;
  }

  async createSubtask(title) {
      await this.api.createTask({ title, parent_id: this.taskId });
      await this.loadData();
  }

  async toggleSubtask(subtaskId, isCompleted) {
      await this.api.updateTask(subtaskId, { is_completed: isCompleted ? 1 : 0 });
      await this.loadData();
  }

  debounceTitleUpdate(newTitle) {
      clearTimeout(this.titleDebounceTimeout);
      this.titleDebounceTimeout = setTimeout(async () => {
          await this.api.updateTask(this.taskId, { title: newTitle });
          if (window.appControllers['s2-task-management']) {
              window.appControllers['s2-task-management'].loadTasks();
          }
      }, 500);
  }

  debounceNoteUpdate(content) {
      clearTimeout(this.noteDebounceTimeout);
      this.noteDebounceTimeout = setTimeout(async () => {
          await this.api.upsertNote(this.taskId, content);
      }, 1500);
  }
}

if (!window.appControllers) window.appControllers = {};
window.appControllers['s3-task-detail'] = new TaskDetailController();
