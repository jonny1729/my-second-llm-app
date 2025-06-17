import React from 'react';
import { motion } from 'framer-motion';
import { useApiStore } from '../stores/apiStore';

interface AIPlaceholderProps {
  feature: string;
  description: string;
  icon: string;
  className?: string;
  onConfigureClick?: () => void;
}

const AIPlaceholder: React.FC<AIPlaceholderProps> = ({ 
  feature, 
  description, 
  icon, 
  className = '',
  onConfigureClick 
}) => {
  const { hasAnyActiveApi } = useApiStore();
  const isConfigured = hasAnyActiveApi();

  if (isConfigured) {
    return null; // API設定済みの場合は表示しない
  }

  return (
    <motion.div
      className={`ai-placeholder ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="ai-placeholder-content">
        <div className="ai-placeholder-icon">{icon}</div>
        <h4 className="ai-placeholder-title">{feature}</h4>
        <p className="ai-placeholder-description">{description}</p>
        <button 
          className="ai-configure-button"
          onClick={onConfigureClick}
        >
          APIキーを設定して利用開始
        </button>
      </div>
    </motion.div>
  );
};

export default AIPlaceholder;