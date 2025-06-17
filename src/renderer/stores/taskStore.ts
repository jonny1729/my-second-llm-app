import { create } from 'zustand';
import { createTask, getAllTasks, completeTask } from '../utils/ipc';
import { useUserStore } from './userStore';

interface Task {
  id: number;
  title: string;
  description?: string;
  priority: number;
  is_completed: boolean;
  completion_date?: string;
  due_date?: string;
  goal_id?: number;
  exp_reward: number;
  created_at: string;
  updated_at: string;
}

interface TaskStore {
  tasks: Task[];
  isLoading: boolean;
  loadTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'is_completed' | 'completion_date' | 'created_at' | 'updated_at'>) => Promise<void>;
  completeTaskById: (taskId: number) => Promise<void>;
  getTodaysTasks: () => Task[];
  getPendingTasks: () => Task[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  isLoading: false,

  loadTasks: async () => {
    set({ isLoading: true });
    try {
      const tasks = await getAllTasks();
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error('タスクの取得に失敗:', error);
      set({ isLoading: false });
    }
  },

  addTask: async (taskData) => {
    try {
      const taskId = await createTask({
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        dueDate: taskData.due_date,
        goalId: taskData.goal_id,
        expReward: taskData.exp_reward
      });

      // タスクリストを再読み込み
      await get().loadTasks();
      console.log('タスクを作成しました:', taskData.title);
    } catch (error) {
      console.error('タスクの作成に失敗:', error);
    }
  },

  completeTaskById: async (taskId: number) => {
    try {
      const task = get().tasks.find(t => t.id === taskId);
      if (!task) return;

      await completeTask(taskId);

      // 経験値獲得
      const { gainExperience } = useUserStore.getState();
      await gainExperience(
        task.exp_reward,
        `タスク完了: ${task.title}`,
        'task',
        taskId
      );

      // タスクリストを再読み込み
      await get().loadTasks();
      console.log('タスクを完了しました:', task.title);
    } catch (error) {
      console.error('タスクの完了に失敗:', error);
    }
  },

  getTodaysTasks: () => {
    const today = new Date().toISOString().split('T')[0];
    return get().tasks.filter(task => 
      !task.is_completed && 
      (task.due_date && task.due_date.startsWith(today))
    );
  },

  getPendingTasks: () => {
    return get().tasks.filter(task => !task.is_completed);
  }
}));