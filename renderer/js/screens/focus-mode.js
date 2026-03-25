class FocusModeController {
  constructor() {
    this.api = window.focusAPI;
    this.timerState = null;
  }

  async mount() {
    // Hide sidebar
    document.body.classList.add('focus-mode');

    // Go Fullscreen
    await this.api.setFullScreen(true);

    // Bind DOM
    this.timerDisplay = document.querySelector('.text-\\[180px\\]') || document.querySelector('h1.tabular-nums') || document.getElementById('s4-timer-display');
    this.taskTitle = document.querySelector('h2.text-3xl') || document.getElementById('s4-current-task-title');

    // The main buttons. Stitch generated HTML structure can vary slightly
    this.buttons = Array.from(document.querySelectorAll('button'));
    this.pauseBtn = this.buttons.find(b => b.textContent.includes('PAUSE') || b.textContent.includes('RESUME')) || document.getElementById('s4-pause-btn');
    this.skipBreakBtn = this.buttons.find(b => b.textContent.includes('SKIP BREAK')) || document.getElementById('s4-skip-break-btn');

    // PiP and Exit
    this.exitBtn = document.getElementById('s4-exit-btn') || this.buttons.find(b => b.textContent.includes('close') || b.textContent.includes('fullscreen_exit'));
    this.pipBtn = document.getElementById('s4-pip-btn') || this.buttons.find(b => b.textContent.includes('picture_in_picture'));

    // Events
    if (this.pauseBtn) {
        this.pauseBtn.addEventListener('click', () => this.toggleTimer());
    }

    if (this.skipBreakBtn) {
        this.skipBreakBtn.addEventListener('click', () => {
            this.api.skipBreak();
        });
    }

    if (this.exitBtn) {
        this.exitBtn.addEventListener('click', async () => {
            await this.api.setFullScreen(false);
            document.body.classList.remove('focus-mode');
            window.appRouter.navigate('s1-dashboard');
        });
    }

    if (this.pipBtn) {
        this.pipBtn.addEventListener('click', async () => {
             await this.api.setFullScreen(false);
             document.body.classList.remove('focus-mode');
             await this.api.openPiP();
             window.appRouter.navigate('s1-dashboard');
        });
    }

    // Subscribe to timer tick
    this.api.onTimerTick((state) => this.updateTimerUI(state));

    await this.loadInitialState();
  }

  async loadInitialState() {
    this.timerState = await this.api.getTimerState();

    if (this.timerState && this.timerState.taskId) {
        const data = await this.api.getTaskWithSubtasks(this.timerState.taskId);
        if (data && data.task && this.taskTitle) {
            this.taskTitle.textContent = data.task.title;
        }
    } else if (this.taskTitle) {
        this.taskTitle.textContent = "Focus Session";
    }

    this.updateTimerUI(this.timerState);
  }

  async toggleTimer() {
      if (!this.timerState) return;
      if (this.timerState.state === 'RUNNING') {
          await this.api.pauseTimer();
      } else if (this.timerState.state === 'PAUSED') {
          await this.api.resumeTimer();
      }
      this.timerState = await this.api.getTimerState();
      this.updateTimerUI(this.timerState);
  }

  updateTimerUI(state) {
      this.timerState = state;
      if (!state || !this.timerDisplay) return;

      const mins = Math.floor(state.remaining / 60).toString().padStart(2, '0');
      const secs = (state.remaining % 60).toString().padStart(2, '0');
      this.timerDisplay.textContent = `${mins}:${secs}`;

      if (this.pauseBtn) {
          if (state.state === 'RUNNING') {
              this.pauseBtn.querySelector('span.ml-2')
                 ? this.pauseBtn.querySelector('span.ml-2').textContent = 'PAUSE'
                 : this.pauseBtn.textContent = 'PAUSE';

              const icon = this.pauseBtn.querySelector('span.material-symbols-outlined');
              if(icon) icon.textContent = 'pause';
          } else if (state.state === 'PAUSED') {
              this.pauseBtn.querySelector('span.ml-2')
                 ? this.pauseBtn.querySelector('span.ml-2').textContent = 'RESUME'
                 : this.pauseBtn.textContent = 'RESUME';

              const icon = this.pauseBtn.querySelector('span.material-symbols-outlined');
              if(icon) icon.textContent = 'play_arrow';
          }
      }

      // Hide skip break if not in break
      if (this.skipBreakBtn) {
          this.skipBreakBtn.style.display = state.state === 'BREAK' ? 'flex' : 'none';
      }

      // If idle (stopped externally or finished without auto-start), exit focus mode
      if (state.state === 'IDLE' && state.remaining === 0) {
          this.api.setFullScreen(false).then(() => {
             document.body.classList.remove('focus-mode');
             if(window.appRouter.routes['s1-dashboard']) window.appRouter.navigate('s1-dashboard');
          });
      }
  }
}

if (!window.appControllers) window.appControllers = {};
window.appControllers['s4-focus-mode'] = new FocusModeController();
window.appRouter.registerController('s4-focus-mode', window.appControllers['s4-focus-mode']);
