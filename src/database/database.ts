import * as sqlite3 from 'sqlite3';
import * as path from 'path';
import * as fs from 'fs';

class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    // データベースファイルをアプリのデータディレクトリに配置
    const userDataPath = process.env.APPDATA || 
                        (process.platform === 'darwin' ? process.env.HOME + '/Library/Application Support' : '/tmp');
    const appDataDir = path.join(userDataPath, 'RPG-Secretary');
    
    // ディレクトリが存在しない場合は作成
    if (!fs.existsSync(appDataDir)) {
      fs.mkdirSync(appDataDir, { recursive: true });
    }
    
    this.dbPath = path.join(appDataDir, 'rpg-secretary.db');
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('データベース接続エラー:', err);
          reject(err);
        } else {
          console.log('データベースに接続しました:', this.dbPath);
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  private async createTables(): Promise<void> {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    return new Promise((resolve, reject) => {
      this.db!.exec(schema, (err) => {
        if (err) {
          console.error('テーブル作成エラー:', err);
          reject(err);
        } else {
          console.log('データベーステーブルを作成しました');
          resolve();
        }
      });
    });
  }

  // ユーザー統計取得
  async getUserStats(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db!.get(
        'SELECT * FROM user_stats WHERE id = 1',
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  // ユーザー統計更新
  async updateUserStats(level: number, exp: number, totalExp: number): Promise<void> {
    const expToNext = this.calculateExpToNextLevel(level);
    return new Promise((resolve, reject) => {
      this.db!.run(
        `UPDATE user_stats 
         SET current_level = ?, current_exp = ?, exp_to_next_level = ?, total_exp = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = 1`,
        [level, exp, expToNext, totalExp],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  private calculateExpToNextLevel(level: number): number {
    // レベルアップに必要な経験値計算（指数関数的に増加）
    return Math.floor(100 * Math.pow(1.2, level - 1));
  }

  // タスク関連メソッド
  async createTask(task: {
    title: string;
    description?: string;
    priority?: number;
    dueDate?: string;
    goalId?: number;
    expReward?: number;
  }): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT INTO tasks (title, description, priority, due_date, goal_id, exp_reward) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [task.title, task.description, task.priority || 1, task.dueDate, task.goalId, task.expReward || 10],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async getAllTasks(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db!.all(
        'SELECT * FROM tasks ORDER BY priority DESC, created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async completeTask(taskId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db!.run(
        'UPDATE tasks SET is_completed = TRUE, completion_date = CURRENT_TIMESTAMP WHERE id = ?',
        [taskId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // 経験値追加
  async addExperience(sourceType: string, sourceId: number | null, expAmount: number, description: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db!.run(
        'INSERT INTO experience_logs (source_type, source_id, exp_amount, description) VALUES (?, ?, ?, ?)',
        [sourceType, sourceId, expAmount, description],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // 目標関連メソッド
  async createGoal(goal: {
    title: string;
    description?: string;
    targetDate?: string;
    priority?: number;
  }): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db!.run(
        'INSERT INTO goals (title, description, target_date, priority) VALUES (?, ?, ?, ?)',
        [goal.title, goal.description, goal.targetDate, goal.priority || 1],
        function(err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  }

  async getAllGoals(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db!.all(
        'SELECT * FROM goals ORDER BY priority DESC, created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // API設定関連
  async getApiSettings(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db!.all(
        'SELECT * FROM api_settings',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  async updateApiKey(apiName: string, apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO api_settings (api_name, api_key, is_active, updated_at) 
         VALUES (?, ?, TRUE, CURRENT_TIMESTAMP)`,
        [apiName, apiKey],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export default Database;