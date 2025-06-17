import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LevelUpModalProps {
  isVisible: boolean;
  newLevel: number;
  onClose: () => void;
}

const LevelUpModal: React.FC<LevelUpModalProps> = ({ isVisible, newLevel, onClose }) => {
  const particles = Array.from({ length: 20 }, (_, i) => i);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="level-up-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* パーティクルエフェクト */}
          {particles.map((particle) => (
            <motion.div
              key={particle}
              className="particle"
              initial={{
                opacity: 0,
                scale: 0,
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: window.innerWidth / 2 + (Math.random() - 0.5) * 400,
                y: window.innerHeight / 2 + (Math.random() - 0.5) * 400,
              }}
              transition={{
                duration: 2,
                delay: particle * 0.1,
                ease: "easeOut"
              }}
            />
          ))}

          {/* メインモーダル */}
          <motion.div
            className="level-up-modal"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ 
              type: "spring", 
              stiffness: 260, 
              damping: 20,
              delay: 0.3
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 光のエフェクト */}
            <motion.div
              className="light-burst"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 3, opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, delay: 0.2 }}
            />

            {/* レベルアップテキスト */}
            <motion.div
              className="level-up-content"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <motion.h1
                className="level-up-title"
                animate={{ 
                  scale: [1, 1.2, 1],
                  textShadow: [
                    "0 0 10px #ffd700",
                    "0 0 20px #ffd700, 0 0 30px #ffd700",
                    "0 0 10px #ffd700"
                  ]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              >
                🎉 LEVEL UP! 🎉
              </motion.h1>

              <motion.div
                className="new-level"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
              >
                <span className="level-text">Level</span>
                <motion.span
                  className="level-number"
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.3, 1]
                  }}
                  transition={{
                    duration: 1,
                    delay: 1.5
                  }}
                >
                  {newLevel}
                </motion.span>
              </motion.div>

              <motion.p
                className="congratulations"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
              >
                おめでとうございます！新たな力を手に入れました！
              </motion.p>

              <motion.button
                className="close-button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.5 }}
                onClick={onClose}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                続ける
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LevelUpModal;