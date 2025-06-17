import { create } from 'zustand';
import { createGoal, getAllGoals } from '../utils/ipc';

interface Goal {
  id: number;
  title: string;
  description?: string;
  target_date?: string;
  priority: number;
  is_completed: boolean;
  completion_date?: string;
  created_at: string;
  updated_at: string;
}

interface GoalStore {
  goals: Goal[];
  isLoading: boolean;
  loadGoals: () => Promise<void>;
  addGoal: (goal: Omit<Goal, 'id' | 'is_completed' | 'completion_date' | 'created_at' | 'updated_at'>) => Promise<void>;
  completeGoal: (goalId: number) => Promise<void>;
  getActiveGoals: () => Goal[];
  getShortTermGoals: () => Goal[];
  getLongTermGoals: () => Goal[];
  getOverdueGoals: () => Goal[];
}

export const useGoalStore = create<GoalStore>((set, get) => ({
  goals: [],
  isLoading: false,

  loadGoals: async () => {
    set({ isLoading: true });
    try {
      const goals = await getAllGoals();
      set({ goals, isLoading: false });
    } catch (error) {
      console.error('目標の取得に失敗:', error);
      set({ isLoading: false });
    }
  },

  addGoal: async (goalData) => {
    try {
      const goalId = await createGoal({
        title: goalData.title,
        description: goalData.description,
        targetDate: goalData.target_date,
        priority: goalData.priority
      });

      // 目標リストを再読み込み
      await get().loadGoals();
      console.log('目標を作成しました:', goalData.title);
    } catch (error) {
      console.error('目標の作成に失敗:', error);
    }
  },

  completeGoal: async (goalId: number) => {
    try {
      // TODO: completeGoal API実装後に追加
      console.log('目標完了機能は実装予定です');
    } catch (error) {
      console.error('目標の完了に失敗:', error);
    }
  },

  getActiveGoals: () => {
    return get().goals.filter(goal => !goal.is_completed);
  },

  getShortTermGoals: () => {
    const today = new Date();
    const oneMonthLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return get().goals.filter(goal => 
      !goal.is_completed && 
      goal.target_date && 
      new Date(goal.target_date) <= oneMonthLater
    );
  },

  getLongTermGoals: () => {
    const today = new Date();
    const oneMonthLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    return get().goals.filter(goal => 
      !goal.is_completed && 
      (!goal.target_date || new Date(goal.target_date) > oneMonthLater)
    );
  },

  getOverdueGoals: () => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // 今日の終わり
    
    return get().goals.filter(goal => 
      !goal.is_completed && 
      goal.target_date && 
      new Date(goal.target_date) < today
    );
  }
}));