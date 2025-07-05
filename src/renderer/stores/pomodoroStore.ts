import { create } from 'zustand';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroState {
  // タイマー設定
  workTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  
  // タイマー状態
  mode: TimerMode;
  timeLeft: number;
  isRunning: boolean;
  sessions: number;
  autoStart: boolean;
  showPopup: boolean;
  
  // アクション
  setWorkTime: (time: number) => void;
  setShortBreakTime: (time: number) => void;
  setLongBreakTime: (time: number) => void;
  setMode: (mode: TimerMode) => void;
  setTimeLeft: (time: number | ((prev: number) => number)) => void;
  setIsRunning: (running: boolean) => void;
  setSessions: (sessions: number | ((prev: number) => number)) => void;
  setAutoStart: (autoStart: boolean) => void;
  setShowPopup: (show: boolean) => void;
  
  // ヘルパー関数
  getTotalTime: () => number;
  formatTime: (seconds: number) => string;
  getModeText: () => string;
  resetTimer: () => void;
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  // 初期設定
  workTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  
  // 初期状態
  mode: 'work',
  timeLeft: 25 * 60,
  isRunning: false,
  sessions: 0,
  autoStart: false,
  showPopup: false,
  
  // セッター
  setWorkTime: (time) => {
    set({ workTime: time });
    const { mode } = get();
    if (mode === 'work') {
      set({ timeLeft: time * 60 });
    }
  },
  
  setShortBreakTime: (time) => {
    set({ shortBreakTime: time });
    const { mode } = get();
    if (mode === 'shortBreak') {
      set({ timeLeft: time * 60 });
    }
  },
  
  setLongBreakTime: (time) => {
    set({ longBreakTime: time });
    const { mode } = get();
    if (mode === 'longBreak') {
      set({ timeLeft: time * 60 });
    }
  },
  
  setMode: (mode) => set({ mode }),
  setTimeLeft: (time) => set((state) => ({ 
    timeLeft: typeof time === 'function' ? time(state.timeLeft) : time 
  })),
  setIsRunning: (running) => set({ isRunning: running }),
  setSessions: (sessions) => set((state) => ({ 
    sessions: typeof sessions === 'function' ? sessions(state.sessions) : sessions 
  })),
  setAutoStart: (autoStart) => set({ autoStart }),
  setShowPopup: (show) => set({ showPopup: show }),
  
  // ヘルパー関数
  getTotalTime: () => {
    const { mode, workTime, shortBreakTime, longBreakTime } = get();
    switch (mode) {
      case 'work': return workTime * 60;
      case 'shortBreak': return shortBreakTime * 60;
      case 'longBreak': return longBreakTime * 60;
      default: return workTime * 60;
    }
  },
  
  formatTime: (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },
  
  getModeText: () => {
    const { mode } = get();
    switch (mode) {
      case 'work': return '🍅 作業中';
      case 'shortBreak': return '☕ 短い休憩';
      case 'longBreak': return '🛋️ 長い休憩';
      default: return '🍅 作業中';
    }
  },
  
  resetTimer: () => {
    const { workTime } = get();
    set({
      mode: 'work',
      timeLeft: workTime * 60,
      isRunning: false
    });
  }
}));