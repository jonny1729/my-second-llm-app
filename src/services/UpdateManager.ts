import { app } from 'electron';
import { autoUpdater } from 'electron-updater';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface UpdateInfo {
  version: string;
  releaseNotes: string;
  releaseDate: string;
  downloadSize: number;
  hasUpdate: boolean;
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

  constructor() {
    super();
    this.config = this.loadConfig();
    this.setupAutoUpdater();
  }

  private loadConfig(): UpdateConfig {
    const defaultConfig: UpdateConfig = {
      enabled: true,
      autoCheck: true,
      checkInterval: 'weekly',
      source: 'github',
      githubOwner: 'username',
      githubRepo: 'rpg-task-manager'
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
      const result = await autoUpdater.checkForUpdates();
      if (result && result.updateInfo) {
        return this.formatUpdateInfo(result.updateInfo);
      }
      return null;
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
    try {
      if (this.config.source === 'github') {
        await this.createBackup();
        await autoUpdater.downloadUpdate();
        // The update will be installed automatically after download
      } else if (this.config.source === 'local') {
        await this.installLocalUpdate();
      }
    } catch (error) {
      console.error('Download and install failed:', error);
      this.emit('error', error);
      throw error;
    }
  }

  public installAndRestart(): void {
    try {
      autoUpdater.quitAndInstall(false, true);
    } catch (error) {
      console.error('Install and restart failed:', error);
      this.emit('error', error);
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
  if (!updateManagerInstance) {
    updateManagerInstance = new UpdateManager();
  }
  return updateManagerInstance;
}