import { create } from 'zustand';

// 【実装状況】: IMPLEMENTED
// 【説明】: アップデート機能の状態管理ストア（Phase3で作成）
// 【責務】: アップデート関連の全状態を一元管理
// 【依存関係】: zustand

export interface UpdateInfo {
  version: string;
  releaseNotes: string;
  releaseDate: string;
  downloadSize: number;
  hasUpdate: boolean;
  downloadUrl?: string;
}

export interface UpdateConfig {
  enabled: boolean;
  autoCheck: boolean;
  checkInterval: 'startup' | 'daily' | 'weekly' | 'manual';
  source: 'github' | 'local';
  githubToken?: string;
  githubOwner?: string;
  githubRepo?: string;
  localPath?: string;
}

interface UpdateState {
  // アプリ情報
  appVersion: string;
  
  // アップデート情報
  updateInfo: UpdateInfo | null;
  updateConfig: UpdateConfig | null;
  lastCheckTime: string | null;
  
  // UI状態
  isLoading: boolean;
  isSaving: boolean;
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  updateDownloaded: boolean;
  showUpdateNotification: boolean;
  updateResult: string | null;
  
  // GitHub設定
  showGithubToken: boolean;
  tempGithubToken: string;
  showReleaseNotes: boolean;
}

interface UpdateActions {
  // アプリ情報
  setAppVersion: (version: string) => void;
  
  // アップデート情報
  setUpdateInfo: (info: UpdateInfo | null) => void;
  setUpdateConfig: (config: UpdateConfig) => void;
  setLastCheckTime: (time: string | null) => void;
  
  // UI状態
  setIsLoading: (loading: boolean) => void;
  setIsSaving: (saving: boolean) => void;
  setIsChecking: (checking: boolean) => void;
  setIsDownloading: (downloading: boolean) => void;
  setDownloadProgress: (progress: number) => void;
  setUpdateDownloaded: (downloaded: boolean) => void;
  setShowUpdateNotification: (show: boolean) => void;
  setUpdateResult: (result: string | null) => void;
  
  // GitHub設定
  setShowGithubToken: (show: boolean) => void;
  setTempGithubToken: (token: string) => void;
  setShowReleaseNotes: (show: boolean) => void;
  
  // 複合アクション
  resetDownloadState: () => void;
  resetUpdateState: () => void;
  
  // 【実装状況】: TODO
  // 【今後の課題】: 非同期アクションの実装
  checkForUpdates: () => Promise<void>;
  downloadAndInstall: () => Promise<void>;
  loadConfig: () => Promise<void>;
  saveConfig: () => Promise<void>;
}

type UpdateStore = UpdateState & UpdateActions;

const initialState: UpdateState = {
  // アプリ情報
  appVersion: '',
  
  // アップデート情報
  updateInfo: null,
  updateConfig: null,
  lastCheckTime: null,
  
  // UI状態
  isLoading: false,
  isSaving: false,
  isChecking: false,
  isDownloading: false,
  downloadProgress: 0,
  updateDownloaded: false,
  showUpdateNotification: false,
  updateResult: null,
  
  // GitHub設定
  showGithubToken: false,
  tempGithubToken: '',
  showReleaseNotes: false,
};

export const useUpdateStore = create<UpdateStore>((set, get) => ({
  ...initialState,
  
  // アプリ情報
  setAppVersion: (version: string) => set({ appVersion: version }),
  
  // アップデート情報
  setUpdateInfo: (info: UpdateInfo | null) => set({ updateInfo: info }),
  setUpdateConfig: (config: UpdateConfig) => set({ updateConfig: config }),
  setLastCheckTime: (time: string | null) => set({ lastCheckTime: time }),
  
  // UI状態
  setIsLoading: (loading: boolean) => set({ isLoading: loading }),
  setIsSaving: (saving: boolean) => set({ isSaving: saving }),
  setIsChecking: (checking: boolean) => set({ isChecking: checking }),
  setIsDownloading: (downloading: boolean) => set({ isDownloading: downloading }),
  setDownloadProgress: (progress: number) => set({ downloadProgress: progress }),
  setUpdateDownloaded: (downloaded: boolean) => set({ updateDownloaded: downloaded }),
  setShowUpdateNotification: (show: boolean) => set({ showUpdateNotification: show }),
  setUpdateResult: (result: string | null) => set({ updateResult: result }),
  
  // GitHub設定
  setShowGithubToken: (show: boolean) => set({ showGithubToken: show }),
  setTempGithubToken: (token: string) => set({ tempGithubToken: token }),
  setShowReleaseNotes: (show: boolean) => set({ showReleaseNotes: show }),
  
  // 複合アクション
  resetDownloadState: () => set({
    isDownloading: false,
    downloadProgress: 0,
    updateDownloaded: false,
    updateResult: null,
  }),
  
  resetUpdateState: () => set({
    updateInfo: null,
    updateResult: null,
    showUpdateNotification: false,
    isChecking: false,
    isDownloading: false,
    downloadProgress: 0,
    updateDownloaded: false,
  }),
  
  // 【実装状況】: IMPLEMENTED
  // 【説明】: アップデートチェックの実装
  checkForUpdates: async () => {
    const { setIsChecking, setUpdateResult, setUpdateInfo, setLastCheckTime } = get();
    
    try {
      setIsChecking(true);
      setUpdateResult(null);
      
      if (window.electronAPI) {
        const result = await window.electronAPI.invoke('check-for-updates');
        setLastCheckTime(new Date().toISOString());
        
        if (result && result.hasUpdate) {
          setUpdateResult(`新しいバージョン v${result.version} が利用可能です！`);
          setUpdateInfo(result);
        } else {
          setUpdateResult('最新バージョンです');
          setUpdateInfo(null);
        }
      }
    } catch (error) {
      console.error('アップデートチェックエラー:', error);
      setUpdateResult(`エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsChecking(false);
    }
  },
  
  downloadAndInstall: async () => {
    const { setIsDownloading, setDownloadProgress, setUpdateResult } = get();
    
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      if (window.electronAPI) {
        await window.electronAPI.invoke('download-and-install-update');
      }
    } catch (error) {
      console.error('アップデートダウンロードエラー:', error);
      setUpdateResult(`ダウンロードエラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsDownloading(false);
    }
  },
  
  loadConfig: async () => {
    const { setIsLoading, setUpdateConfig, setTempGithubToken } = get();
    
    try {
      setIsLoading(true);
      
      if (window.electronAPI) {
        const savedConfig = await window.electronAPI.invoke('get-update-config');
        if (savedConfig) {
          setUpdateConfig(savedConfig);
          if (savedConfig.githubToken) {
            setTempGithubToken(''); // トークンは表示しない
          }
        }
      }
    } catch (error) {
      console.error('設定の読み込みに失敗:', error);
    } finally {
      setIsLoading(false);
    }
  },
  
  saveConfig: async () => {
    const { setIsSaving, updateConfig } = get();
    
    try {
      setIsSaving(true);
      
      if (window.electronAPI && updateConfig) {
        await window.electronAPI.invoke('update-update-config', updateConfig);
      }
    } catch (error) {
      console.error('設定の保存に失敗:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  },
}));

// 【実装状況】: IMPLEMENTED
// 【説明】: イベントリスナー用のカスタムフック
// 【依存関係】: useUpdateStore, useEffect
export const useUpdateEventListeners = () => {
  const { 
    setDownloadProgress, 
    setIsDownloading, 
    setUpdateDownloaded 
  } = useUpdateStore();

  return {
    handleProgressUpdate: (progress: any) => {
      setDownloadProgress(Math.round(progress.percent || 0));
    },
    
    handleDownloadComplete: () => {
      setIsDownloading(false);
      setUpdateDownloaded(true);
      setDownloadProgress(100);
    },
  };
};