const { parentPort } = require('worker_threads');

let state = {
  status: 'IDLE', // IDLE, RUNNING, PAUSED, BREAK
  remaining: 0,
  totalDuration: 0,
  sessionCount: 0,
  currentType: 'FOCUS', // FOCUS, SHORT_BREAK, LONG_BREAK
  taskId: null,
  endTime: null,
  pausedRemaining: null
};

let intervalId = null;

function emitState() {
  parentPort.postMessage({ ...state });
}

function startTimer(durationSeconds, type, taskId) {
  if (intervalId) clearInterval(intervalId);

  state.status = 'RUNNING';
  state.currentType = type;
  state.taskId = taskId;
  state.totalDuration = durationSeconds;
  state.remaining = durationSeconds;
  state.endTime = Date.now() + (durationSeconds * 1000);
  state.pausedRemaining = null;

  tick();
  intervalId = setInterval(tick, 1000);
  emitState();
}

function pauseTimer() {
  if (state.status === 'RUNNING') {
    clearInterval(intervalId);
    state.status = 'PAUSED';
    state.pausedRemaining = state.remaining;
    state.endTime = null;
    emitState();
  }
}

function resumeTimer() {
  if (state.status === 'PAUSED') {
    state.status = 'RUNNING';
    state.remaining = state.pausedRemaining;
    state.endTime = Date.now() + (state.remaining * 1000);
    state.pausedRemaining = null;

    tick();
    intervalId = setInterval(tick, 1000);
    emitState();
  }
}

function stopTimer() {
  clearInterval(intervalId);
  state.status = 'IDLE';
  state.remaining = 0;
  state.totalDuration = 0;
  state.taskId = null;
  state.endTime = null;
  state.pausedRemaining = null;
  emitState();
}

function tick() {
  if (state.status !== 'RUNNING' && state.status !== 'BREAK') return;

  const now = Date.now();
  if (state.endTime) {
     state.remaining = Math.max(0, Math.ceil((state.endTime - now) / 1000));
  } else {
     // Fallback if endTime is not set (shouldn't happen in running state)
     state.remaining--;
  }

  if (state.remaining <= 0) {
    clearInterval(intervalId);

    if (state.currentType === 'FOCUS') {
      state.sessionCount++;
      // Inform main thread that a focus session completed so it can save to DB and trigger notifications
      state.status = 'BREAK';
      // In a real implementation, we'd look up the settings for short/long break duration here
      // For now, we just transition state and wait for Main to trigger the next phase
      state.remaining = 0;
      emitState();
    } else {
      // Break is over
      state.status = 'IDLE';
      emitState();
    }
  } else {
    emitState();
  }
}

function skipBreak() {
    if (state.status === 'BREAK') {
        state.status = 'IDLE';
        state.remaining = 0;
        emitState();
    }
}

parentPort.on('message', (msg) => {
  const { type, payload } = msg;

  switch (type) {
    case 'START':
      startTimer(payload.durationSeconds, payload.sessionType, payload.taskId);
      break;
    case 'PAUSE':
      pauseTimer();
      break;
    case 'RESUME':
      resumeTimer();
      break;
    case 'STOP':
      stopTimer();
      break;
    case 'SKIP_BREAK':
      skipBreak();
      break;
    case 'GET_STATE':
        emitState();
        break;
  }
});
