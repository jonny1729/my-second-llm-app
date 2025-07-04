import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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

interface UpdateSettingsProps {
  onCheckForUpdates?: () => void;
}

const UpdateSettings: React.FC<UpdateSettingsProps> = ({ onCheckForUpdates }) => {
  const [config, setConfig] = useState<UpdateConfig>({
    enabled: true,
    autoCheck: true,
    checkInterval: 'weekly',
    source: 'github',
    githubOwner: 'username',
    githubRepo: 'rpg-task-manager'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [tempGithubToken, setTempGithubToken] = useState('');
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [updateResult, setUpdateResult] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      if (window.electronAPI) {
        const savedConfig = await window.electronAPI.invoke('get-update-config');
        if (savedConfig) {
          setConfig(savedConfig);
          if (savedConfig.githubToken) {
            setTempGithubToken(''); // トークンは表示しない
          }
        }
      }
      setLastCheckTime(new Date().toISOString());
    } catch (error) {
      console.error('設定の読み込みに失敗:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setIsSaving(true);
      if (window.electronAPI) {
        await window.electronAPI.invoke('update-update-config', config);
        alert('設定が保存されました');
      } else {
        console.log('設定保存:', config);
        alert('設定が保存されました（ブラウザモード）');
      }
    } catch (error) {
      console.error('設定の保存に失敗:', error);
      alert('設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = (updates: Partial<UpdateConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleGithubTokenUpdate = () => {
    if (tempGithubToken.trim()) {
      updateConfig({ githubToken: tempGithubToken.trim() });
      setTempGithubToken('');
      alert('GitHubトークンが設定されました');
    }
  };

  const handleCheckForUpdates = async () => {
    try {
      setIsChecking(true);
      setUpdateResult(null);
      
      if (window.electronAPI) {
        const result = await window.electronAPI.invoke('check-for-updates');
        setLastCheckTime(new Date().toISOString());
        
        if (result && result.hasUpdate) {
          setUpdateResult(`新しいバージョン v${result.version} が利用可能です！`);
        } else {
          setUpdateResult('最新バージョンです');
        }
      } else {
        // ブラウザモードでは外部コールバックを使用
        if (onCheckForUpdates) {
          onCheckForUpdates();
        }
        setUpdateResult('アップデートチェック完了（ブラウザモード）');
      }
    } catch (error) {
      console.error('アップデートチェックエラー:', error);
      setUpdateResult(`エラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsChecking(false);
    }
  };

  const getMaskedToken = (token: string) => {
    if (!token || token.length < 8) return '';
    return token.substring(0, 4) + '••••••••' + token.substring(token.length - 4);
  };

  const formatLastCheckTime = (timeStr: string | null) => {
    if (!timeStr) return '未実行';
    try {
      const date = new Date(timeStr);
      return date.toLocaleString('ja-JP');
    } catch {
      return '不明';
    }
  };

  if (isLoading) {
    return (
      <div className="settings-section">
        <div className="loading">アップデート設定を読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="update-settings">
      {/* 基本設定 */}
      <div className="settings-section">
        <h3>🔄 自動アップデート設定</h3>
        <p className="section-description">
          アプリケーションの自動アップデート機能の設定を行います。
          最新の機能とセキュリティアップデートを自動で受け取れます。
        </p>

        <div className="update-basic-settings">
          <div className="setting-item">
            <label>自動アップデート</label>
            <div className="setting-control">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => updateConfig({ enabled: e.target.checked })}
              />
              <span>自動アップデート機能を有効にする</span>
            </div>
          </div>

          <div className="setting-item">
            <label>自動チェック</label>
            <div className="setting-control">
              <input
                type="checkbox"
                checked={config.autoCheck}
                onChange={(e) => updateConfig({ autoCheck: e.target.checked })}
                disabled={!config.enabled}
              />
              <span>起動時に新しいバージョンをチェック</span>
            </div>
          </div>

          <div className="setting-item">
            <label>チェック頻度</label>
            <div className="setting-control">
              <select
                value={config.checkInterval}
                onChange={(e) => updateConfig({ checkInterval: e.target.value as any })}
                disabled={!config.enabled || !config.autoCheck}
                className="interval-select"
              >
                <option value="startup">起動時のみ</option>
                <option value="daily">毎日</option>
                <option value="weekly">毎週</option>
                <option value="manual">手動のみ</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* アップデート元設定 */}
      <div className="settings-section">
        <h3>📦 アップデート元</h3>
        <p className="section-description">
          アップデートファイルの取得元を設定します。
        </p>

        <div className="update-source-settings">
          <div className="source-option">
            <input
              type="radio"
              id="github-source"
              name="updateSource"
              value="github"
              checked={config.source === 'github'}
              onChange={(e) => updateConfig({ source: 'github' })}
            />
            <label htmlFor="github-source" className="source-label">
              <div className="source-header">
                <span className="source-icon">🐙</span>
                <strong>GitHub Releases</strong>
                <span className="recommended-badge">推奨</span>
              </div>
              <p>GitHubリポジトリからリリースを自動取得</p>
            </label>
          </div>

          <div className="source-option">
            <input
              type="radio"
              id="local-source"
              name="updateSource"
              value="local"
              checked={config.source === 'local'}
              onChange={(e) => updateConfig({ source: 'local' })}
            />
            <label htmlFor="local-source" className="source-label">
              <div className="source-header">
                <span className="source-icon">📁</span>
                <strong>ローカルフォルダ</strong>
                <span className="beta-badge">β版</span>
              </div>
              <p>ローカルのフォルダからアップデートファイルを取得</p>
            </label>
          </div>
        </div>
      </div>

      {/* GitHub設定 */}
      {config.source === 'github' && (
        <motion.div
          className="settings-section"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h3>🔑 GitHub設定</h3>
          <p className="section-description">
            プライベートリポジトリの場合、Personal Access Tokenが必要です。
          </p>

          <div className="github-settings">
            <div className="setting-group">
              <label>リポジトリ情報</label>
              <div className="repo-inputs">
                <input
                  type="text"
                  placeholder="ユーザー名/組織名"
                  value={config.githubOwner || ''}
                  onChange={(e) => updateConfig({ githubOwner: e.target.value })}
                  className="repo-input"
                />
                <span className="repo-separator">/</span>
                <input
                  type="text"
                  placeholder="リポジトリ名"
                  value={config.githubRepo || ''}
                  onChange={(e) => updateConfig({ githubRepo: e.target.value })}
                  className="repo-input"
                />
              </div>
              <small className="input-help">
                例: username/rpg-task-manager
              </small>
            </div>

            <div className="setting-group">
              <label>Personal Access Token</label>
              {config.githubToken && (
                <div className="current-token">
                  <span className="token-label">現在のトークン:</span>
                  <div className="token-display">
                    <span className="token-value">
                      {showGithubToken ? config.githubToken : getMaskedToken(config.githubToken)}
                    </span>
                    <button
                      className="toggle-visibility"
                      onClick={() => setShowGithubToken(!showGithubToken)}
                    >
                      {showGithubToken ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="token-input-group">
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={tempGithubToken}
                  onChange={(e) => setTempGithubToken(e.target.value)}
                  className="token-input"
                />
                <button
                  className="btn-primary"
                  onClick={handleGithubTokenUpdate}
                  disabled={!tempGithubToken.trim()}
                >
                  設定
                </button>
              </div>
              
              <a
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="token-help-link"
              >
                Personal Access Tokenを作成 →
              </a>
            </div>
          </div>
        </motion.div>
      )}

      {/* ローカル設定 */}
      {config.source === 'local' && (
        <motion.div
          className="settings-section"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <h3>📁 ローカルフォルダ設定</h3>
          <p className="section-description">
            アップデートファイルを配置するローカルフォルダを指定します。
          </p>

          <div className="local-settings">
            <div className="setting-group">
              <label>フォルダパス</label>
              <div className="path-input-group">
                <input
                  type="text"
                  placeholder="./updates"
                  value={config.localPath || ''}
                  onChange={(e) => updateConfig({ localPath: e.target.value })}
                  className="path-input"
                />
                <button className="btn-secondary">参照</button>
              </div>
              <small className="input-help">
                latest.jsonとアップデートファイルを配置してください
              </small>
            </div>
          </div>
        </motion.div>
      )}

      {/* アップデート状況 */}
      <div className="settings-section">
        <h3>📊 アップデート状況</h3>
        
        <div className="update-status">
          <div className="status-item">
            <span className="status-label">最後のチェック:</span>
            <span className="status-value">{formatLastCheckTime(lastCheckTime)}</span>
          </div>
          
          <div className="status-item">
            <span className="status-label">現在のバージョン:</span>
            <span className="status-value">v1.1.0</span>
          </div>

          {updateResult && (
            <div className="status-item">
              <span className="status-label">チェック結果:</span>
              <span className={`status-value ${updateResult.includes('エラー') ? 'error' : updateResult.includes('利用可能') ? 'update-available' : 'up-to-date'}`}>
                {updateResult}
              </span>
            </div>
          )}

          <div className="status-actions">
            <button
              className="btn-primary"
              onClick={handleCheckForUpdates}
              disabled={!config.enabled || isChecking}
            >
              <span className="btn-icon">🔍</span>
              {isChecking ? 'チェック中...' : '今すぐチェック'}
            </button>
            
            <button
              className="btn-secondary"
              onClick={saveConfig}
              disabled={isSaving}
            >
              <span className="btn-icon">💾</span>
              {isSaving ? '保存中...' : '設定を保存'}
            </button>
          </div>
        </div>
      </div>

      {/* 注意事項 */}
      <div className="settings-section">
        <h3>⚠️ 注意事項</h3>
        <div className="update-notes">
          <ul>
            <li>アップデート前に自動でデータのバックアップが作成されます</li>
            <li>アップデート中はアプリケーションが再起動されます</li>
            <li>ネットワーク環境によってはダウンロードに時間がかかる場合があります</li>
            <li>GitHub Personal Access Tokenは暗号化してローカルに保存されます</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UpdateSettings;