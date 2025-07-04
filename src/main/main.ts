import { app, BrowserWindow, dialog } from 'electron';
import * as path from 'path';
import Database from '../database/database';
import { setupIpcHandlers } from './ipc-handlers';
import { getUpdateHandler, destroyUpdateHandler } from './updateHandler';

let database: Database;

// エラーハンドリング
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox('アプリケーションエラー', 
    `予期しないエラーが発生しました:\n${error.message}\n\nアプリケーションを再起動してください。`);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function createWindow(): Promise<void> {
  try {
    console.log('Starting RPG Task Manager...');
    console.log('App path:', app.getAppPath());
    console.log('__dirname:', __dirname);
    

    // データベース初期化
    console.log('Initializing database...');
    database = new Database();
    await database.initialize();
    console.log('Database initialized successfully');
    
    // IPC ハンドラー設定
    console.log('Setting up IPC handlers...');
    setupIpcHandlers(database);

    // アップデートハンドラー初期化（エラー時はスキップ）
    let updateHandler;
    try {
      console.log('Initializing update handler...');
      updateHandler = getUpdateHandler();
      console.log('Update handler initialized successfully');
    } catch (error) {
      console.warn('Update handler initialization failed:', error);
      console.warn('Application will continue without update functionality');
      // アップデート機能なしで続行
      updateHandler = null;
    }

    const mainWindow = new BrowserWindow({
      height: 800,
      width: 1200,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      title: 'RPG Task Manager',
      show: true, // 即座に表示
      center: true, // 画面中央に表示
      autoHideMenuBar: true, // メニューバーを自動的に隠す
    });

    // アップデートハンドラーが利用可能な場合のみ設定
    if (updateHandler) {
      updateHandler.setMainWindow(mainWindow);
    }

    let indexPath = path.join(__dirname, '../index.html');
    
    // Check if index.html exists at the expected location
    if (!require('fs').existsSync(indexPath)) {
      // Try alternative paths
      const altPaths = [
        path.join(__dirname, '../../index.html'),
        path.join(process.resourcesPath, 'app.asar.unpacked/index.html'),
        path.join(__dirname, 'index.html')
      ];
      
      for (const altPath of altPaths) {
        if (require('fs').existsSync(altPath)) {
          indexPath = altPath;
          break;
        }
      }
    }
    
    console.log('Loading index.html from:', indexPath);
    console.log('File exists:', require('fs').existsSync(indexPath));

    if (process.env.NODE_ENV === 'development') {
      mainWindow.loadURL('http://localhost:8080');
      mainWindow.webContents.openDevTools();
    } else {
      try {
        console.log('Attempting to load file:', indexPath);
        await mainWindow.loadFile(indexPath);
        console.log('File loaded successfully');
      } catch (error) {
        console.error('Failed to load index.html:', error);
        // Show error message in window
        mainWindow.loadURL(`data:text/html,<html><body><h1>Error Loading App</h1><p>Could not load: ${indexPath}</p><p>Error: ${error.message}</p></body></html>`);
      }
    }

    // ウィンドウは既に表示されているが、追加の準備完了処理
    mainWindow.once('ready-to-show', () => {
      console.log('Window ready-to-show event fired');
      mainWindow.focus(); // ウィンドウにフォーカスを移す
    });

    // エラー処理
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Failed to load:', errorCode, errorDescription);
      dialog.showErrorBox('読み込みエラー', 
        `ページの読み込みに失敗しました:\n${errorDescription}`);
    });

    // デバッグ用イベントログ
    mainWindow.webContents.on('did-start-loading', () => {
      console.log('Started loading page');
    });

    mainWindow.webContents.on('did-finish-load', () => {
      console.log('Finished loading page');
    });

    mainWindow.webContents.on('dom-ready', () => {
      console.log('DOM is ready');
    });

    // ウィンドウが準備できたら起動時アップデートチェック
    if (updateHandler) {
      mainWindow.webContents.once('did-finish-load', () => {
        try {
          updateHandler.checkForUpdatesOnStartup();
        } catch (error) {
          console.warn('Update check failed:', error);
        }
      });
    }

    console.log('Window creation completed successfully');

  } catch (error) {
    console.error('Failed to create window:', error);
    dialog.showErrorBox('起動エラー', 
      `アプリケーションの起動に失敗しました:\n${error.message}`);
    app.quit();
  }
}

app.whenReady().then(() => {
  console.log('Electron app ready');
  createWindow().catch(error => {
    console.error('Failed to create main window:', error);
    app.quit();
  });
});

app.on('window-all-closed', async () => {
  if (database) {
    await database.close();
  }
  
  // アップデートハンドラーのクリーンアップ
  destroyUpdateHandler();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});