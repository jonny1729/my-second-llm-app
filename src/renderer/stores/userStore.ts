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
  showLevelUpModal: boolean;
  newLevel: number;
  loadUserStats: () => Promise<void>;
  gainExperience: (expAmount: number, description: string, sourceType: string, sourceId?: number) => Promise<boolean>;
  addExperience: (sourceType: string, sourceId: number | null, expAmount: number, description: string) => Promise<void>;
  closeLevelUpModal: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  stats: null,
  isLoading: false,
  showLevelUpModal: false,
  newLevel: 1,

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
    if (!stats) return false;

    // 経験値ログを追加
    await addExperience(sourceType, sourceId || null, expAmount, description);

    let newExp = stats.current_exp + expAmount;
    let newLevel = stats.current_level;
    let newTotalExp = stats.total_exp + expAmount;
    let leveledUp = false;

    // レベルアップチェック
    while (newExp >= stats.exp_to_next_level) {
      newExp -= stats.exp_to_next_level;
      newLevel++;
      leveledUp = true;
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
    if (leveledUp) {
      set({ 
        showLevelUpModal: true, 
        newLevel: newLevel 
      });
      console.log(`🎉 レベルアップ！ Lv.${newLevel}`);
    }

    return leveledUp;
  },

  addExperience: async (sourceType: string, sourceId: number | null, expAmount: number, description: string) => {
    await get().gainExperience(expAmount, description, sourceType, sourceId || undefined);
  },

  closeLevelUpModal: () => {
    set({ showLevelUpModal: false });
  }
}));

function calculateExpToNextLevel(level: number): number {
  return Math.floor(100 * Math.pow(1.2, level - 1));
}