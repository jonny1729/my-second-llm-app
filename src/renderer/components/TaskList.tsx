import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '../stores/taskStore';

const TaskList: React.FC = () => {
  const { tasks, isLoading, loadTasks, addTask, completeTaskById, getPendingTasks } = useTaskStore();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 2,
    exp_reward: 10
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

  const handleCompleteTask = async (taskId: number) => {
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
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newTask.exp_reward}
                  onChange={(e) => setNewTask({ ...newTask, exp_reward: Number(e.target.value) })}
                  className="task-input-small"
                />
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

      <div className="task-list">
        <h3>未完了タスク ({pendingTasks.length})</h3>
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
                  onClick={() => handleCompleteTask(task.id)}
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
    </div>
  );
};

export default TaskList;