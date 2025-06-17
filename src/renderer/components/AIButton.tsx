import React from 'react';
import { motion } from 'framer-motion';
import { useApiStore } from '../stores/apiStore';

interface AIButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  placeholderText?: string;
}

const AIButton: React.FC<AIButtonProps> = ({ 
  onClick, 
  children, 
  disabled = false, 
  className = '',
  placeholderText = 'APIキーを設定してください'
}) => {
  const { hasAnyActiveApi } = useApiStore();
  const isApiConfigured = hasAnyActiveApi();

  if (!isApiConfigured) {
    return (
      <motion.button
        className={`ai-button-disabled ${className}`}
        whileHover={{ scale: 1.02 }}
        disabled
        title={placeholderText}
      >
        🔒 {children}
      </motion.button>
    );
  }

  return (
    <motion.button
      className={`ai-button-enabled ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      🤖 {children}
    </motion.button>
  );
};

export default AIButton;