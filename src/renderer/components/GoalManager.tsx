import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoalStore } from '../stores/goalStore';
import { format, differenceInDays, parseISO } from 'date-fns';

const GoalManager: React.FC = () => {
  const { 
    goals, 
    isLoading, 
    loadGoals, 
    addGoal, 
    getActiveGoals, 
    getShortTermGoals, 
    getLongTermGoals,
    getOverdueGoals 
  } = useGoalStore();

  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'short' | 'long' | 'overdue'>('all');
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    target_date: '',
    priority: 2
  });

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const handleAddGoal = async () => {
    if (!newGoal.title.trim()) return;

    await addGoal({
      title: newGoal.title,
      description: newGoal.description,
      target_date: newGoal.target_date || undefined,
      priority: newGoal.priority
    });

    setNewGoal({ title: '', description: '', target_date: '', priority: 2 });
    setIsAddingGoal(false);
  };

  const getDisplayGoals = () => {
    switch (activeTab) {
      case 'short': return getShortTermGoals();
      case 'long': return getLongTermGoals();
      case 'overdue': return getOverdueGoals();
      default: return getActiveGoals();
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return '#e53e3e';
      case 2: return '#dd6b20';
      case 1: return '#38a169';
      default: return '#718096';
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 3: return '高';
      case 2: return '中';
      case 1: return '低';
      default: return '';
    }
  };

  const getDaysRemaining = (targetDate: string) => {
    const days = differenceInDays(parseISO(targetDate), new Date());
    if (days < 0) return `${Math.abs(days)}日遅れ`;
    if (days === 0) return '今日まで';
    return `あと${days}日`;
  };

  const displayGoals = getDisplayGoals();

  if (isLoading) {
    return (
      <div className="goal-manager-container">
        <div className="loading">目標を読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="goal-manager-container">
      <div className="goal-header">
        <h2>🎯 目標設定</h2>
        <button 
          className="btn-primary"
          onClick={() => setIsAddingGoal(!isAddingGoal)}
        >
          {isAddingGoal ? 'キャンセル' : '+ 目標追加'}
        </button>
      </div>

      <AnimatePresence>
        {isAddingGoal && (
          <motion.div 
            className="add-goal-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <input
              type="text"
              placeholder="目標のタイトル"
              value={newGoal.title}
              onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              className="goal-input"
            />
            <textarea
              placeholder="詳細説明（任意）"
              value={newGoal.description}
              onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
              className="goal-textarea"
            />
            <div className="goal-form-row">
              <div className="form-group">
                <label>目標期限:</label>
                <input
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                  className="goal-input-small"
                />
              </div>
              <div className="form-group">
                <label>優先度:</label>
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({ ...newGoal, priority: Number(e.target.value) })}
                  className="goal-select"
                >
                  <option value={1}>低</option>
                  <option value={2}>中</option>
                  <option value={3}>高</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button onClick={handleAddGoal} className="btn-primary">
                目標追加
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* タブメニュー */}
      <div className="goal-tabs">
        <button 
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          すべて ({getActiveGoals().length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'short' ? 'active' : ''}`}
          onClick={() => setActiveTab('short')}
        >
          短期 ({getShortTermGoals().length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'long' ? 'active' : ''}`}
          onClick={() => setActiveTab('long')}
        >
          長期 ({getLongTermGoals().length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'overdue' ? 'active' : ''}`}
          onClick={() => setActiveTab('overdue')}
        >
          期限切れ ({getOverdueGoals().length})
        </button>
      </div>

      {/* 目標リスト */}
      <div className="goal-list">
        <AnimatePresence>
          {displayGoals.map((goal) => (
            <motion.div
              key={goal.id}
              className="goal-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              layout
            >
              <div className="goal-content">
                <div className="goal-header-item">
                  <h4>{goal.title}</h4>
                  <div className="goal-meta">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(goal.priority) }}
                    >
                      {getPriorityText(goal.priority)}
                    </span>
                    {goal.target_date && (
                      <span className={`deadline-badge ${
                        differenceInDays(parseISO(goal.target_date), new Date()) < 0 ? 'overdue' : 
                        differenceInDays(parseISO(goal.target_date), new Date()) <= 7 ? 'urgent' : 'normal'
                      }`}>
                        {getDaysRemaining(goal.target_date)}
                      </span>
                    )}
                  </div>
                </div>
                {goal.description && (
                  <p className="goal-description">{goal.description}</p>
                )}
                {goal.target_date && (
                  <p className="goal-date">
                    期限: {format(parseISO(goal.target_date), 'yyyy年M月d日')}
                  </p>
                )}
              </div>
              <div className="goal-actions">
                <button
                  className="btn-complete"
                  onClick={() => console.log('目標完了機能は実装予定')}
                >
                  ✓ 達成
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {displayGoals.length === 0 && (
          <div className="empty-state">
            <p>📋 {activeTab === 'all' ? '目標がありません' : 
                    activeTab === 'short' ? '短期目標がありません' :
                    activeTab === 'long' ? '長期目標がありません' :
                    '期限切れの目標はありません'}
            </p>
            <p>新しい目標を設定して、成長の道筋を作りましょう！</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalManager;