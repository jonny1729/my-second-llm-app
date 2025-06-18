import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApiStore } from '../stores/apiStore';
import UpdateSettings from './UpdateSettings';

type SettingsTab = 'api' | 'update' | 'app' | 'data';

const Settings: React.FC = () => {
  const { 
    apiSettings, 
    isLoading, 
    loadApiSettings, 
    updateApiSetting, 
    isApiConfigured,
    hasAnyActiveApi 
  } = useApiStore();

  const [activeTab, setActiveTab] = useState<SettingsTab>('api');
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({
    gemini: '',
    openai: '',
    claude: ''
  });
  const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadApiSettings();
  }, [loadApiSettings]);

  const handleUpdateApiKey = async (apiName: string) => {
    const apiKey = apiKeys[apiName];
    if (!apiKey.trim()) return;

    setIsUpdating({ ...isUpdating, [apiName]: true });
    try {
      await updateApiSetting(apiName, apiKey);
      setApiKeys({ ...apiKeys, [apiName]: '' });
    } catch (error) {
      console.error(`${apiName} APIキーの更新に失敗:`, error);
      alert('APIキーの更新に失敗しました。');
    } finally {
      setIsUpdating({ ...isUpdating, [apiName]: false });
    }
  };

  const getApiStatus = (apiName: string) => {
    return isApiConfigured(apiName) ? 'configured' : 'not-configured';
  };

  const getMaskedApiKey = (apiKey: string) => {
    if (!apiKey || apiKey.length < 8) return '';
    return apiKey.substring(0, 4) + '••••••••' + apiKey.substring(apiKey.length - 4);
  };

  const toggleApiKeyVisibility = (apiName: string) => {
    setShowApiKey({ ...showApiKey, [apiName]: !showApiKey[apiName] });
  };

  const getApiInstructions = (apiName: string) => {
    switch (apiName) {
      case 'gemini':
        return {
          name: 'Google Gemini',
          instructions: 'Google AI Studioでプロジェクトを作成し、APIキーを取得してください。',
          url: 'https://aistudio.google.com/app/apikey'
        };
      case 'openai':
        return {
          name: 'OpenAI',
          instructions: 'OpenAIアカウントでAPIキーを作成してください。',
          url: 'https://platform.openai.com/api-keys'
        };
      case 'claude':
        return {
          name: 'Anthropic Claude',
          instructions: 'Anthropic Consoleでワークスペースを作成し、APIキーを取得してください。',
          url: 'https://console.anthropic.com/'
        };
      default:
        return { name: apiName, instructions: '', url: '' };
    }
  };

  const handleCheckForUpdates = () => {
    // IPCを使ってアップデートチェック（実装時に追加）
    // window.electronAPI.checkForUpdates();
    console.log('Checking for updates...');
    alert('アップデートチェック機能は実装中です');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'api':
        return renderApiSettings();
      case 'update':
        return <UpdateSettings onCheckForUpdates={handleCheckForUpdates} />;
      case 'app':
        return renderAppSettings();
      case 'data':
        return renderDataManagement();
      default:
        return renderApiSettings();
    }
  };

  const renderApiSettings = () => (
    <div className="settings-section">
      <h3>🤖 AI API設定</h3>
      <p className="section-description">
        AI支援機能を利用するためにAPIキーを設定してください。
        設定後、タスク経験値の自動評価、タスク提案、日記分析などが利用できます。
      </p>

      <div className="api-cards">
        {['gemini', 'openai', 'claude'].map((apiName) => {
          const apiInfo = getApiInstructions(apiName);
          const status = getApiStatus(apiName);
          const currentSetting = apiSettings.find(s => s.api_name === apiName);

          return (
            <motion.div
              key={apiName}
              className={`api-card ${status}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ['gemini', 'openai', 'claude'].indexOf(apiName) * 0.1 }}
            >
              <div className="api-card-header">
                <h4>{apiInfo.name}</h4>
                <div className={`status-badge ${status}`}>
                  {status === 'configured' ? '設定済み' : '未設定'}
                </div>
              </div>

              <p className="api-instructions">{apiInfo.instructions}</p>
              
              {apiInfo.url && (
                <a 
                  href={apiInfo.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="api-link"
                >
                  APIキーを取得 →
                </a>
              )}

              {currentSetting && currentSetting.api_key && (
                <div className="current-api-key">
                  <label>現在のAPIキー:</label>
                  <div className="api-key-display">
                    <span>
                      {showApiKey[apiName] 
                        ? currentSetting.api_key 
                        : getMaskedApiKey(currentSetting.api_key)
                      }
                    </span>
                    <button
                      className="toggle-visibility"
                      onClick={() => toggleApiKeyVisibility(apiName)}
                    >
                      {showApiKey[apiName] ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
              )}

              <div className="api-input-group">
                <input
                  type="password"
                  placeholder={`${apiInfo.name} APIキーを入力`}
                  value={apiKeys[apiName]}
                  onChange={(e) => setApiKeys({ ...apiKeys, [apiName]: e.target.value })}
                  className="api-input"
                />
                <button
                  className="btn-primary"
                  onClick={() => handleUpdateApiKey(apiName)}
                  disabled={!apiKeys[apiName].trim() || isUpdating[apiName]}
                >
                  {isUpdating[apiName] ? '更新中...' : '設定'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  const renderAppSettings = () => (
    <div className="settings-section">
      <h3>🎮 アプリ設定</h3>
      <div className="app-settings">
        <div className="setting-item">
          <label>レベルアップ通知</label>
          <div className="setting-control">
            <input type="checkbox" defaultChecked />
            <span>レベルアップ時にアニメーションを表示</span>
          </div>
        </div>
        
        <div className="setting-item">
          <label>経験値アニメーション</label>
          <div className="setting-control">
            <input type="checkbox" defaultChecked />
            <span>タスク完了時にエフェクトを表示</span>
          </div>
        </div>

        <div className="setting-item">
          <label>自動保存</label>
          <div className="setting-control">
            <input type="checkbox" defaultChecked />
            <span>データを自動的に保存</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDataManagement = () => (
    <div className="settings-section">
      <h3>📊 データ管理</h3>
      <div className="data-management">
        <button className="btn-secondary">
          📁 データをバックアップ
        </button>
        <button className="btn-secondary">
          📥 データを復元
        </button>
        <button className="btn-danger">
          🗑️ 全データを削除
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="settings-container">
        <div className="loading">設定を読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>⚙️ 設定</h2>
        {hasAnyActiveApi() && (
          <motion.div
            className="api-status-success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            ✅ AI機能が利用可能です
          </motion.div>
        )}
      </div>

      {/* タブナビゲーション */}
      <div className="settings-tabs">
        <button
          className={`settings-tab ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          <span>🤖</span>
          AI設定
        </button>
        <button
          className={`settings-tab ${activeTab === 'update' ? 'active' : ''}`}
          onClick={() => setActiveTab('update')}
        >
          <span>🔄</span>
          アップデート
        </button>
        <button
          className={`settings-tab ${activeTab === 'app' ? 'active' : ''}`}
          onClick={() => setActiveTab('app')}
        >
          <span>🎮</span>
          アプリ
        </button>
        <button
          className={`settings-tab ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          <span>📊</span>
          データ
        </button>
      </div>

      {/* タブコンテンツ */}
      <div className="settings-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            className="settings-tab-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Settings;