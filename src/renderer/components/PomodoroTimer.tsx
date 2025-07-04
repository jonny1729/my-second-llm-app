import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserStore } from '../stores/userStore';

interface PomodoroTimerProps {
  // 必要に応じて props を追加
}

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const PomodoroTimer: React.FC<PomodoroTimerProps> = () => {
  const { addExperience } = useUserStore();
  
  // タイマー設定 (分単位)
  const [workTime, setWorkTime] = useState(25);
  const [shortBreakTime, setShortBreakTime] = useState(5);
  const [longBreakTime, setLongBreakTime] = useState(15);
  
  // タイマー状態
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(workTime * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [showCompleteEffect, setShowCompleteEffect] = useState(false);
  
  // 効果音用のAudioContextとオーディオ参照
  const audioContextRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 初期化時にタイマーをリセット
  useEffect(() => {
    resetTimer();
  }, [workTime, shortBreakTime, longBreakTime]);

  // タイマーの実行
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // タイマー完了時の処理
  const handleTimerComplete = async () => {
    setIsRunning(false);
    
    // 効果音を再生
    await playCompletionSound();
    
    // 画面エフェクトを表示
    setShowCompleteEffect(true);
    setTimeout(() => setShowCompleteEffect(false), 3000);
    
    // 経験値を付与（作業セッション完了時のみ）
    if (mode === 'work') {
      const expGained = 20; // 25分作業で20EXP
      addExperience('pomodoro', null, expGained, 'ポモドーロセッション完了');
      setSessions(prev => prev + 1);
    }
    
    // 次のモードに切り替え
    switchToNextMode();
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

  // 次のモードに切り替え
  const switchToNextMode = () => {
    if (mode === 'work') {
      // 4セッション毎に長い休憩
      if ((sessions + 1) % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(longBreakTime * 60);
      } else {
        setMode('shortBreak');
        setTimeLeft(shortBreakTime * 60);
      }
    } else {
      setMode('work');
      setTimeLeft(workTime * 60);
    }
  };

  // タイマーをリセット
  const resetTimer = () => {
    setIsRunning(false);
    setMode('work');
    setTimeLeft(workTime * 60);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  // 開始/停止の切り替え
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // 時間を分:秒の形式でフォーマット
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 進捗の計算
  const getTotalTime = () => {
    switch (mode) {
      case 'work': return workTime * 60;
      case 'shortBreak': return shortBreakTime * 60;
      case 'longBreak': return longBreakTime * 60;
      default: return workTime * 60;
    }
  };

  const progress = ((getTotalTime() - timeLeft) / getTotalTime()) * 100;

  // モードごとの表示テキストと色
  const getModeConfig = () => {
    switch (mode) {
      case 'work':
        return {
          title: '🍅 作業時間',
          color: '#e74c3c',
          bgColor: 'rgba(231, 76, 60, 0.1)',
        };
      case 'shortBreak':
        return {
          title: '☕ 短い休憩',
          color: '#27ae60',
          bgColor: 'rgba(39, 174, 96, 0.1)',
        };
      case 'longBreak':
        return {
          title: '🛋️ 長い休憩',
          color: '#3498db',
          bgColor: 'rgba(52, 152, 219, 0.1)',
        };
      default:
        return {
          title: '🍅 作業時間',
          color: '#e74c3c',
          bgColor: 'rgba(231, 76, 60, 0.1)',
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
              borderColor: modeConfig.color,
              background: `conic-gradient(${modeConfig.color} ${progress}%, transparent ${progress}%)`
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
          <div className="setting-group">
            <label>作業時間 (分):</label>
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
            <label>短い休憩 (分):</label>
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
            <label>長い休憩 (分):</label>
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