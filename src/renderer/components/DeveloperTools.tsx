import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
}

const DeveloperTools: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // メインプロセスのログを受信
    if (window.electronAPI) {
      window.electronAPI.on('main-process-log', (logData: LogEntry) => {
        setLogs(prev => [...prev.slice(-99), logData]);
      });

      // アップデート進捗を監視
      window.electronAPI.on('update-download-progress', (progress: { percent: number }) => {
        console.log('📈 Download progress received:', progress.percent + '%');
        setDownloadProgress(Math.round(progress.percent || 0));
        setIsDownloading(true);
      });

      // ダウンロード完了
      window.electronAPI.on('update-downloaded', () => {
        console.log('✅ Download completed');
        setIsDownloading(false);
        setDownloadProgress(100);
      });
    }

    // 既存のコンソールメソッドをフック
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info
    };

    const addLog = (level: LogEntry['level'], args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      const logEntry: LogEntry = {
        timestamp: new Date().toLocaleTimeString('ja-JP', { 
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + '.' + String(new Date().getMilliseconds()).padStart(3, '0'),
        level,
        message,
        source: 'renderer'
      };

      setLogs(prev => [...prev.slice(-99), logEntry]); // 最新100件を保持
    };

    // コンソールメソッドをオーバーライド
    console.log = (...args) => {
      originalConsole.log(...args);
      addLog('info', args);
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      addLog('warn', args);
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      addLog('error', args);
    };

    console.info = (...args) => {
      originalConsole.info(...args);
      addLog('debug', args);
    };

    // クリーンアップ
    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
    };
  }, []);

  useEffect(() => {
    // 自動スクロール
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const clearLogs = () => {
    setLogs([]);
  };

  const openElectronDevTools = () => {
    if (window.electronAPI) {
      window.electronAPI.invoke('open-dev-tools');
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error': return '#ff6b6b';
      case 'warn': return '#ffa502';
      case 'info': return '#3742fa';
      case 'debug': return '#2ed573';
      default: return '#ffffff';
    }
  };

  const testUpdateDownload = async () => {
    console.log('🧪 Testing update download...');
    // 進捗をリセット
    setDownloadProgress(0);
    setIsDownloading(false);
    
    if (window.electronAPI) {
      try {
        console.log('Step 1: Checking for updates...');
        
        // タイムアウト付きでアップデートチェック
        const updateCheckPromise = window.electronAPI.invoke('check-for-updates');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Update check timeout after 10 seconds')), 10000)
        );
        
        const updateInfo = await Promise.race([updateCheckPromise, timeoutPromise]);
        console.log('Update check result:', updateInfo);
        
        if (updateInfo && updateInfo.hasUpdate) {
          console.log('Step 2: Starting download...');
          setIsDownloading(true);
          
          // タイムアウト付きでダウンロード
          const downloadPromise = window.electronAPI.invoke('download-and-install-update');
          const downloadTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Download timeout after 30 seconds')), 30000)
          );
          
          await Promise.race([downloadPromise, downloadTimeoutPromise]);
          console.log('Download completed successfully');
        } else {
          console.log('No updates available for download test');
        }
      } catch (error) {
        console.error('Update test failed:', error);
        setIsDownloading(false);
      }
    } else {
      console.warn('electronAPI not available');
    }
  };

  const testSimpleIPC = async () => {
    console.log('🔧 Testing simple IPC...');
    if (window.electronAPI) {
      try {
        const version = await window.electronAPI.invoke('get-app-version');
        console.log('✅ App version retrieved successfully:', version);
        console.log('🎯 IPC communication is working properly');
      } catch (error) {
        console.error('❌ Simple IPC test failed:', error);
      }
    } else {
      console.warn('⚠️ electronAPI not available');
    }
  };

  return (
    <div className="developer-tools">
      <motion.div
        className="header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>🛠️ 開発者ツール</h2>
        <p>アプリの内部動作をリアルタイムで監視・デバッグできます</p>
      </motion.div>

      <div className="dev-controls">
        <button 
          className="btn btn-primary"
          onClick={() => setIsConsoleOpen(!isConsoleOpen)}
        >
          {isConsoleOpen ? '📱 コンソールを閉じる' : '📱 コンソールを開く'}
        </button>
        
        <button 
          className="btn btn-secondary"
          onClick={openElectronDevTools}
        >
          🔧 Electron DevTools
        </button>

        <button 
          className="btn btn-info"
          onClick={testSimpleIPC}
        >
          🔧 IPC接続テスト
        </button>

        <button 
          className="btn btn-warning"
          onClick={testUpdateDownload}
          disabled={isDownloading}
        >
          {isDownloading ? `📥 ダウンロード中 (${downloadProgress}%)` : '🧪 アップデートテスト'}
        </button>

        <button 
          className="btn btn-ghost"
          onClick={clearLogs}
        >
          🗑️ ログクリア
        </button>
      </div>

      {isConsoleOpen && (
        <motion.div
          className="console-panel"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
            margin: '20px 0',
            maxHeight: '400px',
            overflow: 'hidden'
          }}
        >
          <div 
            style={{
              background: '#2d2d2d',
              padding: '10px',
              borderBottom: '1px solid #333',
              color: '#fff',
              fontWeight: 'bold'
            }}
          >
            📊 リアルタイムログ ({logs.length}/100)
          </div>
          
          <div 
            style={{
              height: '350px',
              overflowY: 'auto',
              padding: '10px',
              fontFamily: 'monospace',
              fontSize: '12px',
              lineHeight: '1.4'
            }}
          >
            {logs.length === 0 ? (
              <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                ログが記録されていません
              </div>
            ) : (
              logs.map((log, index) => (
                <div 
                  key={index}
                  style={{
                    marginBottom: '5px',
                    padding: '5px',
                    borderLeft: `3px solid ${getLogColor(log.level)}`,
                    paddingLeft: '10px',
                    backgroundColor: log.level === 'error' ? '#2d1b1b' : 
                                   log.level === 'warn' ? '#2d2a1b' : 
                                   '#1a1a1a'
                  }}
                >
                  <span style={{ color: '#666', fontSize: '11px' }}>
                    [{log.timestamp}] 
                  </span>
                  <span style={{ 
                    color: getLogColor(log.level), 
                    fontWeight: 'bold',
                    marginLeft: '5px'
                  }}>
                    {(log.level || 'UNKNOWN').toUpperCase()}
                  </span>
                  <div style={{ color: '#fff', marginTop: '2px' }}>
                    {log.message}
                  </div>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </motion.div>
      )}

      <div className="dev-info">
        <h3>📊 システム情報</h3>
        <div className="info-grid">
          <div className="info-item">
            <strong>アプリバージョン:</strong>
            <span>{process.env.NODE_ENV === 'development' ? 'Development' : 'Production'}</span>
          </div>
          <div className="info-item">
            <strong>Electron:</strong>
            <span>{process.versions?.electron || 'N/A'}</span>
          </div>
          <div className="info-item">
            <strong>Node.js:</strong>
            <span>{process.versions?.node || 'N/A'}</span>
          </div>
          <div className="info-item">
            <strong>Chrome:</strong>
            <span>{process.versions?.chrome || 'N/A'}</span>
          </div>
        </div>
      </div>

      <style>{`
        .developer-tools {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dev-controls {
          display: flex;
          gap: 10px;
          margin: 20px 0;
          flex-wrap: wrap;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: #3742fa;
          color: white;
        }

        .btn-secondary {
          background: #57606f;
          color: white;
        }

        .btn-info {
          background: #3d5af1;
          color: white;
        }

        .btn-warning {
          background: #ffa502;
          color: white;
        }

        .btn-ghost {
          background: transparent;
          color: #666;
          border: 1px solid #666;
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }

        .info-item {
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #3742fa;
        }

        .info-item strong {
          display: block;
          color: #2c3e50;
          margin-bottom: 5px;
        }

        .info-item span {
          color: #7f8c8d;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
};

export default DeveloperTools;