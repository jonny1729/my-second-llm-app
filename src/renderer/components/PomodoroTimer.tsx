import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../stores/userStore';
import { usePomodoroStore } from '../stores/pomodoroStore';

interface PomodoroTimerProps {
  // 必要に応じて props を追加
}

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const PomodoroTimer: React.FC<PomodoroTimerProps> = () => {
  const { addExperience } = useUserStore();
  
  // Zustand store from global state
  const {
    workTime, shortBreakTime, longBreakTime,
    mode, timeLeft, isRunning, sessions, autoStart, showPopup,
    setWorkTime, setShortBreakTime, setLongBreakTime,
    setMode, setTimeLeft, setIsRunning, setSessions, setAutoStart, setShowPopup,
    getTotalTime, formatTime, getModeText, resetTimer, toggleTimer, handleTimerComplete
  } = usePomodoroStore();
  
  const [showCompleteEffect, setShowCompleteEffect] = useState(false);
  
  // 効果音用のAudioContextとオーディオ参照
  const audioContextRef = useRef<AudioContext | null>(null);

  // 初期化時にタイマーをリセット
  useEffect(() => {
    resetTimer();
  }, [workTime, shortBreakTime, longBreakTime, resetTimer]);

  // タイマー完了イベントの監視（効果音・エフェクト・経験値付与用）
  const prevTimeLeftRef = useRef(timeLeft);
  useEffect(() => {
    // タイマーが0になった瞬間を検知
    if (prevTimeLeftRef.current > 0 && timeLeft === 0 && !isRunning) {
      handleTimerCompleteEffects();
    }
    prevTimeLeftRef.current = timeLeft;
  }, [timeLeft, isRunning]);

  const handleTimerCompleteEffects = async () => {
    // 効果音を再生
    await playCompletionSound();
    
    // 画面エフェクトを表示
    setShowCompleteEffect(true);
    setTimeout(() => setShowCompleteEffect(false), 3000);
    
    // 経験値を付与（作業セッション完了時のみ）
    if (mode === 'work') {
      const expGained = 20; // 25分作業で20EXP
      addExperience('pomodoro', null, expGained, 'ポモドーロセッション完了');
    }
  };

  // 効果音の生成・再生
  const playCompletionSound = async () => {
    try {
      // AudioContextを初期化
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const ctx = audioContextRef.current;
      
      // 完了音を生成（チャイム風の音）
      const createTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // エンベロープ（音の立ち上がり・立ち下がり）
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = ctx.currentTime;
      
      // チャイム音（3つの音程）
      createTone(523.25, now, 0.8);        // C5
      createTone(659.25, now + 0.3, 0.8);  // E5
      createTone(783.99, now + 0.6, 1.2);  // G5
      
    } catch (error) {
      console.error('効果音の再生に失敗しました:', error);
    }
  };


  // 進捗の計算

  const progress = ((getTotalTime() - timeLeft) / getTotalTime()) * 100;

  // モードごとの表示テキストと色
  const getModeConfig = () => {
    switch (mode) {
      case 'work':
        return {
          title: '🍅 作業時間',
          color: '#1976d2',
          bgColor: 'rgba(33, 150, 243, 0.1)',
          progressColor: '#2196f3',
        };
      case 'shortBreak':
        return {
          title: '☕ 短い休憩',
          color: '#0288d1',
          bgColor: 'rgba(3, 169, 244, 0.1)',
          progressColor: '#03a9f4',
        };
      case 'longBreak':
        return {
          title: '🛋️ 長い休憩',
          color: '#0277bd',
          bgColor: 'rgba(2, 136, 209, 0.1)',
          progressColor: '#0288d1',
        };
      default:
        return {
          title: '🍅 作業時間',
          color: '#1976d2',
          bgColor: 'rgba(33, 150, 243, 0.1)',
          progressColor: '#2196f3',
        };
    }
  };

  const modeConfig = getModeConfig();

  return (
    <div className="pomodoro-timer">
      <motion.div
        className="timer-container"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        style={{ backgroundColor: modeConfig.bgColor }}
      >
        <div className="timer-header">
          <h2>{modeConfig.title}</h2>
          <div className="session-count">
            セッション: {sessions} 🍅
          </div>
        </div>

        <div className="timer-display">
          <motion.div
            className="time-circle"
            style={{ 
              borderColor: modeConfig.progressColor,
              background: `conic-gradient(${modeConfig.progressColor} ${progress}%, #e3f2fd ${progress}%)`
            }}
          >
            <div className="time-text" style={{ color: modeConfig.color }}>
              {formatTime(timeLeft)}
            </div>
          </motion.div>
        </div>

        <div className="timer-controls">
          <motion.button
            className={`timer-btn ${isRunning ? 'pause' : 'play'}`}
            onClick={toggleTimer}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ backgroundColor: modeConfig.color }}
          >
            {isRunning ? '⏸️ 停止' : '▶️ 開始'}
          </motion.button>

          <motion.button
            className="timer-btn reset"
            onClick={resetTimer}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔄 リセット
          </motion.button>
        </div>

        <div className="timer-settings">
          <div className="settings-header">
            <h3 className="settings-title">⚙️ 設定</h3>
            <div className="auto-start-toggle">
              <span style={{ color: '#1565c0', fontWeight: '600' }}>自動スタート</span>
              <div 
                className={`toggle-switch ${autoStart ? 'active' : ''}`}
                onClick={() => setAutoStart(!autoStart)}
              >
                <div className="toggle-slider"></div>
              </div>
            </div>
          </div>

          <div className="time-settings">
            <div className="setting-group">
              <label>🍅 作業時間 (分)</label>
              <input
                type="number"
                value={workTime}
                onChange={(e) => setWorkTime(Number(e.target.value))}
                min="1"
                max="60"
                disabled={isRunning}
              />
            </div>

            <div className="setting-group">
              <label>☕ 短い休憩 (分)</label>
              <input
                type="number"
                value={shortBreakTime}
                onChange={(e) => setShortBreakTime(Number(e.target.value))}
                min="1"
                max="30"
                disabled={isRunning}
              />
            </div>

            <div className="setting-group">
              <label>🛋️ 長い休憩 (分)</label>
              <input
                type="number"
                value={longBreakTime}
                onChange={(e) => setLongBreakTime(Number(e.target.value))}
                min="1"
                max="60"
                disabled={isRunning}
              />
            </div>
          </div>

          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <motion.button
              className="timer-btn"
              onClick={() => setShowPopup(!showPopup)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ 
                background: showPopup ? 'linear-gradient(135deg, #1976d2, #1565c0)' : 'linear-gradient(135deg, #90a4ae, #607d8b)',
                minWidth: '160px'
              }}
            >
              {showPopup ? '📌 ポップアップ表示中' : '📱 ポップアップ表示'}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 完了エフェクト */}
      <AnimatePresence>
        {showCompleteEffect && (
          <motion.div
            className="completion-effect"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.5 }}
          >
            <div className="effect-content">
              <motion.div
                className="effect-emoji"
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {mode === 'work' ? '🎉' : '✨'}
              </motion.div>
              <div className="effect-text">
                {mode === 'work' ? 'セッション完了！' : '休憩終了！'}
              </div>
              {mode === 'work' && (
                <div className="effect-exp">
                  +20 EXP 獲得！
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PomodoroTimer;