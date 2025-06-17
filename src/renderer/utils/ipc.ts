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