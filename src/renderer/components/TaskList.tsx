import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '../stores/taskStore';
import ExpGainAnimation from './ExpGainAnimation';
import AIButton from './AIButton';
import AIPlaceholder from './AIPlaceholder';

const TaskList: React.FC = () => {
  const { tasks, isLoading, loadTasks, addTask, completeTaskById, getPendingTasks } = useTaskStore();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 2,
    exp_reward: 10
  });
  const [expAnimation, setExpAnimation] = useState({
    isVisible: false,
    expAmount: 0,
    position: { x: 0, y: 0 }
  });
  const [celebrationMessage, setCelebrationMessage] = useState({
    isVisible: false,
    message: '',
    position: { x: 0, y: 0 }
  });

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return;

    await addTask({
      title: newTask.title,
      description: newTask.description,
      priority: newTask.priority,
      exp_reward: newTask.exp_reward
    });

    setNewTask({ title: '', description: '', priority: 2, exp_reward: 10 });
    setIsAddingTask(false);
  };

  const handleAIExpEvaluation = () => {
    console.log('AI経験値評価機能は実装予定です');
    alert('APIキーを設定すると、AIがタスクの適切な経験値を提案してくれます！');
  };

  const handleAITaskSuggestion = () => {
    console.log('AIタスク提案機能は実装予定です');
    alert('APIキーを設定すると、AIがあなたの目標に基づいてタスクを提案してくれます！');
  };

  // v1.2.5新機能: 強化された祝福メッセージ
  const celebrationMessages = [
    '🎉 素晴らしい！',
    '✨ よくやった！',
    '🌟 完璧だ！',
    '🎊 お疲れ様！',
    '💫 最高！',
    '🔥 やったね！',
    '⚡ 素晴らしい成果！',
    '🎯 ターゲット達成！',
    '🚀 順調に進んでいる！',
    '💪 頑張った！'
  ];

  const getCelebrationMessage = (completedCount: number) => {
    if (completedCount > 0 && completedCount % 5 === 0) {
      return `🏆 ${completedCount}個のタスクを達成！すごい！`;
    }
    return celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)];
  };

  const handleCompleteTask = async (taskId: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // クリック位置を取得
    const rect = event.currentTarget.getBoundingClientRect();
    const position = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    // 経験値アニメーション開始
    setExpAnimation({
      isVisible: true,
      expAmount: task.exp_reward,
      position
    });

    // v1.2.5新機能: 祝福メッセージ表示
    const completedTasks = tasks.filter(t => t.is_completed).length + 1;
    const celebrationPos = {
      x: position.x + 50,
      y: position.y - 30
    };
    
    setCelebrationMessage({
      isVisible: true,
      message: getCelebrationMessage(completedTasks),
      position: celebrationPos
    });

    // 3秒後に祝福メッセージを非表示
    setTimeout(() => {
      setCelebrationMessage(prev => ({ ...prev, isVisible: false }));
    }, 3000);

    // タスク完了処理
    await completeTaskById(taskId);
  };

  const pendingTasks = getPendingTasks();

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return '#e53e3e'; // 高
      case 2: return '#dd6b20'; // 中
      case 1: return '#38a169'; // 低
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

  if (isLoading) {
    return (
      <div className="task-list-container">
        <div className="loading">タスクを読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <h2>📝 タスク管理</h2>
        <button 
          className="btn-primary"
          onClick={() => setIsAddingTask(!isAddingTask)}
        >
          {isAddingTask ? 'キャンセル' : '+ タスク追加'}
        </button>
      </div>

      <AnimatePresence>
        {isAddingTask && (
          <motion.div 
            className="add-task-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <input
              type="text"
              placeholder="タスクのタイトル"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              className="task-input"
            />
            <textarea
              placeholder="説明（任意）"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              className="task-textarea"
            />
            <div className="task-form-row">
              <div className="form-group">
                <label>優先度:</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: Number(e.target.value) })}
                  className="task-select"
                >
                  <option value={1}>低</option>
                  <option value={2}>中</option>
                  <option value={3}>高</option>
                </select>
              </div>
              <div className="form-group">
                <label>経験値:</label>
                <div className="exp-input-group">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newTask.exp_reward}
                    onChange={(e) => setNewTask({ ...newTask, exp_reward: Number(e.target.value) })}
                    className="task-input-small"
                  />
                  <AIButton
                    onClick={handleAIExpEvaluation}
                    className="ai-exp-button"
                    placeholderText="AIが適切な経験値を評価"
                  >
                    AI評価
                  </AIButton>
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button onClick={handleAddTask} className="btn-primary">
                タスク追加
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AIタスク提案 */}
      <AIPlaceholder
        feature="AIタスク提案"
        description="あなたの目標に基づいて、AIが最適なタスクを提案します"
        icon="💡"
        onConfigureClick={() => window.location.hash = '#settings'}
      />

      <div className="task-list">
        <div className="task-list-header-section">
          <h3>未完了タスク ({pendingTasks.length})</h3>
          <AIButton
            onClick={handleAITaskSuggestion}
            className="ai-suggest-button"
            placeholderText="AIがあなたの目標に基づいてタスクを提案"
          >
            AIタスク提案
          </AIButton>
        </div>
        <AnimatePresence>
          {pendingTasks.map((task) => (
            <motion.div
              key={task.id}
              className="task-item"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              layout
            >
              <div className="task-content">
                <div className="task-header">
                  <h4>{task.title}</h4>
                  <div className="task-meta">
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {getPriorityText(task.priority)}
                    </span>
                    <span className="exp-badge">+{task.exp_reward} EXP</span>
                  </div>
                </div>
                {task.description && (
                  <p className="task-description">{task.description}</p>
                )}
              </div>
              <div className="task-actions">
                <button
                  className="btn-complete"
                  onClick={(e) => handleCompleteTask(task.id, e)}
                >
                  ✓ 完了
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {pendingTasks.length === 0 && (
          <div className="empty-state">
            <p>🎉 すべてのタスクが完了しています！</p>
            <p>新しいタスクを追加して、さらに成長しましょう。</p>
          </div>
        )}
      </div>

      {/* 経験値アニメーション */}
      <ExpGainAnimation
        isVisible={expAnimation.isVisible}
        expAmount={expAnimation.expAmount}
        position={expAnimation.position}
        onComplete={() => setExpAnimation({ ...expAnimation, isVisible: false })}
      />

      {/* v1.2.5新機能: 祝福メッセージアニメーション */}
      <AnimatePresence>
        {celebrationMessage.isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: -20 }}
            exit={{ opacity: 0, scale: 0.5, y: -40 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              position: 'fixed',
              left: celebrationMessage.position.x,
              top: celebrationMessage.position.y,
              transform: 'translate(-50%, -50%)',
              zIndex: 1000,
              pointerEvents: 'none',
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#FFD700',
              textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
              background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.5))'
            }}
          >
            {celebrationMessage.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskList;