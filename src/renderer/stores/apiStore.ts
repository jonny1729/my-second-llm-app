import { create } from 'zustand';
import { getApiSettings, updateApiKey } from '../utils/ipc';

interface ApiSetting {
  id: number;
  api_name: string;
  api_key?: string;
  is_active: boolean;
  model_name?: string;
  created_at: string;
  updated_at: string;
}

interface ApiStore {
  apiSettings: ApiSetting[];
  isLoading: boolean;
  loadApiSettings: () => Promise<void>;
  updateApiSetting: (apiName: string, apiKey: string) => Promise<void>;
  isApiConfigured: (apiName: string) => boolean;
  getActiveApis: () => ApiSetting[];
  hasAnyActiveApi: () => boolean;
}

export const useApiStore = create<ApiStore>((set, get) => ({
  apiSettings: [],
  isLoading: false,

  loadApiSettings: async () => {
    set({ isLoading: true });
    try {
      const settings = await getApiSettings();
      set({ apiSettings: settings, isLoading: false });
    } catch (error) {
      console.error('API設定の取得に失敗:', error);
      set({ isLoading: false });
    }
  },

  updateApiSetting: async (apiName: string, apiKey: string) => {
    try {
      await updateApiKey(apiName, apiKey);
      // 設定を再読み込み
      await get().loadApiSettings();
      console.log(`${apiName} APIキーを更新しました`);
    } catch (error) {
      console.error('APIキーの更新に失敗:', error);
      throw error;
    }
  },

  isApiConfigured: (apiName: string) => {
    const setting = get().apiSettings.find(s => s.api_name === apiName);
    return Boolean(setting?.api_key && setting.api_key.length > 0 && setting.is_active);
  },

  getActiveApis: () => {
    return get().apiSettings.filter(setting => 
      setting.is_active && setting.api_key && setting.api_key.length > 0
    );
  },

  hasAnyActiveApi: () => {
    return get().getActiveApis().length > 0;
  }
}));