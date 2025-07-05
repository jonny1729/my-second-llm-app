import { ipcMain, app } from 'electron';
import Database from '../database/database';
import { getUpdateManager } from '../services/UpdateManager';

let database: Database;

export function setupIpcHandlers(db: Database) {
  database = db;

  // アプリケーション情報関連
  ipcMain.handle('get-app-version', () => {
    return app.getVersion();
  });

  // ユーザー統計関連
  ipcMain.handle('get-user-stats', async () => {
    try {
      return await database.getUserStats();
    } catch (error) {
      console.error('ユーザー統計取得エラー:', error);
      throw error;
    }
  });

  ipcMain.handle('update-user-stats', async (event, level: number, exp: number, totalExp: number) => {
    try {
      await database.updateUserStats(level, exp, totalExp);
      return true;
    } catch (error) {
      console.error('ユーザー統計更新エラー:', error);
      throw error;
    }
  });

  // タスク関連
  ipcMain.handle('create-task', async (event, task) => {
    try {
      return await database.createTask(task);
    } catch (error) {
      console.error('タスク作成エラー:', error);
      throw error;
    }
  });

  ipcMain.handle('get-all-tasks', async () => {
    try {
      return await database.getAllTasks();
    } catch (error) {
      console.error('タスク取得エラー:', error);
      throw error;
    }
  });

  ipcMain.handle('complete-task', async (event, taskId: number) => {
    try {
      await database.completeTask(taskId);
      return true;
    } catch (error) {
      console.error('タスク完了エラー:', error);
      throw error;
    }
  });

  // 経験値関連
  ipcMain.handle('add-experience', async (event, sourceType: string, sourceId: number | null, expAmount: number, description: string) => {
    try {
      await database.addExperience(sourceType, sourceId, expAmount, description);
      return true;
    } catch (error) {
      console.error('経験値追加エラー:', error);
      throw error;
    }
  });

  // 目標関連
  ipcMain.handle('create-goal', async (event, goal) => {
    try {
      return await database.createGoal(goal);
    } catch (error) {
      console.error('目標作成エラー:', error);
      throw error;
    }
  });

  ipcMain.handle('get-all-goals', async () => {
    try {
      return await database.getAllGoals();
    } catch (error) {
      console.error('目標取得エラー:', error);
      throw error;
    }
  });

  // API設定関連
  ipcMain.handle('get-api-settings', async () => {
    try {
      return await database.getApiSettings();
    } catch (error) {
      console.error('API設定取得エラー:', error);
      throw error;
    }
  });

  ipcMain.handle('update-api-key', async (event, apiName: string, apiKey: string) => {
    try {
      await database.updateApiKey(apiName, apiKey);
      return true;
    } catch (error) {
      console.error('APIキー更新エラー:', error);
      throw error;
    }
  });

  // アップデート関連
  ipcMain.handle('get-update-config', async () => {
    try {
      const updateManager = getUpdateManager();
      return updateManager.getConfig();
    } catch (error) {
      console.error('アップデート設定取得エラー:', error);
      throw error;
    }
  });

  ipcMain.handle('update-update-config', async (event, config) => {
    try {
      const updateManager = getUpdateManager();
      updateManager.updateConfig(config);
      return true;
    } catch (error) {
      console.error('アップデート設定更新エラー:', error);
      throw error;
    }
  });

  ipcMain.handle('check-for-updates', async () => {
    try {
      const updateManager = getUpdateManager();
      return await updateManager.checkForUpdates();
    } catch (error) {
      console.error('アップデートチェックエラー:', error);
      throw error;
    }
  });

  ipcMain.handle('download-and-install-update', async (event) => {
    try {
      const updateManager = getUpdateManager();
      
      // プログレス通知のリスナーを設定
      updateManager.on('download-progress', (progressInfo) => {
        event.sender.send('update-progress', progressInfo);
      });

      updateManager.on('update-downloaded', (info) => {
        event.sender.send('update-downloaded', info);
      });

      await updateManager.downloadAndInstall();
      return true;
    } catch (error) {
      console.error('アップデートダウンロード・インストールエラー:', error);
      throw error;
    }
  });

  ipcMain.handle('install-and-restart', async () => {
    try {
      const updateManager = getUpdateManager();
      updateManager.installAndRestart();
      return true;
    } catch (error) {
      console.error('インストール・再起動エラー:', error);
      throw error;
    }
  });
}