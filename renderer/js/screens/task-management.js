class TaskManagementController {
  constructor() {
    this.tasks = [];
    this.api = window.focusAPI;
    this.selectedTaskId = null;
  }

  async mount() {
    this.todayList = document.querySelector('h3:contains("Today")')?.nextElementSibling || document.getElementById('s2-today-task-list');
    this.upcomingList = document.querySelector('h3:contains("Upcoming")')?.nextElementSibling || document.getElementById('s2-upcoming-task-list');
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

    await this.loadTasks();
  }

  async loadTasks() {
    // Basic split logic
    const allTasks = await this.api.getTasks({});

    // For simplicity, partition locally based on due_date (if present)
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    this.todayTasks = [];
    this.upcomingTasks = [];

    allTasks.forEach(task => {
        if (!task.due_date) {
            this.todayTasks.push(task); // Default to today if no date
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
    await this.loadTasks();
  }

  async toggleTaskCompletion(id, is_completed) {
    await this.api.updateTask(id, { is_completed: is_completed ? 1 : 0, status: is_completed ? 'COMPLETED' : 'TODO' });
    await this.loadTasks();
  }

  renderTasks(taskList, container, isToday) {
    if (!container) return;

    // Preserve inline add
    const inlineAddHtml = isToday && container.lastElementChild && container.lastElementChild.querySelector('input')
                          ? container.lastElementChild.outerHTML : '';

    let html = '';
    taskList.forEach(task => {
      const isCompleted = task.is_completed === 1 || task.status === 'COMPLETED';

      const checkboxClass = isCompleted
        ? 'size-5 rounded bg-black border-2 border-black flex items-center justify-center cursor-pointer'
        : 'size-5 rounded border-2 border-neutral-300 flex items-center justify-center group-hover:border-black transition-colors cursor-pointer';

      const checkIcon = isCompleted ? '<span class="material-symbols-outlined text-white text-xs font-bold">check</span>' : '';

      const textClass = isCompleted ? 'flex-1 text-neutral-400 line-through' : 'flex-1';

      const selectedClass = this.selectedTaskId === task.id ? 'bg-neutral-50' : '';

      html += `
        <div class="flex items-center gap-4 px-6 py-4 border-b border-[var(--border-color)] hover:bg-neutral-50 transition-colors group ${selectedClass}"
             data-task-id="${task.id}"
             onclick="window.appControllers['s2-task-management'].selectTask('${task.id}')">
          <div class="${checkboxClass}" onclick="event.stopPropagation(); window.appControllers['s2-task-management'].toggleTaskCompletion('${task.id}', ${!isCompleted})">
            ${checkIcon}
          </div>
          <div class="${textClass}">
            <p class="font-medium">${task.title}</p>
          </div>
          <div class="flex items-center gap-4 text-sm ${isCompleted ? 'text-neutral-300' : 'text-neutral-400'}">
             <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-base">calendar_today</span>
                ${isToday ? 'Today' : 'Upcoming'}
             </span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html + inlineAddHtml;

    // Rebind inline add input after render
    if (isToday) {
        this.inlineAddInput = container.querySelector('input[placeholder^="Add a task"]');
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

    // Highlight selected row visually
    document.querySelectorAll('.group[data-task-id]').forEach(row => {
        if (row.getAttribute('data-task-id') === taskId) {
            row.classList.add('bg-neutral-50');
        } else {
            row.classList.remove('bg-neutral-50');
        }
    });

    // Mount S3 Task Detail controller into the aside container
    if (this.detailContainer && window.appControllers['s3-task-detail']) {
        window.appControllers['s3-task-detail'].mountInContainer(this.detailContainer, taskId);
    }
  }
}

if (!window.appControllers) window.appControllers = {};
window.appControllers['s2-task-management'] = new TaskManagementController();
window.appRouter.registerController('s2-task-management', window.appControllers['s2-task-management']);

// Add a helper for document.querySelector with contains
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
