import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUpdateStore } from '../stores/updateStore';

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
  // 【実装状況】: MIGRATED TO STORE
  // 【説明】: UpdateSettings状態をupdateStoreに統一
  // 【依存関係】: useUpdateStore
  const {
    updateConfig,
    setUpdateConfig,
    isLoading,
    setIsLoading,
    isSaving,
    setIsSaving,
    showGithubToken,
    setShowGithubToken,
    tempGithubToken,
    setTempGithubToken,
    lastCheckTime,
    setLastCheckTime,
    isChecking,
    setIsChecking,
    updateResult,
    setUpdateResult,
    updateInfo,
    setUpdateInfo,
    showReleaseNotes,
    setShowReleaseNotes,
    isDownloading,
    setIsDownloading,
    downloadProgress,
    setDownloadProgress,
    updateDownloaded,
    setUpdateDownloaded,
    appVersion,
    // 非同期アクション
    checkForUpdates,
    downloadAndInstall,
    loadConfig,
    saveConfig
  } = useUpdateStore();
  
  // 【実装状況】: LOCAL CONFIG STATE
  // 【説明】: updateConfigがnullの場合のデフォルト値を管理
  const config = updateConfig || {
    enabled: true,
    autoCheck: true,
    checkInterval: 'weekly' as const,
    source: 'github' as const,
    githubOwner: 'username',
    githubRepo: 'rpg-task-manager'
  };

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // 【実装状況】: MIGRATED TO STORE
  // 【説明】: イベントリスナーはApp.tsxで統一管理されるように変更
  // 【依存関係】: updateStoreの状態を直接使用

  // 【実装状況】: MIGRATED TO STORE
  // 【説明】: loadConfigはupdateStoreの非同期アクションを使用

  // 【実装状況】: REMOVED
  // 【説明】: appVersionはupdateStoreから取得するように変更

  // 【実装状況】: MIGRATED TO STORE
  // 【説明】: saveConfigはupdateStoreの非同期アクションを使用
  const handleSaveConfig = async () => {
    try {
      await saveConfig();
      alert('設定が保存されました');
    } catch (error) {
      alert('設定の保存に失敗しました');
    }
  };

  const updateConfigLocal = (updates: Partial<UpdateConfig>) => {
    const newConfig = { ...config, ...updates };
    setUpdateConfig(newConfig);
  };

  const handleGithubTokenUpdate = () => {
    if (tempGithubToken.trim()) {
      updateConfigLocal({ githubToken: tempGithubToken.trim() });
      setTempGithubToken('');
      alert('GitHubトークンが設定されました');
    }
  };

  // 【実装状況】: MIGRATED TO STORE
  // 【説明】: checkForUpdatesはupdateStoreの非同期アクションを使用
  const handleCheckForUpdates = async () => {
    if (window.electronAPI) {
      await checkForUpdates();
    } else {
      // ブラウザモードでは外部コールバックを使用
      if (onCheckForUpdates) {
        onCheckForUpdates();
      }
      setUpdateResult('アップデートチェック完了（ブラウザモード）');
    }
  };

  // 【実装状況】: IMPLEMENTED
  // 【説明】: アップデートダウンロード処理（Phase2で修正済み）
  // 【依存関係】: window.electronAPI.invoke('download-and-install-update')
  // 【今後の課題】: エラーハンドリングの強化
  // 【実装状況】: MIGRATED TO STORE
  // 【説明】: downloadAndInstallはupdateStoreの非同期アクションを使用
  const handleDownloadUpdate = async () => {
    if (window.electronAPI) {
      await downloadAndInstall();
    } else {
      // ブラウザモードでは進捗をシミュレート
      setIsDownloading(true);
      for (let i = 0; i <= 100; i += 10) {
        setDownloadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      setIsDownloading(false);
      setUpdateDownloaded(true);
    }
  };

  const handleInstallAndRestart = async () => {
    try {
      if (window.electronAPI) {
        await window.electronAPI.invoke('install-and-restart');
      } else {
        alert('アプリが再起動されます（ブラウザモード）');
      }
    } catch (error) {
      console.error('インストールエラー:', error);
      alert('インストールに失敗しました');
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
                onChange={(e) => updateConfigLocal({ enabled: e.target.checked })}
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
                onChange={(e) => updateConfigLocal({ autoCheck: e.target.checked })}
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
                onChange={(e) => updateConfigLocal({ checkInterval: e.target.value as any })}
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
              onChange={(e) => updateConfigLocal({ source: 'github' })}
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
              onChange={(e) => updateConfigLocal({ source: 'local' })}
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
                  onChange={(e) => updateConfigLocal({ githubOwner: e.target.value })}
                  className="repo-input"
                />
                <span className="repo-separator">/</span>
                <input
                  type="text"
                  placeholder="リポジトリ名"
                  value={config.githubRepo || ''}
                  onChange={(e) => updateConfigLocal({ githubRepo: e.target.value })}
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
                  onChange={(e) => updateConfigLocal({ localPath: e.target.value })}
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
            <span className="status-value" style={{ color: '#4ECDC4', fontWeight: 'bold' }}>v{appVersion}</span>
          </div>

          {/* v1.2.5新機能: 最新バージョンメッセージ */}
          {updateResult && !updateResult.includes('エラー') && !updateResult.includes('利用可能') && (
            <div className="status-item">
              <span className="status-label">状態:</span>
              <span className="status-value" style={{ color: '#38a169', fontWeight: 'bold' }}>
                ✨ 最新バージョンです！
              </span>
            </div>
          )}

          {/* v1.2.9新機能: アップデート機能完成記念 */}
          {appVersion === '1.2.8' && (
            <div className="status-item">
              <span className="status-label">🎉 特別メッセージ:</span>
              <span className="status-value" style={{ color: '#e53e3e', fontWeight: 'bold' }}>
                アップデート機能完成おめでとうございます！🚀
              </span>
            </div>
          )}

          {updateResult && (
            <div className="status-item">
              <span className="status-label">チェック結果:</span>
              <span className={`status-value ${updateResult.includes('エラー') ? 'error' : updateResult.includes('利用可能') ? 'update-available' : 'up-to-date'}`}>
                {updateResult}
              </span>
            </div>
          )}

          {updateInfo && updateInfo.hasUpdate && (
            <div className="update-available-section">
              <h4>🎉 新しいアップデートが利用可能です</h4>
              <div className="update-details">
                <div className="update-info-item">
                  <span className="info-label">新バージョン:</span>
                  <span className="info-value">v{updateInfo.version}</span>
                </div>
                <div className="update-info-item">
                  <span className="info-label">リリース日:</span>
                  <span className="info-value">
                    {new Date(updateInfo.releaseDate).toLocaleDateString('ja-JP')}
                  </span>
                </div>
                {updateInfo.downloadSize > 0 && (
                  <div className="update-info-item">
                    <span className="info-label">ダウンロードサイズ:</span>
                    <span className="info-value">
                      {(updateInfo.downloadSize / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                )}
              </div>
              
              {updateInfo.releaseNotes && updateInfo.releaseNotes !== 'リリースノートがありません' && (
                <div className="release-notes-section">
                  <button 
                    className="release-notes-toggle"
                    onClick={() => setShowReleaseNotes(!showReleaseNotes)}
                  >
                    📝 リリースノート {showReleaseNotes ? '▼' : '▶'}
                  </button>
                  {showReleaseNotes && (
                    <div className="release-notes-content">
                      <pre>{updateInfo.releaseNotes}</pre>
                    </div>
                  )}
                </div>
              )}
              
              {isDownloading && (
                <div className="download-progress-section">
                  <h5>📥 アップデートをダウンロード中...</h5>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${downloadProgress}%` }}
                    ></div>
                  </div>
                  <div className="progress-text">
                    {downloadProgress}% 完了
                  </div>
                </div>
              )}

              {updateDownloaded && (
                <div className="update-ready-section">
                  <h5>📥 手動アップデート手順</h5>
                  <p>GitHubリリースページを開きました。以下の手順でアップデートしてください：</p>
                  <ol style={{ textAlign: 'left', margin: '10px 0', paddingLeft: '20px' }}>
                    <li>新しいバージョンのファイルをダウンロード</li>
                    <li>現在のアプリを終了</li>
                    <li>ダウンロードしたファイルでアプリを置き換え</li>
                    <li>新しいバージョンでアプリを起動</li>
                  </ol>
                  <div className="restart-actions">
                    <button 
                      className="btn-primary restart-btn"
                      onClick={handleInstallAndRestart}
                    >
                      🔄 アプリを再起動（手動置き換え後）
                    </button>
                    <button 
                      className="btn-secondary" 
                      onClick={() => {
                        setUpdateDownloaded(false);
                        setUpdateInfo(null);
                      }}
                    >
                      後で実行
                    </button>
                  </div>
                </div>
              )}
              
              {!isDownloading && !updateDownloaded && (
                <div className="update-actions">
                  <button 
                    className="btn-primary update-btn"
                    onClick={handleDownloadUpdate}
                    disabled={isDownloading}
                  >
                    ⬇️ アップデートをダウンロード
                  </button>
                  <button className="btn-secondary" onClick={() => setUpdateInfo(null)}>
                    後で更新
                  </button>
                </div>
              )}
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
              onClick={handleSaveConfig}
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