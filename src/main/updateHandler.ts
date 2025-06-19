import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import { getUpdateManager, UpdateManager, UpdateInfo, UpdateProgress } from '../services/UpdateManager';
import * as path from 'path';

export class UpdateHandler {
  private updateManager: UpdateManager;
  private mainWindow: BrowserWindow | null = null;

  constructor() {
    try {
      this.updateManager = getUpdateManager();
      this.setupUpdateEvents();
      this.setupIpcHandlers();
    } catch (error) {
      console.error('UpdateHandler initialization failed:', error);
      throw error;
    }
  }

  public setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  private setupUpdateEvents() {
    // UpdateManagerのイベントをリスニング
    this.updateManager.on('checking-for-update', () => {
      this.sendToRenderer('update-checking');
    });

    this.updateManager.on('update-available', (updateInfo: UpdateInfo) => {
      this.sendToRenderer('update-available', updateInfo);
    });

    this.updateManager.on('update-not-available', () => {
      this.sendToRenderer('update-not-available');
    });

    this.updateManager.on('error', (error: Error) => {
      console.error('Update error:', error);
      this.sendToRenderer('update-error', error.message);
    });

    this.updateManager.on('download-progress', (progress: UpdateProgress) => {
      this.sendToRenderer('update-download-progress', progress);
    });

    this.updateManager.on('update-downloaded', (updateInfo: UpdateInfo) => {
      this.sendToRenderer('update-downloaded', updateInfo);
    });

    this.updateManager.on('backup-created', (backupPath: string) => {
      console.log('Backup created:', backupPath);
      this.sendToRenderer('update-backup-created', backupPath);
    });
  }

  private setupIpcHandlers() {
    // アップデートチェック
    ipcMain.handle('check-for-updates', async () => {
      try {
        return await this.updateManager.checkForUpdates();
      } catch (error) {
        console.error('Manual update check failed:', error);
        throw error;
      }
    });

    // アップデートのダウンロードとインストール
    ipcMain.handle('download-and-install-update', async () => {
      try {
        await this.updateManager.downloadAndInstall();
        return true;
      } catch (error) {
        console.error('Download and install failed:', error);
        throw error;
      }
    });

    // アップデート設定の取得
    ipcMain.handle('get-update-config', () => {
      return this.updateManager.getConfig();
    });

    // アップデート設定の更新
    ipcMain.handle('update-update-config', (event, config) => {
      this.updateManager.updateConfig(config);
      return true;
    });

    // 最後のアップデートチェック時間を取得
    ipcMain.handle('get-last-update-check', () => {
      // 実装時にはConfigファイルから取得
      return new Date().toISOString();
    });

    // アプリのバージョンを取得
    ipcMain.handle('get-app-version', () => {
      return app.getVersion();
    });

    // アップデート後の再起動
    ipcMain.handle('restart-and-install-update', () => {
      this.updateManager.installAndRestart();
    });

    // 外部リンクを開く
    ipcMain.handle('open-external-link', (event, url: string) => {
      shell.openExternal(url);
    });

    // アップデート通知の表示設定
    ipcMain.handle('show-update-notification', (event, updateInfo: UpdateInfo) => {
      this.showUpdateNotification(updateInfo);
    });

    // フォルダダイアログを開く
    ipcMain.handle('open-folder-dialog', async () => {
      if (!this.mainWindow) return null;
      
      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openDirectory'],
        title: 'アップデートフォルダを選択'
      });

      return result.canceled ? null : result.filePaths[0];
    });

    // データバックアップ
    ipcMain.handle('backup-user-data', async () => {
      try {
        const userDataPath = app.getPath('userData');
        const backupPath = path.join(userDataPath, 'backups');
        
        // バックアップ処理（簡単な実装）
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(backupPath, `manual-backup-${timestamp}`);
        
        // 実際のバックアップロジックを実装
        console.log('Creating manual backup at:', backupDir);
        
        return backupDir;
      } catch (error) {
        console.error('Manual backup failed:', error);
        throw error;
      }
    });
  }

  private sendToRenderer(channel: string, data?: any) {
    if (this.mainWindow && this.mainWindow.webContents) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  private showUpdateNotification(updateInfo: UpdateInfo) {
    if (!this.mainWindow) return;

    // Electronネイティブ通知（オプション）
    const { Notification } = require('electron');
    
    if (Notification.isSupported()) {
      const notification = new Notification({
        title: '新しいアップデートが利用可能です',
        body: `バージョン ${updateInfo.version} が利用可能です`,
        icon: path.join(__dirname, '../../assets/icon.png') // アイコンがあれば
      });

      notification.on('click', () => {
        this.sendToRenderer('update-notification-clicked', updateInfo);
        this.mainWindow?.focus();
      });

      notification.show();
    }
  }

  public async checkForUpdatesOnStartup() {
    const config = this.updateManager.getConfig();
    
    if (config.enabled && config.autoCheck && config.checkInterval === 'startup') {
      try {
        // 起動時のチェックは少し遅延させる
        setTimeout(async () => {
          await this.updateManager.checkForUpdates();
        }, 3000);
      } catch (error) {
        console.error('Startup update check failed:', error);
      }
    }
  }

  public destroy() {
    this.updateManager.destroy();
    
    // IPCハンドラーを削除
    ipcMain.removeAllListeners('check-for-updates');
    ipcMain.removeAllListeners('download-and-install-update');
    ipcMain.removeAllListeners('get-update-config');
    ipcMain.removeAllListeners('update-update-config');
    ipcMain.removeAllListeners('get-last-update-check');
    ipcMain.removeAllListeners('get-app-version');
    ipcMain.removeAllListeners('restart-and-install-update');
    ipcMain.removeAllListeners('open-external-link');
    ipcMain.removeAllListeners('show-update-notification');
    ipcMain.removeAllListeners('open-folder-dialog');
    ipcMain.removeAllListeners('backup-user-data');
  }
}

// シングルトンインスタンス
let updateHandlerInstance: UpdateHandler | null = null;

export function getUpdateHandler(): UpdateHandler {
  if (!updateHandlerInstance) {
    updateHandlerInstance = new UpdateHandler();
  }
  return updateHandlerInstance;
}

export function destroyUpdateHandler() {
  if (updateHandlerInstance) {
    updateHandlerInstance.destroy();
    updateHandlerInstance = null;
  }
}