// Electron環境とブラウザ環境の両方で動作するようにモック化
let ipcRenderer: any;

try {
  if (typeof window !== 'undefined' && window.require) {
    ipcRenderer = window.require('electron').ipcRenderer;
  } else {
    // ブラウザ環境用のモック
    ipcRenderer = {
      invoke: async (channel: string, ...args: any[]) => {
        console.log(`Mock IPC call: ${channel}`, args);
        
        // タスク作成の場合、モックタスクリストに追加
        if (channel === 'create-task') {
          const newTask = {
            id: Date.now(),
            ...args[0],
            status: 'pending',
            createdAt: new Date().toISOString()
          };
          mockIpcResponses['get-all-tasks'].push(newTask);
          return newTask;
        }
        
        // タスク完了の場合、ステータスを更新
        if (channel === 'complete-task') {
          const taskId = args[0];
          const task = mockIpcResponses['get-all-tasks'].find((t: any) => t.id === taskId);
          if (task) {
            task.status = 'completed';
            task.completedAt = new Date().toISOString();
          }
          return true;
        }
        
        return mockIpcResponses[channel] || null;
      },
      on: (channel: string, callback: (...args: any[]) => void) => {
        console.log(`Mock IPC listener: ${channel}`);
      },
      removeAllListeners: (channel: string) => {
        console.log(`Mock IPC remove listeners: ${channel}`);
      }
    };
  }
} catch (error) {
  console.warn('Electron not available, using mock IPC');
  // ブラウザ環境用のモック
  ipcRenderer = {
    invoke: async (channel: string, ...args: any[]) => {
      console.log(`Mock IPC call: ${channel}`, args);
      
      // タスク作成の場合、モックタスクリストに追加
      if (channel === 'create-task') {
        const newTask = {
          id: Date.now(),
          ...args[0],
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        mockIpcResponses['get-all-tasks'].push(newTask);
        return newTask;
      }
      
      // タスク完了の場合、ステータスを更新
      if (channel === 'complete-task') {
        const taskId = args[0];
        const task = mockIpcResponses['get-all-tasks'].find((t: any) => t.id === taskId);
        if (task) {
          task.status = 'completed';
          task.completedAt = new Date().toISOString();
        }
        return true;
      }
      
      return mockIpcResponses[channel] || null;
    },
    on: (channel: string, callback: (...args: any[]) => void) => {
      console.log(`Mock IPC listener: ${channel}`);
    },
    removeAllListeners: (channel: string) => {
      console.log(`Mock IPC remove listeners: ${channel}`);
    }
  };
}

// モックレスポンス
const mockIpcResponses: { [key: string]: any } = {
  'get-user-stats': { level: 1, exp: 0, totalExp: 0 },
  'get-all-tasks': [
    { id: 1, title: 'サンプルタスク1', description: 'これは開発用のサンプルタスクです', priority: 1, status: 'pending', expReward: 10, createdAt: new Date().toISOString() },
    { id: 2, title: 'サンプルタスク2', description: 'これも開発用のサンプルタスクです', priority: 2, status: 'completed', expReward: 15, createdAt: new Date().toISOString() }
  ],
  'get-all-goals': [
    { id: 1, title: 'サンプル目標1', description: 'これは開発用のサンプル目標です', priority: 1, status: 'active', targetDate: '2025-07-01', createdAt: new Date().toISOString() }
  ],
  'get-api-settings': [
    { id: 1, api_name: 'gemini', api_key: '', is_active: false, model_name: 'gemini-pro', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, api_name: 'openai', api_key: '', is_active: false, model_name: 'gpt-3.5-turbo', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 3, api_name: 'claude', api_key: '', is_active: false, model_name: 'claude-3-sonnet', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ],
  'get-update-config': { enabled: true, autoCheck: true },
  'get-app-version': '1.0.0',
  'get-last-update-check': new Date().toISOString(),
  'create-task': true,
  'complete-task': true,
  'create-goal': true,
  'update-api-key': true
};

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