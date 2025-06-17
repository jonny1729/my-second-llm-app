import { create } from 'zustand';
import { getUserStats, updateUserStats, addExperience } from '../utils/ipc';

interface UserStats {
  id: number;
  current_level: number;
  current_exp: number;
  exp_to_next_level: number;
  total_exp: number;
}

interface UserStore {
  stats: UserStats | null;
  isLoading: boolean;
  loadUserStats: () => Promise<void>;
  gainExperience: (expAmount: number, description: string, sourceType: string, sourceId?: number) => Promise<void>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  stats: null,
  isLoading: false,

  loadUserStats: async () => {
    set({ isLoading: true });
    try {
      const stats = await getUserStats();
      set({ stats, isLoading: false });
    } catch (error) {
      console.error('ユーザー統計の取得に失敗:', error);
      set({ isLoading: false });
    }
  },

  gainExperience: async (expAmount: number, description: string, sourceType: string, sourceId?: number) => {
    const { stats } = get();
    if (!stats) return;

    // 経験値ログを追加
    await addExperience(sourceType, sourceId || null, expAmount, description);

    let newExp = stats.current_exp + expAmount;
    let newLevel = stats.current_level;
    let newTotalExp = stats.total_exp + expAmount;

    // レベルアップチェック
    while (newExp >= stats.exp_to_next_level) {
      newExp -= stats.exp_to_next_level;
      newLevel++;
    }

    // データベース更新
    await updateUserStats(newLevel, newExp, newTotalExp);

    // 状態更新
    const updatedStats = {
      ...stats,
      current_level: newLevel,
      current_exp: newExp,
      total_exp: newTotalExp,
      exp_to_next_level: calculateExpToNextLevel(newLevel)
    };

    set({ stats: updatedStats });

    // レベルアップした場合
    if (newLevel > stats.current_level) {
      // TODO: レベルアップアニメーション
      console.log(`🎉 レベルアップ！ Lv.${newLevel}`);
    }
  }
}));

function calculateExpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.2, level - 1));
}