import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface UpdateInfo {
  version: string;
  releaseNotes: string;
  releaseDate: string;
  downloadSize: number;
  hasUpdate: boolean;
}

export interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  total: number;
  transferred: number;
}

interface UpdateNotificationProps {
  isVisible: boolean;
  updateInfo: UpdateInfo | null;
  isDownloading: boolean;
  downloadProgress: number | UpdateProgress | null;
  onInstallNow: () => void;
  onInstallLater: () => void;
  onClose: () => void;
  onOpenSettings: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  isVisible,
  updateInfo,
  isDownloading,
  downloadProgress,
  onInstallNow,
  onInstallLater,
  onClose,
  onOpenSettings
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return formatFileSize(bytesPerSecond) + '/s';
  };

  const formatReleaseNotes = (notes: string): string[] => {
    // Parse release notes and extract features/improvements
    const lines = notes.split('\n').filter(line => line.trim().length > 0);
    const features: string[] = [];
    const improvements: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        const content = trimmed.substring(1).trim();
        if (content.toLowerCase().includes('新機能') || content.toLowerCase().includes('feature')) {
          features.push(content);
        } else if (content.toLowerCase().includes('改善') || content.toLowerCase().includes('improvement')) {
          improvements.push(content);
        } else {
          features.push(content);
        }
      }
    }
    
    return [...features, ...improvements];
  };

  if (!updateInfo) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="update-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="update-modal"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="update-header">
              <div className="update-icon">🎉</div>
              <h2 className="update-title">新しいアップデートが利用可能です！</h2>
              <button 
                className="update-close-btn"
                onClick={onClose}
                aria-label="閉じる"
              >
                ×
              </button>
            </div>

            {/* Version Info */}
            <div className="update-version-info">
              <div className="version-badge">
                <span className="version-label">バージョン:</span>
                <span className="version-number">
                  v{updateInfo.version}
                </span>
              </div>
              <div className="update-size">
                📦 サイズ: {formatFileSize(updateInfo.downloadSize)}
              </div>
            </div>

            {/* Download Progress */}
            {isDownloading && downloadProgress !== null && (
              <motion.div
                className="download-progress-section"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="progress-header">
                  <span>🔄 アップデート中...</span>
                  <span className="progress-percentage">
                    {typeof downloadProgress === 'number' ? downloadProgress : Math.round(downloadProgress.percent)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: '0%' }}
                    animate={{ width: `${typeof downloadProgress === 'number' ? downloadProgress : downloadProgress.percent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                {typeof downloadProgress === 'object' && (
                  <div className="progress-details">
                    <span>⏱️ 速度: {formatSpeed(downloadProgress.bytesPerSecond)}</span>
                    <span>
                      📊 {formatFileSize(downloadProgress.transferred)} / {formatFileSize(downloadProgress.total)}
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Release Notes */}
            {!isDownloading && (
              <div className="update-content">
                <div className="features-section">
                  <h3>✨ 新機能・改善:</h3>
                  <ul className="features-list">
                    {formatReleaseNotes(updateInfo.releaseNotes).slice(0, showDetails ? undefined : 3).map((feature, index) => (
                      <li key={index} className="feature-item">
                        <span className="feature-bullet">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {formatReleaseNotes(updateInfo.releaseNotes).length > 3 && (
                    <button
                      className="show-more-btn"
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      {showDetails ? '表示を減らす' : `他 ${formatReleaseNotes(updateInfo.releaseNotes).length - 3} 項目を表示`}
                    </button>
                  )}
                </div>

                <div className="update-info">
                  <div className="info-item">
                    <span className="info-label">⏱️ 予想時間:</span>
                    <span>2-3分</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">📅 リリース日:</span>
                    <span>{new Date(updateInfo.releaseDate).toLocaleDateString('ja-JP')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Status Messages */}
            {isDownloading && (
              <div className="status-section">
                <div className="status-steps">
                  <div className="status-step completed">
                    <span className="step-icon">✅</span>
                    <span>バックアップ作成済み</span>
                  </div>
                  <div className="status-step active">
                    <span className="step-icon">⏳</span>
                    <span>新バージョンダウンロード中...</span>
                  </div>
                  <div className="status-step pending">
                    <span className="step-icon">⏳</span>
                    <span>インストール準備中</span>
                  </div>
                  <div className="status-step pending">
                    <span className="step-icon">⏳</span>
                    <span>アプリ再起動</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!isDownloading && (
              <div className="update-actions">
                <button 
                  className="btn btn-primary btn-install"
                  onClick={onInstallNow}
                >
                  <span className="btn-icon">🚀</span>
                  今すぐアップデート
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={onInstallLater}
                >
                  後で通知
                </button>
                <button 
                  className="btn btn-ghost"
                  onClick={onOpenSettings}
                >
                  <span className="btn-icon">⚙️</span>
                  設定
                </button>
              </div>
            )}

            {/* Cancel Button during download */}
            {isDownloading && (
              <div className="update-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  バックグラウンドで実行
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateNotification;