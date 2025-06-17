import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTaskStore } from '../stores/taskStore';
import { useGoalStore } from '../stores/goalStore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, parseISO } from 'date-fns';

interface CalendarDay {
  date: Date;
  tasks: any[];
  goals: any[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { tasks, loadTasks } = useTaskStore();
  const { goals, loadGoals } = useGoalStore();

  useEffect(() => {
    loadTasks();
    loadGoals();
  }, [loadTasks, loadGoals]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // カレンダーの全日付を取得（前月末〜翌月初を含む）
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay()); // 日曜日開始
  
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()));

  const calendarDays: CalendarDay[] = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd
  }).map(date => {
    const dayTasks = tasks.filter(task => 
      task.due_date && isSameDay(parseISO(task.due_date), date)
    );
    
    const dayGoals = goals.filter(goal => 
      goal.target_date && isSameDay(parseISO(goal.target_date), date)
    );

    return {
      date,
      tasks: dayTasks,
      goals: dayGoals,
      isCurrentMonth: isSameMonth(date, currentDate),
      isToday: isToday(date)
    };
  });

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const getSelectedDateData = () => {
    if (!selectedDate) return null;
    
    return calendarDays.find(day => isSameDay(day.date, selectedDate));
  };

  const selectedData = getSelectedDateData();

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>📅 カレンダー</h2>
        <div className="calendar-navigation">
          <button onClick={prevMonth} className="nav-button">‹</button>
          <h3>{format(currentDate, 'yyyy年M月')}</h3>
          <button onClick={nextMonth} className="nav-button">›</button>
        </div>
      </div>

      <div className="calendar-layout">
        {/* カレンダーグリッド */}
        <div className="calendar-grid">
          {/* 曜日ヘッダー */}
          <div className="weekday-header">
            {['日', '月', '火', '水', '木', '金', '土'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div className="days-grid">
            {calendarDays.map((day, index) => (
              <motion.div
                key={index}
                className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${
                  day.isToday ? 'today' : ''
                } ${selectedDate && isSameDay(day.date, selectedDate) ? 'selected' : ''}`}
                onClick={() => setSelectedDate(day.date)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="day-number">{format(day.date, 'd')}</span>
                
                {/* タスクインジケーター */}
                {day.tasks.length > 0 && (
                  <div className="task-indicators">
                    <div className="task-dot">{day.tasks.length}</div>
                  </div>
                )}
                
                {/* 目標インジケーター */}
                {day.goals.length > 0 && (
                  <div className="goal-indicators">
                    <div className="goal-dot">🎯</div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* 日別詳細パネル */}
        <AnimatePresence>
          {selectedDate && selectedData && (
            <motion.div
              className="day-detail-panel"
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.3 }}
            >
              <div className="day-detail-header">
                <h3>{format(selectedDate, 'M月d日 (E)', { locale: undefined })}</h3>
                <button 
                  className="close-detail"
                  onClick={() => setSelectedDate(null)}
                >
                  ×
                </button>
              </div>

              <div className="day-detail-content">
                {/* タスク一覧 */}
                {selectedData.tasks.length > 0 && (
                  <div className="detail-section">
                    <h4>📝 タスク ({selectedData.tasks.length})</h4>
                    <div className="detail-items">
                      {selectedData.tasks.map(task => (
                        <motion.div
                          key={task.id}
                          className={`detail-item task-item ${task.is_completed ? 'completed' : ''}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <span className="item-title">{task.title}</span>
                          <span className="item-exp">+{task.exp_reward} EXP</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 目標一覧 */}
                {selectedData.goals.length > 0 && (
                  <div className="detail-section">
                    <h4>🎯 目標 ({selectedData.goals.length})</h4>
                    <div className="detail-items">
                      {selectedData.goals.map(goal => (
                        <motion.div
                          key={goal.id}
                          className={`detail-item goal-item ${goal.is_completed ? 'completed' : ''}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <span className="item-title">{goal.title}</span>
                          <span className="item-priority">優先度: {
                            goal.priority === 3 ? '高' : goal.priority === 2 ? '中' : '低'
                          }</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedData.tasks.length === 0 && selectedData.goals.length === 0 && (
                  <div className="empty-day">
                    <p>この日は予定がありません</p>
                    <p>タスクや目標を追加してみましょう！</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Calendar;