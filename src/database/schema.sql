-- RPG秘書アプリ データベーススキーマ

-- ユーザー統計テーブル
CREATE TABLE IF NOT EXISTS user_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    current_level INTEGER DEFAULT 1,
    current_exp INTEGER DEFAULT 0,
    exp_to_next_level INTEGER DEFAULT 100,
    total_exp INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 目標テーブル
CREATE TABLE IF NOT EXISTS goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    priority INTEGER DEFAULT 1, -- 1: 低, 2: 中, 3: 高
    is_completed BOOLEAN DEFAULT FALSE,
    completion_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- タスクテーブル
CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 1, -- 1: 低, 2: 中, 3: 高
    is_completed BOOLEAN DEFAULT FALSE,
    completion_date DATETIME,
    due_date DATETIME,
    goal_id INTEGER,
    repeat_type TEXT, -- 'none', 'daily', 'weekly', 'monthly', 'custom'
    repeat_interval INTEGER DEFAULT 1,
    next_due_date DATETIME,
    exp_reward INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (goal_id) REFERENCES goals(id)
);

-- 日記テーブル
CREATE TABLE IF NOT EXISTS diary_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    content TEXT NOT NULL,
    mood_score INTEGER, -- 1-10
    exp_gained INTEGER DEFAULT 0,
    ai_analyzed BOOLEAN DEFAULT FALSE,
    ai_feedback TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 経験値ログテーブル
CREATE TABLE IF NOT EXISTS experience_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_type TEXT NOT NULL, -- 'task', 'diary', 'goal', 'manual'
    source_id INTEGER,
    exp_amount INTEGER NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- カレンダーイベントテーブル
CREATE TABLE IF NOT EXISTS calendar_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATETIME NOT NULL,
    end_date DATETIME,
    event_type TEXT DEFAULT 'event', -- 'event', 'deadline', 'reminder'
    is_all_day BOOLEAN DEFAULT FALSE,
    task_id INTEGER,
    goal_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (goal_id) REFERENCES goals(id)
);

-- LLM使用履歴テーブル
CREATE TABLE IF NOT EXISTS llm_interactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    interaction_type TEXT NOT NULL, -- 'exp_evaluation', 'task_suggestion', 'diary_analysis'
    input_text TEXT,
    output_text TEXT,
    api_used TEXT, -- 'gemini', 'openai', etc.
    tokens_used INTEGER,
    cost REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- API設定テーブル
CREATE TABLE IF NOT EXISTS api_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_name TEXT NOT NULL UNIQUE, -- 'gemini', 'openai'
    api_key TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    model_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 初期データ挿入
INSERT OR IGNORE INTO user_stats (id, current_level, current_exp, exp_to_next_level, total_exp) 
VALUES (1, 1, 0, 100, 0);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_date ON diary_entries(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_start_date ON calendar_events(start_date);
CREATE INDEX IF NOT EXISTS idx_experience_logs_created_at ON experience_logs(created_at);