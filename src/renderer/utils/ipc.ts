const { ipcRenderer } = window.require('electron');

// ユーザー統計関連
export const getUserStats = () => ipcRenderer.invoke('get-user-stats');
export const updateUserStats = (level: number, exp: number, totalExp: number) => 
  ipcRenderer.invoke('update-user-stats', level, exp, totalExp);

// タスク関連
export const createTask = (task: {
  title: string;
  description?: string;
  priority?: number;
  dueDate?: string;
  goalId?: number;
  expReward?: number;
}) => ipcRenderer.invoke('create-task', task);

export const getAllTasks = () => ipcRenderer.invoke('get-all-tasks');
export const completeTask = (taskId: number) => ipcRenderer.invoke('complete-task', taskId);

// 経験値関連
export const addExperience = (sourceType: string, sourceId: number | null, expAmount: number, description: string) =>
  ipcRenderer.invoke('add-experience', sourceType, sourceId, expAmount, description);

// 目標関連
export const createGoal = (goal: {
  title: string;
  description?: string;
  targetDate?: string;
  priority?: number;
}) => ipcRenderer.invoke('create-goal', goal);

export const getAllGoals = () => ipcRenderer.invoke('get-all-goals');

// API設定関連
export const getApiSettings = () => ipcRenderer.invoke('get-api-settings');
export const updateApiKey = (apiName: string, apiKey: string) => 
  ipcRenderer.invoke('update-api-key', apiName, apiKey);

// アップデート関連
export const checkForUpdates = () => ipcRenderer.invoke('check-for-updates');
export const downloadAndInstallUpdate = () => ipcRenderer.invoke('download-and-install-update');
export const getUpdateConfig = () => ipcRenderer.invoke('get-update-config');
export const updateUpdateConfig = (config: any) => ipcRenderer.invoke('update-update-config', config);
export const getLastUpdateCheck = () => ipcRenderer.invoke('get-last-update-check');
export const getAppVersion = () => ipcRenderer.invoke('get-app-version');
export const restartAndInstallUpdate = () => ipcRenderer.invoke('restart-and-install-update');
export const openExternalLink = (url: string) => ipcRenderer.invoke('open-external-link', url);
export const openFolderDialog = () => ipcRenderer.invoke('open-folder-dialog');
export const backupUserData = () => ipcRenderer.invoke('backup-user-data');

// ElectronAPIの型定義
declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      on: (channel: string, callback: (...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

// window.electronAPIを設定
if (typeof window !== 'undefined') {
  window.electronAPI = {
    invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
    on: (channel: string, callback: (...args: any[]) => void) => ipcRenderer.on(channel, callback),
    removeAllListeners: (channel: string) => ipcRenderer.removeAllListeners(channel)
  };
}