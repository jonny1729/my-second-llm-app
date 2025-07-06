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
    console.log('[IPC] download-and-install-update called');
    try {
      console.log('[IPC] Getting UpdateManager...');
      const updateManager = getUpdateManager();
      console.log('[IPC] UpdateManager obtained:', !!updateManager);
      
      if (!updateManager) {
        throw new Error('UpdateManager not available');
      }

      console.log('[IPC] Setting up progress listeners...');
      // プログレス通知のリスナーを設定
      updateManager.on('download-progress', (progressInfo) => {
        console.log('[IPC] Progress event received:', progressInfo);
        event.sender.send('update-download-progress', progressInfo);
      });

      updateManager.on('update-downloaded', (info) => {
        console.log('[IPC] Download completed event received:', info);
        event.sender.send('update-downloaded', info);
      });

      console.log('[IPC] Starting downloadAndInstall...');
      await updateManager.downloadAndInstall();
      console.log('[IPC] downloadAndInstall completed successfully');
      return true;
    } catch (error) {
      console.error('[IPC] アップデートダウンロード・インストールエラー:', error);
      console.error('[IPC] Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      });
      throw error;
    }
  });

  // 【注意】: install-and-restart ハンドラーは updateHandler.ts で管理

  // 開発者ツール関連
  ipcMain.handle('open-dev-tools', (event) => {
    const webContents = event.sender;
    if (webContents.isDevToolsOpened()) {
      webContents.closeDevTools();
    } else {
      webContents.openDevTools();
    }
    return true;
  });

  // メインプロセスログをレンダラーに送信
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info
  };

  const sendLogToRenderer = (level: string, args: any[]) => {
    try {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          if (arg instanceof Error) {
            return `${arg.name}: ${arg.message}\n${arg.stack}`;
          }
          try {
            return JSON.stringify(arg, null, 2);
          } catch (jsonError) {
            return `[Object: ${arg.constructor?.name || 'Unknown'}]`;
          }
        }
        return String(arg);
      }).join(' ');
      
      // 空のメッセージや無意味なログをフィルタリング
      if (!message.trim() || message.length < 3) {
        return;
      }
      
      // 全てのウィンドウにログを送信
      const { BrowserWindow } = require('electron');
      const allWindows = BrowserWindow.getAllWindows();
      allWindows.forEach(window => {
        if (window && !window.isDestroyed() && window.webContents) {
          try {
            window.webContents.send('main-process-log', {
              timestamp: new Date().toLocaleTimeString('ja-JP', { 
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              }) + '.' + String(new Date().getMilliseconds()).padStart(3, '0'),
              level: level || 'info', // レベルがundefinedの場合はinfoにフォールバック
              message,
              source: 'main'
            });
          } catch (sendError) {
            // ログ送信エラーは無視（無限ループを防ぐ）
          }
        }
      });
    } catch (error) {
      // エラーが発生してもログ転送を止めない
      originalConsole.error('[LOG-FORWARD-ERROR]', error);
    }
  };

  // コンソールメソッドをオーバーライド
  console.log = (...args) => {
    originalConsole.log(...args);
    sendLogToRenderer('info', args);
  };

  console.warn = (...args) => {
    originalConsole.warn(...args);
    sendLogToRenderer('warn', args);
  };

  console.error = (...args) => {
    originalConsole.error(...args);
    sendLogToRenderer('error', args);
  };

  console.info = (...args) => {
    originalConsole.info(...args);
    sendLogToRenderer('debug', args);
  };
}