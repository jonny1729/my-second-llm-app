import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import GoalManager from './components/GoalManager';
import Calendar from './components/Calendar';
import Diary from './components/Diary';
import Settings from './components/Settings';
import LevelUpModal from './components/LevelUpModal';
import UpdateNotification, { UpdateInfo, UpdateProgress } from './components/UpdateNotification';
import { useUserStore } from './stores/userStore';

type ActivePage = 'dashboard' | 'tasks' | 'goals' | 'calendar' | 'diary' | 'stats' | 'settings';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const { stats, loadUserStats, showLevelUpModal, newLevel, closeLevelUpModal } = useUserStore();
  
  // アップデート関連のstate
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<UpdateProgress | null>(null);

  useEffect(() => {
    loadUserStats();
    
    // アップデート関連のイベントリスナーを設定
    setupUpdateEventListeners();
    
    return () => {
      // クリーンアップ
      removeUpdateEventListeners();
    };
  }, [loadUserStats]);

  const setupUpdateEventListeners = () => {
    if (window.electronAPI) {
      // アップデート利用可能
      window.electronAPI.on('update-available', (updateInfo: UpdateInfo) => {
        setUpdateInfo(updateInfo);
        setShowUpdateNotification(true);
      });

      // ダウンロード進捗
      window.electronAPI.on('update-download-progress', (progress: UpdateProgress) => {
        setDownloadProgress(progress);
      });

      // ダウンロード完了
      window.electronAPI.on('update-downloaded', () => {
        setIsDownloading(false);
        setDownloadProgress(null);
      });

      // エラー
      window.electronAPI.on('update-error', (error: string) => {
        setIsDownloading(false);
        setDownloadProgress(null);
        alert(`アップデートエラー: ${error}`);
      });

      // アップデート利用不可
      window.electronAPI.on('update-not-available', () => {
        console.log('No updates available');
      });

      // 通知クリック
      window.electronAPI.on('update-notification-clicked', (updateInfo: UpdateInfo) => {
        setUpdateInfo(updateInfo);
        setShowUpdateNotification(true);
      });
    }
  };

  const removeUpdateEventListeners = () => {
    if (window.electronAPI) {
      window.electronAPI.removeAllListeners('update-available');
      window.electronAPI.removeAllListeners('update-download-progress');
      window.electronAPI.removeAllListeners('update-downloaded');
      window.electronAPI.removeAllListeners('update-error');
      window.electronAPI.removeAllListeners('update-not-available');
      window.electronAPI.removeAllListeners('update-notification-clicked');
    }
  };

  // アップデート関連のハンドラー
  const handleInstallNow = async () => {
    try {
      setIsDownloading(true);
      await window.electronAPI.invoke('download-and-install-update');
    } catch (error) {
      console.error('Update install failed:', error);
      setIsDownloading(false);
      alert('アップデートのインストールに失敗しました');
    }
  };

  const handleInstallLater = () => {
    setShowUpdateNotification(false);
    // 後で通知する設定を保存（必要に応じて）
  };

  const handleCloseUpdateNotification = () => {
    setShowUpdateNotification(false);
  };

  const handleOpenUpdateSettings = () => {
    setActivePage('settings');
    setShowUpdateNotification(false);
    // 設定画面でアップデートタブを開く（必要に応じて）
  };

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <TaskList />;
      case 'goals':
        return <GoalManager />;
      case 'calendar':
        return <Calendar />;
      case 'diary':
        return <Diary />;
      case 'stats':
        return <div className="coming-soon">📊 統計機能は開発中です</div>;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  const expPercentage = stats 
    ? Math.round((stats.current_exp / stats.exp_to_next_level) * 100)
    : 0;

  return (
    <div className="app">
      <motion.div 
        className="header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>🎮 RPG秘書 - Personal Assistant</h1>
        <div className="level-info">
          <span>レベル: {stats?.current_level || 1}</span>
          <div className="exp-bar">
            <div className="exp-fill" style={{ width: `${expPercentage}%` }}></div>
          </div>
          <span>EXP: {stats?.current_exp || 0}/{stats?.exp_to_next_level || 100}</span>
        </div>
      </motion.div>

      <div className="main-content">
        <div className="sidebar">
          <nav>
            <ul>
              <li 
                className={activePage === 'dashboard' ? 'active' : ''}
                onClick={() => setActivePage('dashboard')}
              >
                📅 ダッシュボード
              </li>
              <li 
                className={activePage === 'tasks' ? 'active' : ''}
                onClick={() => setActivePage('tasks')}
              >
                ✅ タスク管理
              </li>
              <li 
                className={activePage === 'goals' ? 'active' : ''}
                onClick={() => setActivePage('goals')}
              >
                🎯 目標設定
              </li>
              <li 
                className={activePage === 'calendar' ? 'active' : ''}
                onClick={() => setActivePage('calendar')}
              >
                📅 カレンダー
              </li>
              <li 
                className={activePage === 'diary' ? 'active' : ''}
                onClick={() => setActivePage('diary')}
              >
                📝 日記
              </li>
              <li 
                className={activePage === 'stats' ? 'active' : ''}
                onClick={() => setActivePage('stats')}
              >
                📊 統計
              </li>
              <li 
                className={activePage === 'settings' ? 'active' : ''}
                onClick={() => setActivePage('settings')}
              >
                ⚙️ 設定
              </li>
            </ul>
          </nav>
        </div>

        <div className="content">
          {renderContent()}
        </div>
      </div>

      {/* レベルアップモーダル */}
      <LevelUpModal
        isVisible={showLevelUpModal}
        newLevel={newLevel}
        onClose={closeLevelUpModal}
      />

      {/* アップデート通知 */}
      <UpdateNotification
        isVisible={showUpdateNotification}
        updateInfo={updateInfo}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
        onInstallNow={handleInstallNow}
        onInstallLater={handleInstallLater}
        onClose={handleCloseUpdateNotification}
        onOpenSettings={handleOpenUpdateSettings}
      />
    </div>
  );
};

export default App;