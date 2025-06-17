import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import Database from '../database/database';
import { setupIpcHandlers } from './ipc-handlers';

let database: Database;

async function createWindow(): Promise<void> {
  // データベース初期化
  database = new Database();
  await database.initialize();
  
  // IPC ハンドラー設定
  setupIpcHandlers(database);

  const mainWindow = new BrowserWindow({
    height: 800,
    width: 1200,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: 'RPG秘書 - Personal Assistant',
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:8080');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', async () => {
  if (database) {
    await database.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});