import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PomodoroPopupProps {
  isVisible: boolean;
  timeLeft: number;
  mode: 'work' | 'shortBreak' | 'longBreak';
  isRunning: boolean;
  sessions: number;
  onToggle: () => void;
  onReset: () => void;
  onClose: () => void;
}

const PomodoroPopup: React.FC<PomodoroPopupProps> = ({
  isVisible,
  timeLeft,
  mode,
  isRunning,
  sessions,
  onToggle,
  onReset,
  onClose
}) => {
  // Use global store for consistency
  const { formatTime, getModeText } = usePomodoroStore();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="timer-popup"
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="popup-header">
            <span className="popup-title">ポモドーロタイマー</span>
            <button className="popup-close" onClick={onClose}>
              ×
            </button>
          </div>

          <div className="popup-time">
            {formatTime(timeLeft)}
          </div>

          <div className="popup-mode">
            {getModeText()} • セッション: {sessions}
          </div>

          <div className="popup-controls">
            <button
              className={`popup-btn ${isRunning ? 'pause' : 'play'}`}
              onClick={onToggle}
            >
              {isRunning ? '⏸️' : '▶️'}
            </button>
            <button
              className="popup-btn reset"
              onClick={onReset}
            >
              🔄
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PomodoroPopup;