import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../stores/userStore';
import { useTaskStore } from '../stores/taskStore';
import { useGoalStore } from '../stores/goalStore';

const Dashboard: React.FC = () => {
  const { stats, loadUserStats } = useUserStore();
  const { tasks, loadTasks, getTodaysTasks, getPendingTasks } = useTaskStore();
  const { goals, loadGoals, getActiveGoals } = useGoalStore();

  useEffect(() => {
    loadUserStats();
    loadTasks();
    loadGoals();
  }, [loadUserStats, loadTasks, loadGoals]);

  const todaysTasks = getTodaysTasks();
  const pendingTasks = getPendingTasks();
  const completedTasks = tasks.filter(task => task.is_completed);
  const activeGoals = getActiveGoals();

  const completionRate = tasks.length > 0 
    ? Math.round((completedTasks.length / tasks.length) * 100) 
    : 0;

  const expPercentage = stats 
    ? Math.round((stats.current_exp / stats.exp_to_next_level) * 100)
    : 0;

  if (!stats) {
    return (
      <div className="dashboard-container">
        <div className="loading">ダッシュボードを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <motion.div 
        className="welcome-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="dashboard-header">
          <div>
            <h2>🌟 おかえりなさい、冒険者！</h2>
            <p>今日も一緒に成長していきましょう！</p>
          </div>
          <div className="level-display">
            <div className="level-number">Lv.{stats.current_level}</div>
            <div className="exp-info">
              <div className="exp-bar">
                <div 
                  className="exp-fill" 
                  style={{ width: `${expPercentage}%` }}
                ></div>
              </div>
              <span>{stats.current_exp}/{stats.exp_to_next_level} EXP</span>
            </div>
          </div>
        </div>
        
        <div className="status-grid">
          <motion.div 
            className="status-card"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <h3>今日のタスク</h3>
            <p className="big-number">{todaysTasks.length}</p>
            <small>完了待ち</small>
          </motion.div>
          
          <motion.div 
            className="status-card"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <h3>進行中の目標</h3>
            <p className="big-number">{activeGoals.length}</p>
            <small>設定済み目標</small>
          </motion.div>
          
          <motion.div 
            className="status-card"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <h3>完了率</h3>
            <p className="big-number">{completionRate}%</p>
            <small>全体の達成率</small>
          </motion.div>

          <motion.div 
            className="status-card"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <h3>総経験値</h3>
            <p className="big-number">{stats.total_exp}</p>
            <small>累計獲得EXP</small>
          </motion.div>
        </div>

        <div className="today-tasks">
          <h3>📅 今日のタスク</h3>
          {todaysTasks.length > 0 ? (
            <div className="task-preview-list">
              {todaysTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="task-preview">
                  <span className="task-title">{task.title}</span>
                  <span className="exp-badge">+{task.exp_reward} EXP</span>
                </div>
              ))}
              {todaysTasks.length > 3 && (
                <div className="task-preview">
                  <span className="task-more">...他 {todaysTasks.length - 3} 件</span>
                </div>
              )}
            </div>
          ) : (
            <p className="no-tasks">今日のタスクはありません。新しいタスクを追加しましょう！</p>
          )}
        </div>

        <div className="ai-status">
          <h3>🤖 AI機能</h3>
          <p>APIキーを設定するとAI支援機能が利用できます</p>
          <div className="ai-features">
            <div className="ai-feature-item">
              <span>📊 タスク経験値のAI評価</span>
              <span className="feature-status">要API設定</span>
            </div>
            <div className="ai-feature-item">
              <span>💡 タスク提案</span>
              <span className="feature-status">要API設定</span>
            </div>
            <div className="ai-feature-item">
              <span>📝 日記分析</span>
              <span className="feature-status">要API設定</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;