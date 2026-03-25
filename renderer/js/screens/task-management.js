class TaskManagementController {
  constructor() {
    this.tasks = [];
    this.api = window.focusAPI;
    this.state = window.appState;
    this.selectedTaskId = null;
    this.unsubTasks = null;
  }

  async mount() {
    this.todayList = document.getElementById('s2-today-task-list') || document.querySelector('h3:contains("Today")')?.nextElementSibling;
    this.upcomingList = document.getElementById('s2-upcoming-task-list') || document.querySelector('h3:contains("Upcoming")')?.nextElementSibling;
    this.detailContainer = document.getElementById('s2-detail-panel-container') || document.querySelector('aside.w-96');
    this.inlineAddInput = document.getElementById('s2-inline-add-input') || document.querySelector('input[placeholder^="Add a task"]');
    this.newTaskBtn = document.getElementById('s2-header-new-task-btn') || document.querySelector('header button:last-child');

    if (this.inlineAddInput) {
      this.inlineAddInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && this.inlineAddInput.value.trim() !== '') {
          this.createTask(this.inlineAddInput.value.trim());
          this.inlineAddInput.value = '';
        }
      });
    }

    if (this.newTaskBtn && this.inlineAddInput) {
      this.newTaskBtn.addEventListener('click', () => {
        this.inlineAddInput.focus();
      });
    }

    // Reactive State Subscriptions
    this.unsubTasks = this.state.subscribe('tasks', (tasks) => {
        this.processAndRender(tasks);
    });

    // Initial hydration
    this.processAndRender(this.state.get('tasks'));
  }

  processAndRender(allTasks) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.todayTasks = [];
    this.upcomingTasks = [];

    // Filter out subtasks from the main list
    const topLevelTasks = allTasks.filter(t => !t.parent_id);

    topLevelTasks.forEach(task => {
        if (!task.due_date) {
            this.todayTasks.push(task);
            return;
        }
        const taskDate = new Date(task.due_date);
        if (taskDate < tomorrow) {
            this.todayTasks.push(task);
        } else {
            this.upcomingTasks.push(task);
        }
    });

    this.renderTasks(this.todayTasks, this.todayList, true);
    this.renderTasks(this.upcomingTasks, this.upcomingList, false);
  }

  async createTask(title) {
    await this.api.createTask({ title, due_date: Date.now() });
  }

  async toggleTaskCompletion(id, is_completed) {
    await this.api.updateTask(id, { is_completed });
  }

  renderTasks(taskList, container, isToday) {
    if (!container) return;

    // Preserve inline add row
    const containers = Array.from(container.children);
    const inlineAddRow = containers.find(child => child.querySelector('input'));
    const inlineAddHtml = isToday && inlineAddRow ? inlineAddRow.outerHTML : '';

    let html = '';
    taskList.forEach(task => {
      const isCompleted = task.is_completed === 1;

      const checkboxClass = isCompleted
        ? 'size-5 rounded bg-black border-2 border-black flex items-center justify-center cursor-pointer'
        : 'size-5 rounded border-2 border-neutral-300 flex items-center justify-center group-hover:border-black transition-colors cursor-pointer';

      const checkIcon = isCompleted ? '<span class="material-symbols-outlined text-white text-xs font-bold">check</span>' : '';
      const textClass = isCompleted ? 'flex-1 text-neutral-400 line-through' : 'flex-1';
      const selectedClass = this.selectedTaskId === task.id ? 'bg-neutral-50' : '';

      html += `
        <div class="flex items-center gap-4 px-6 py-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors group ${selectedClass}"
             data-task-id="${task.id}"
             onclick="window.appControllers['s2-task-management'].selectTask('${task.id}')">
          <div class="${checkboxClass}" onclick="event.stopPropagation(); window.appControllers['s2-task-management'].toggleTaskCompletion('${task.id}', ${!isCompleted})">
            ${checkIcon}
          </div>
          <div class="${textClass}">
            <p class="font-medium">${task.title}</p>
          </div>
          <div class="flex items-center gap-4 text-sm ${isCompleted ? 'text-neutral-200' : 'text-neutral-400'}">
             <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-base">calendar_today</span>
                ${isToday ? 'Today' : 'Upcoming'}
             </span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html + inlineAddHtml;

    // Rebind inline add input
    if (isToday) {
        this.inlineAddInput = container.querySelector('input');
        if (this.inlineAddInput) {
            this.inlineAddInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && this.inlineAddInput.value.trim() !== '') {
                    this.createTask(this.inlineAddInput.value.trim());
                    this.inlineAddInput.value = '';
                }
            });
        }
    }
  }

  selectTask(taskId) {
    this.selectedTaskId = taskId;

    // Update UI highlights
    document.querySelectorAll('.group[data-task-id]').forEach(row => {
        if (row.getAttribute('data-task-id') === taskId) {
            row.classList.add('bg-neutral-50');
        } else {
            row.classList.remove('bg-neutral-50');
        }
    });

    // Mount S3 Task Detail controller
    if (this.detailContainer && window.appControllers['s3-task-detail']) {
        window.appControllers['s3-task-detail'].mountInContainer(this.detailContainer, taskId);
    }
  }
}

// Register controller
if (!window.appControllers) window.appControllers = {};
window.appControllers['s2-task-management'] = new TaskManagementController();
window.appRouter.registerController('s2-task-management', window.appControllers['s2-task-management']);

// Helper for querySelector with contains
const _originalQuerySelector = Document.prototype.querySelector;
Document.prototype.querySelector = function(selector) {
    if (selector.includes(':contains("')) {
        const match = selector.match(/(.*):contains\("(.*)"\)/);
        if (match) {
            const elements = this.querySelectorAll(match[1]);
            return Array.from(elements).find(el => el.textContent.includes(match[2])) || null;
        }
    }
    return _originalQuerySelector.call(this, selector);
};
