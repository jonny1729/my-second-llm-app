import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExpGainAnimationProps {
  isVisible: boolean;
  expAmount: number;
  position: { x: number; y: number };
  onComplete: () => void;
}

const ExpGainAnimation: React.FC<ExpGainAnimationProps> = ({ 
  isVisible, 
  expAmount, 
  position, 
  onComplete 
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="exp-gain-animation"
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            pointerEvents: 'none',
            zIndex: 1000,
          }}
          initial={{ 
            opacity: 0,
            y: 0,
            scale: 0.5
          }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            y: -100,
            scale: [0.5, 1.2, 1, 0.8],
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 2,
            ease: "easeOut"
          }}
          onAnimationComplete={onComplete}
        >
          <motion.div
            className="exp-text"
            animate={{
              textShadow: [
                "0 0 5px #48bb78",
                "0 0 15px #48bb78, 0 0 25px #48bb78",
                "0 0 5px #48bb78"
              ]
            }}
            transition={{
              duration: 1,
              repeat: 1,
              repeatType: "reverse"
            }}
          >
            +{expAmount} EXP
          </motion.div>
          
          {/* 輝きエフェクト */}
          <motion.div
            className="exp-sparkle"
            initial={{ scale: 0, rotate: 0 }}
            animate={{ 
              scale: [0, 1, 0], 
              rotate: 360,
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 1.5,
              delay: 0.2
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExpGainAnimation;