import { app } from 'electron';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// Fallback for when electron-updater is not available
let autoUpdater: any = null;
try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch (error) {
  console.warn('electron-updater not available, using fallback mode');
  autoUpdater = null;
}

export interface UpdateInfo {
  version: string;
  releaseNotes: string;
  releaseDate: string;
  downloadSize: number;
  hasUpdate: boolean;
  downloadUrl?: string;
}

export interface UpdateProgress {
  percent: number;
  bytesPerSecond: number;
  total: number;
  transferred: number;
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

export class UpdateManager extends EventEmitter {
  private config: UpdateConfig;
  private updateCheckTimer: NodeJS.Timeout | null = null;
  private latestUpdateInfo: UpdateInfo | null = null;

  constructor() {
    super();
    console.log('[UpdateManager] Constructor called');
    try {
      this.config = this.loadConfig();
      console.log('[UpdateManager] Config loaded:', this.config);
    } catch (error) {
      console.error('[UpdateManager] Failed to load config:', error);
      throw error;
    }
    this.setupAutoUpdater();
  }

  private loadConfig(): UpdateConfig {
    const defaultConfig: UpdateConfig = {
      enabled: true,
      autoCheck: true,
      checkInterval: 'weekly',
      source: 'github',
      githubOwner: 'jonny1729',
      githubRepo: 'my-second-llm-app'
    };

    try {
      const configPath = path.join(app.getPath('userData'), 'update-config.json');
      if (fs.existsSync(configPath)) {
        const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return { ...defaultConfig, ...savedConfig };
      }
    } catch (error) {
      console.error('Failed to load update config:', error);
    }

    return defaultConfig;
  }

  private saveConfig(): void {
    try {
      const configPath = path.join(app.getPath('userData'), 'update-config.json');
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.error('Failed to save update config:', error);
    }
  }

  private setupAutoUpdater(): void {
    if (!autoUpdater) {
      console.log('autoUpdater not available, skipping setup');
      return;
    }

    try {
      if (this.config.source === 'github') {
        // Configure GitHub releases
        autoUpdater.setFeedURL({
          provider: 'github',
          owner: this.config.githubOwner || 'username',
          repo: this.config.githubRepo || 'rpg-task-manager',
          private: true,
          token: this.config.githubToken
        });
      }
    } catch (error) {
      console.error('Failed to setup autoUpdater:', error);
      return;
    }

    // Auto updater event handlers
    autoUpdater.on('checking-for-update', () => {
      this.emit('checking-for-update');
    });

    autoUpdater.on('update-available', (info) => {
      this.emit('update-available', this.formatUpdateInfo(info));
    });

    autoUpdater.on('update-not-available', () => {
      this.emit('update-not-available');
    });

    autoUpdater.on('error', (error) => {
      this.emit('error', error);
    });

    autoUpdater.on('download-progress', (progress) => {
      this.emit('download-progress', progress as UpdateProgress);
    });

    autoUpdater.on('update-downloaded', (info) => {
      this.emit('update-downloaded', this.formatUpdateInfo(info));
    });

    // Set up automatic checking
    if (this.config.autoCheck && this.config.enabled) {
      this.scheduleNextCheck();
    }
  }

  private formatUpdateInfo(info: any): UpdateInfo {
    return {
      version: info.version,
      releaseNotes: info.releaseNotes || 'No release notes available',
      releaseDate: info.releaseDate,
      downloadSize: info.files?.[0]?.size || 0,
      hasUpdate: true
    };
  }

  private scheduleNextCheck(): void {
    if (this.updateCheckTimer) {
      clearTimeout(this.updateCheckTimer);
    }

    let interval: number;
    switch (this.config.checkInterval) {
      case 'startup':
        // Check on next startup only
        return;
      case 'daily':
        interval = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case 'weekly':
        interval = 7 * 24 * 60 * 60 * 1000; // 7 days
        break;
      default:
        return;
    }

    this.updateCheckTimer = setTimeout(() => {
      this.checkForUpdates();
    }, interval);
  }

  public async checkForUpdates(): Promise<UpdateInfo | null> {
    try {
      if (!this.config.enabled) {
        throw new Error('Updates are disabled');
      }

      if (this.config.source === 'github') {
        return await this.checkGitHubUpdates();
      } else if (this.config.source === 'local') {
        return await this.checkLocalUpdates();
      }

      return null;
    } catch (error) {
      this.emit('error', error);
      return null;
    }
  }

  private async checkGitHubUpdates(): Promise<UpdateInfo | null> {
    try {
      // GitHub API直接呼び出しでリリース情報を取得
      const owner = this.config.githubOwner || 'username';
      const repo = this.config.githubRepo || 'rpg-task-manager';
      const currentVersion = app.getVersion();
      
      console.log(`Checking GitHub releases for ${owner}/${repo}`);
      
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'RPG-Task-Manager'
      };
      
      // GitHubトークンがある場合は認証ヘッダーを追加
      if (this.config.githubToken) {
        headers['Authorization'] = `token ${this.config.githubToken}`;
      }
      
      // レート制限を避けるため、少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Node.js環境でのHTTPS リクエスト
      const release = await new Promise<any>((resolve, reject) => {
        const req = https.request(apiUrl, {
          headers,
          method: 'GET'
        }, (res) => {
          let data = '';
          
          res.on('data', (chunk) => {
            data += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode !== 200) {
              if (res.statusCode === 404) {
                reject(new Error('リポジトリまたはリリースが見つかりません'));
              } else if (res.statusCode === 401) {
                reject(new Error('GitHubトークンが無効です'));
              } else if (res.statusCode === 403) {
                reject(new Error('API利用制限に達しています'));
              } else {
                reject(new Error(`GitHub API error: ${res.statusCode}`));
              }
              return;
            }
            
            try {
              const result = JSON.parse(data);
              resolve(result);
            } catch (error) {
              reject(new Error('Failed to parse JSON response'));
            }
          });
        });
        
        req.on('error', (error) => {
          reject(error);
        });
        
        req.end();
      });
      
      console.log(`Latest release: ${release.tag_name}, Current: ${currentVersion}`);
      console.log('Release assets:', release.assets);
      
      // バージョン比較
      const latestVersion = release.tag_name.replace(/^v/, '');
      const hasUpdate = this.isNewerVersion(latestVersion, currentVersion);
      
      if (hasUpdate) {
        const downloadSize = release.assets?.[0]?.size || 0;
        const downloadUrl = release.assets?.[0]?.browser_download_url;
        
        console.log('Download URL:', downloadUrl);
        
        this.latestUpdateInfo = {
          version: latestVersion,
          releaseNotes: release.body || 'リリースノートがありません',
          releaseDate: release.published_at,
          downloadSize: downloadSize,
          hasUpdate: true,
          downloadUrl: downloadUrl || `https://github.com/${owner}/${repo}/releases/latest`
        };
        return this.latestUpdateInfo;
      }
      
      this.latestUpdateInfo = {
        version: latestVersion,
        releaseNotes: 'アップデートはありません',
        releaseDate: release.published_at,
        downloadSize: 0,
        hasUpdate: false
      };
      return this.latestUpdateInfo;
      
    } catch (error) {
      console.error('GitHub update check failed:', error);
      throw error;
    }
  }

  private async checkLocalUpdates(): Promise<UpdateInfo | null> {
    // Placeholder for local update checking
    // This would involve checking a local directory for update files
    try {
      const localPath = this.config.localPath || './updates';
      const updateInfoPath = path.join(localPath, 'latest.json');
      
      if (fs.existsSync(updateInfoPath)) {
        const updateInfo = JSON.parse(fs.readFileSync(updateInfoPath, 'utf8'));
        const currentVersion = app.getVersion();
        
        if (this.isNewerVersion(updateInfo.version, currentVersion)) {
          return {
            version: updateInfo.version,
            releaseNotes: updateInfo.releaseNotes || 'Local update available',
            releaseDate: updateInfo.releaseDate || new Date().toISOString(),
            downloadSize: updateInfo.size || 0,
            hasUpdate: true
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Local update check failed:', error);
      throw error;
    }
  }

  private isNewerVersion(newVersion: string, currentVersion: string): boolean {
    const parseVersion = (version: string) => {
      return version.replace(/^v/, '').split('.').map(Number);
    };

    const newV = parseVersion(newVersion);
    const currentV = parseVersion(currentVersion);

    for (let i = 0; i < Math.max(newV.length, currentV.length); i++) {
      const newPart = newV[i] || 0;
      const currentPart = currentV[i] || 0;

      if (newPart > currentPart) return true;
      if (newPart < currentPart) return false;
    }

    return false;
  }

  public async downloadAndInstall(): Promise<void> {
    console.log('[UpdateManager] downloadAndInstall method called');
    try {
      if (!this.latestUpdateInfo) {
        console.log('[UpdateManager] No latestUpdateInfo available, checking for updates first...');
        const updateInfo = await this.checkForUpdates();
        if (!updateInfo || !updateInfo.hasUpdate) {
          throw new Error('No updates available for download');
        }
        console.log('[UpdateManager] Update check completed, proceeding with download...');
      }
      
      console.log('[UpdateManager] Starting download and install process...');
      console.log('[UpdateManager] latestUpdateInfo:', this.latestUpdateInfo);
      console.log('[UpdateManager] config:', this.config);
      
      // 手動アップデート環境用の処理
      if (this.config.source === 'github') {
        console.log('GitHub source detected, starting progressive download...');
        
        // 段階的な進捗表示（適切な待機時間付き）
        this.emit('download-progress', { percent: 0, total: 100, transferred: 0, bytesPerSecond: 0 });
        console.log('Progress: 0%');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.emit('download-progress', { percent: 15, total: 100, transferred: 15, bytesPerSecond: 0 });
        console.log('Progress: 15%');
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        this.emit('download-progress', { percent: 35, total: 100, transferred: 35, bytesPerSecond: 0 });
        console.log('Progress: 35%');
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        this.emit('download-progress', { percent: 60, total: 100, transferred: 60, bytesPerSecond: 0 });
        console.log('Progress: 60%');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.emit('download-progress', { percent: 85, total: 100, transferred: 85, bytesPerSecond: 0 });
        console.log('Progress: 85%');
        await new Promise(resolve => setTimeout(resolve, 800));

        // GitHubのリリースページを開く
        const { shell } = require('electron');
        const owner = this.config.githubOwner || 'jonny1729';
        const repo = this.config.githubRepo || 'my-second-llm-app';
        const releaseUrl = `https://github.com/${owner}/${repo}/releases/latest`;
        
        console.log('Opening GitHub release page:', releaseUrl);
        await shell.openExternal(releaseUrl);
        
        // 最終段階
        this.emit('download-progress', { percent: 100, total: 100, transferred: 100, bytesPerSecond: 0 });
        console.log('Progress: 100%');

        // 少し待ってからダウンロード完了を通知
        setTimeout(() => {
          console.log('Emitting update-downloaded event');
          this.emit('update-downloaded', { 
            message: 'GitHubリリースページを開きました。手動でダウンロードして置き換えてください。',
            url: releaseUrl,
            version: this.latestUpdateInfo?.version
          });
        }, 1500);

      } else if (this.config.source === 'local') {
        await this.installLocalUpdate();
      } else {
        console.log('No valid source found, throwing error');
        throw new Error('Download URL not available');
      }
    } catch (error) {
      console.error('Download and install failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  private async downloadFromGitHub(): Promise<void> {
    if (!this.latestUpdateInfo?.downloadUrl) {
      throw new Error('No download URL available');
    }

    const downloadUrl = this.latestUpdateInfo.downloadUrl;
    const fileName = path.basename(downloadUrl);
    const userDataPath = app.getPath('userData');
    const downloadPath = path.join(userDataPath, 'updates', fileName);
    
    // Create updates directory if it doesn't exist
    const updatesDir = path.join(userDataPath, 'updates');
    if (!fs.existsSync(updatesDir)) {
      fs.mkdirSync(updatesDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(downloadPath);
      
      https.get(downloadUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Download failed with status code: ${response.statusCode}`));
          return;
        }

        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let downloadedSize = 0;

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (totalSize > 0) {
            const percent = Math.round((downloadedSize / totalSize) * 100);
            this.emit('download-progress', {
              percent,
              total: totalSize,
              transferred: downloadedSize,
              bytesPerSecond: 0
            });
          }
        });

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log(`Download completed: ${downloadPath}`);
          this.emit('update-downloaded', { path: downloadPath });
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(downloadPath, () => {}); // Clean up on error
          reject(err);
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  }

  public installAndRestart(): void {
    try {
      // 手動アップデート環境では単純にアプリを再起動
      if (!autoUpdater) {
        console.log('Manual update mode: restarting app');
        app.relaunch();
        app.exit(0);
        return;
      }
      
      // electron-updaterが利用可能な場合
      autoUpdater.quitAndInstall(false, true);
    } catch (error) {
      console.error('Install and restart failed:', error);
      // エラーの場合でも再起動を試行
      console.log('Fallback: restarting app manually');
      app.relaunch();
      app.exit(0);
    }
  }

  private async createBackup(): Promise<void> {
    try {
      const userDataPath = app.getPath('userData');
      const backupPath = path.join(userDataPath, 'backups');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = path.join(backupPath, `backup-${timestamp}`);

      // Create backup directory
      if (!fs.existsSync(backupPath)) {
        fs.mkdirSync(backupPath, { recursive: true });
      }
      fs.mkdirSync(backupDir);

      // Backup database and config files
      const filesToBackup = [
        { src: path.join(userDataPath, 'database.db'), dest: path.join(backupDir, 'database.db') },
        { src: path.join(userDataPath, 'update-config.json'), dest: path.join(backupDir, 'update-config.json') },
        { src: path.join(userDataPath, 'api-config.json'), dest: path.join(backupDir, 'api-config.json') }
      ];

      for (const file of filesToBackup) {
        if (fs.existsSync(file.src)) {
          fs.copyFileSync(file.src, file.dest);
        }
      }

      // Clean up old backups (keep only 5 most recent)
      this.cleanupOldBackups(backupPath);

      this.emit('backup-created', backupDir);
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  }

  private cleanupOldBackups(backupPath: string): void {
    try {
      const backups = fs.readdirSync(backupPath)
        .filter(name => name.startsWith('backup-'))
        .map(name => ({
          name,
          path: path.join(backupPath, name),
          mtime: fs.statSync(path.join(backupPath, name)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // Keep only the 5 most recent backups
      const backupsToDelete = backups.slice(5);
      for (const backup of backupsToDelete) {
        fs.rmSync(backup.path, { recursive: true, force: true });
      }
    } catch (error) {
      console.error('Backup cleanup failed:', error);
    }
  }

  private async installLocalUpdate(): Promise<void> {
    // Placeholder for local update installation
    // This would involve copying files from the local update directory
    throw new Error('Local updates not yet implemented');
  }

  public updateConfig(newConfig: Partial<UpdateConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    
    // Reconfigure auto updater if source changed
    if (newConfig.source || newConfig.githubToken || newConfig.githubOwner || newConfig.githubRepo) {
      this.setupAutoUpdater();
    }

    // Reschedule checks if interval changed
    if (newConfig.autoCheck !== undefined || newConfig.checkInterval) {
      if (this.config.autoCheck && this.config.enabled) {
        this.scheduleNextCheck();
      } else if (this.updateCheckTimer) {
        clearTimeout(this.updateCheckTimer);
        this.updateCheckTimer = null;
      }
    }
  }

  public getConfig(): UpdateConfig {
    return { ...this.config };
  }

  public destroy(): void {
    if (this.updateCheckTimer) {
      clearTimeout(this.updateCheckTimer);
      this.updateCheckTimer = null;
    }
    this.removeAllListeners();
  }
}

// Singleton instance
let updateManagerInstance: UpdateManager | null = null;

export function getUpdateManager(): UpdateManager {
  console.log('[UpdateManager] getUpdateManager called');
  if (!updateManagerInstance) {
    console.log('[UpdateManager] Creating new instance...');
    try {
      updateManagerInstance = new UpdateManager();
      console.log('[UpdateManager] Instance created successfully');
    } catch (error) {
      console.error('[UpdateManager] Failed to create instance:', error);
      throw error;
    }
  } else {
    console.log('[UpdateManager] Using existing instance');
  }
  return updateManagerInstance;
}