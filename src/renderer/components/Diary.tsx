import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AIButton from './AIButton';
import AIPlaceholder from './AIPlaceholder';

const Diary: React.FC = () => {
  const [diaryContent, setDiaryContent] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [moodScore, setMoodScore] = useState(5);

  const handleSaveDiary = () => {
    if (!diaryContent.trim()) return;
    
    console.log('日記保存機能は実装予定です');
    alert('日記が保存されました！（実装予定）');
    
    // TODO: 実際のデータベース保存処理
    setDiaryContent('');
  };

  const handleAIAnalysis = () => {
    console.log('AI日記分析機能は実装予定です');
    alert('APIキーを設定すると、AIが日記を分析して洞察やアドバイスを提供してくれます！');
  };

  const getMoodEmoji = (score: number) => {
    if (score <= 2) return '😢';
    if (score <= 4) return '😐';
    if (score <= 6) return '🙂';
    if (score <= 8) return '😊';
    return '😄';
  };

  return (
    <div className="diary-container">
      <div className="diary-header">
        <h2>📝 日記</h2>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="date-input"
        />
      </div>

      <div className="diary-content">
        {/* AI分析プレースホルダー */}
        <AIPlaceholder
          feature="AI日記分析"
          description="AIがあなたの日記を分析して、感情の傾向や改善アドバイスを提供します"
          icon="🧠"
          className="diary-ai-placeholder"
          onConfigureClick={() => window.location.hash = '#settings'}
        />

        <div className="diary-form">
          <div className="mood-selector">
            <label>今日の気分: {getMoodEmoji(moodScore)}</label>
            <input
              type="range"
              min="1"
              max="10"
              value={moodScore}
              onChange={(e) => setMoodScore(Number(e.target.value))}
              className="mood-slider"
            />
            <div className="mood-labels">
              <span>😢</span>
              <span>😐</span>
              <span>🙂</span>
              <span>😊</span>
              <span>😄</span>
            </div>
          </div>

          <div className="diary-editor">
            <textarea
              placeholder="今日はどんな一日でしたか？思ったこと、感じたこと、学んだことを自由に書いてみてください..."
              value={diaryContent}
              onChange={(e) => setDiaryContent(e.target.value)}
              className="diary-textarea"
              rows={8}
            />
            <div className="character-count">
              {diaryContent.length} / 1000文字
            </div>
          </div>

          <div className="diary-actions">
            <button
              onClick={handleSaveDiary}
              className="btn-primary"
              disabled={!diaryContent.trim()}
            >
              💾 日記を保存
            </button>
            
            <AIButton
              onClick={handleAIAnalysis}
              className="ai-analysis-button"
              disabled={!diaryContent.trim()}
              placeholderText="AIが日記を分析して洞察を提供"
            >
              AI分析
            </AIButton>
          </div>
        </div>

        <div className="diary-stats">
          <h3>📊 日記統計</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-number">0</span>
              <span className="stat-label">今月の日記数</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">-</span>
              <span className="stat-label">平均気分スコア</span>
            </div>
            <div className="stat-card">
              <span className="stat-number">0</span>
              <span className="stat-label">連続記録日数</span>
            </div>
          </div>
        </div>

        <div className="recent-entries">
          <h3>📚 最近の日記</h3>
          <div className="empty-state">
            <p>まだ日記がありません</p>
            <p>今日から日記を始めてみましょう！</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Diary;