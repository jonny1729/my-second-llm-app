import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import GoalManager from './components/GoalManager';
import Calendar from './components/Calendar';
import LevelUpModal from './components/LevelUpModal';
import { useUserStore } from './stores/userStore';

type ActivePage = 'dashboard' | 'tasks' | 'goals' | 'calendar' | 'diary' | 'stats' | 'settings';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const { stats, loadUserStats, showLevelUpModal, newLevel, closeLevelUpModal } = useUserStore();

  useEffect(() => {
    loadUserStats();
  }, [loadUserStats]);

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
        return <div className="coming-soon">📝 日記機能は開発中です</div>;
      case 'stats':
        return <div className="coming-soon">📊 統計機能は開発中です</div>;
      case 'settings':
        return <div className="coming-soon">⚙️ 設定機能は開発中です</div>;
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
    </div>
  );
};

export default App;