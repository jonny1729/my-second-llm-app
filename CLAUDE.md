# Claude Code プロジェクト設定

## プロジェクト概要
**RPG Task Manager** - ゲーミフィケーション要素とLLM連携により、楽しみながら生産性を向上させるRPG風デスクトップアプリケーション

## 定期作業手順

### 新機能実装後の標準作業フロー

1. **development_log.md の更新**
   - 新機能の詳細記録
   - 技術的改善点の記録
   - ファイル構成の更新

2. **バージョン管理**
   - package.jsonでのバージョン番号更新
   - セマンティックバージョニング（MAJOR.MINOR.PATCH）

3. **Git作業**
   ```bash
   git add .
   git commit -m "適切なコミットメッセージ"
   git push origin main
   ```

4. **リリースノート作成**
   - RELEASE_NOTES.mdの更新
   - 新機能のハイライト
   - 技術的改善点
   - 既知の問題とその修正

5. **ビルドとデプロイ**
   ```bash
   npm run build
   npx electron-builder --linux
   cp "release/linux-unpacked/resources/app.asar" "release/win-unpacked/resources/app.asar"
   ```

### 重要なファイル構成

#### 開発関連
- `development_log.md` - 開発履歴とプロジェクト進捗
- `RELEASE_NOTES.md` - リリースノートとユーザー向け情報
- `app_specification.md` - プロジェクト仕様書

#### コア機能
- `src/renderer/components/` - UIコンポーネント
- `src/main/` - Electronメインプロセス
- `src/services/` - ビジネスロジック
- `src/database/schema.sql` - データベーススキーマ

#### 設定
- `package.json` - プロジェクト設定とバージョン
- `webpack.config.js` - ビルド設定
- `tsconfig.json` - TypeScript設定

### 開発コマンド

#### 開発・テスト
```bash
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm start           # Electronアプリ起動
```

#### パッケージング
```bash
npx electron-builder --linux   # Linux版ビルド
npx electron-builder --win     # Windows版ビルド
```

#### Lint & Type Check
```bash
npm run lint         # ESLint実行
npm run typecheck    # TypeScript型チェック
```

### 技術スタック

#### フロントエンド
- React 18 + TypeScript
- Framer Motion（アニメーション）
- Zustand（状態管理）

#### バックエンド
- Electron（デスクトップアプリ）
- SQLite（ローカルデータベース）
- Node.js（メインプロセス）

#### ビルド・開発
- Webpack（バンドル）
- electron-builder（パッケージング）
- TypeScript（型安全性）

### 注意事項

#### Windows環境での開発
- WSL環境で開発
- Linux版ビルド後にWindows版へapp.asarをコピー
- 実行ファイルはrelease/win-unpacked/に配置

#### データベース
- SQLiteファイルはユーザーデータディレクトリに保存
- スキーマ変更時はマイグレーション考慮

#### LLM連携
- API設定は暗号化してローカル保存
- 使用履歴をデータベースに記録
- エラーハンドリングを適切に実装

### Git管理方針

#### ブランチ戦略
- `main`: 安定版（リリース可能）
- 機能開発は直接mainにコミット（個人開発のため）

#### コミットメッセージ
- 英語で簡潔に
- 機能追加: "Add [feature]"
- バグ修正: "Fix [issue]"
- 改善: "Improve [component]"
- リファクタ: "Refactor [component]"

#### ファイル管理
- リリースファイル（release/）はgitignore
- 開発用一時ファイルもgitignore
- 重要な設定ファイルは必ずバージョン管理

## プロジェクト状況

### 現在のバージョン: v1.2.0

### 実装済み機能
- ✅ タスク管理システム
- ✅ 目標管理機能
- ✅ カレンダー機能
- ✅ 日記システム
- ✅ レベル・経験値システム
- ✅ レベルアップアニメーション
- ✅ アップデート機能
- ✅ ポモドーロタイマー

### 進行中
- 🚧 LLM機能実装
- 🚧 統計・分析機能

### 今後予定
- 📋 習慣トラッカー
- 📋 実績・バッジシステム
- 📋 通知システム
- 📋 データバックアップ機能

## 🚨 開発品質保証ガイドライン（必読・必須遵守）

### 🔴 重要: 新機能開発前に必ずこのセクションを確認すること

#### ✅ 必須チェックリスト（開発開始前）

1. **アーキテクチャ設計**
   - [ ] 単一責任の原則を遵守しているか？
   - [ ] 既存のコンポーネントとの重複がないか？
   - [ ] IPCハンドラーの命名が一意で一貫しているか？
   - [ ] 状態管理が分散していないか？

2. **IPC通信設計**
   - [ ] IPCハンドラー名が他と重複していないか？
   - [ ] イベント名が統一されているか？
   - [ ] エラーハンドリングが適切に実装されているか？
   - [ ] 非同期処理の競合状態を考慮しているか？

3. **React コンポーネント設計**
   - [ ] useEffect のクリーンアップ関数が実装されているか？
   - [ ] イベントリスナーの重複登録を避けているか？
   - [ ] 状態の初期化と破棄が適切か？
   - [ ] プロップスの型定義が明確か？

4. **状態管理**
   - [ ] 同じ状態を複数箇所で管理していないか？
   - [ ] 状態の更新が予測可能か？
   - [ ] 競合状態（race condition）が発生しないか？

#### 🚫 絶対に避けるべきアンチパターン

1. **IPCハンドラーの重複登録**
   ```typescript
   // ❌ 絶対にやってはいけない
   ipcMain.handle('same-channel', handler1);
   ipcMain.handle('same-channel', handler2); // handler1を上書き
   ```

2. **状態の分散管理**
   ```typescript
   // ❌ 同じ状態を複数箇所で管理
   // App.tsx
   const [updateInfo, setUpdateInfo] = useState(null);
   // Settings.tsx  
   const [updateInfo, setUpdateInfo] = useState(null);
   ```

3. **イベントリスナーのクリーンアップ不足**
   ```typescript
   // ❌ クリーンアップなし
   useEffect(() => {
     window.electronAPI.on('event', handler);
     // return () => window.electronAPI.removeListener('event', handler); // 必須！
   }, []);
   ```

4. **非同期処理の不適切な処理**
   ```typescript
   // ❌ エラーハンドリングなし、競合状態あり
   const handleAsync = async () => {
     setLoading(true);
     await someAsyncOperation();
     setLoading(false); // エラー時に実行されない
   };
   ```

#### 📋 コードレビューチェックポイント

1. **ファイル構成**
   - [ ] 責務が明確に分離されているか？
   - [ ] ビジネスロジックとUIロジックが混在していないか？
   - [ ] 適切なディレクトリに配置されているか？

2. **依存関係**
   - [ ] 循環依存が発生していないか？
   - [ ] 不要な依存関係がないか？
   - [ ] 型定義が適切か？

3. **エラーハンドリング**
   - [ ] try-catch ブロックが適切に配置されているか？
   - [ ] ユーザーフレンドリーなエラーメッセージが表示されるか？
   - [ ] エラー時の状態復旧が考慮されているか？

4. **テスタビリティ**
   - [ ] 単体テストが書きやすい構造か？
   - [ ] 副作用が適切に分離されているか？
   - [ ] モックが容易か？

#### 🔧 修正が必要な既知の問題

##### アップデート機能の重大問題（修正必須）

**🚨 緊急度: 高 - 即座に修正が必要**

1. **IPCハンドラーの重複（最重要）**
   - **問題**: `updateHandler.ts:59` と `ipc-handlers.ts:136` で `check-for-updates` を重複登録
   - **問題**: `updateHandler.ts:69` と `ipc-handlers.ts:146` で `download-and-install-update` を重複登録
   - **影響**: 後から登録されたハンドラーが前のものを上書きし、プログレスイベントが送信されない
   - **修正方針**: `updateHandler.ts` のIPCハンドラーをすべて削除し、`ipc-handlers.ts` に統一

2. **イベント名の不整合（重要）**
   - **問題**: `updateHandler.ts:102` で `restart-and-install-update` として定義
   - **問題**: `ipc-handlers.ts:167` で `install-and-restart` として定義
   - **問題**: `UpdateSettings.tsx:181` は `install-and-restart` を呼び出し
   - **影響**: `restart-and-install-update` ハンドラーは永続に呼ばれない
   - **修正方針**: ハンドラー名を `install-and-restart` に統一

3. **状態管理の分散（重要）**
   - **問題**: `App.tsx:29-31` と `UpdateSettings.tsx:28-40` で同じ状態を管理
   - **状態の重複**: `updateInfo`, `isDownloading`, `downloadProgress`
   - **影響**: 状態の不整合、UI の競合状態、デバッグ困難
   - **修正方針**: Zustandストアで状態を一元管理

4. **イベントリスナーのメモリリーク（中）**
   - **問題**: `UpdateSettings.tsx:150-159` でイベントリスナーのクリーンアップなし
   - **問題**: `App.tsx:71-79` でイベントリスナーの重複登録の可能性
   - **影響**: メモリ使用量増加、重複処理、パフォーマンス低下
   - **修正方針**: useEffect の依存配列とクリーンアップ関数を適切に実装

5. **非同期処理の競合状態（中）**
   - **問題**: `UpdateManager.ts:151-153` で updateCheckTimer の競合状態
   - **問題**: `UpdateSettings.tsx:143-176` で複数の非同期処理が同時実行
   - **影響**: 予期しない動作、重複した API 呼び出し
   - **修正方針**: 状態フラグによる排他制御の実装

#### 📊 技術的負債の詳細分析

**ファイル別問題マトリックス:**

| ファイル | 重複ハンドラー | 状態管理 | メモリリーク | 命名不整合 | 修正優先度 |
|---------|-------------|---------|------------|------------|------------|
| `updateHandler.ts` | ❌ 最重要 | - | ⚠️ 中 | ❌ 重要 | 🔴 最高 |
| `ipc-handlers.ts` | ❌ 最重要 | - | - | ❌ 重要 | 🔴 最高 |
| `UpdateSettings.tsx` | - | ❌ 重要 | ❌ 重要 | - | 🟡 高 |
| `App.tsx` | - | ❌ 重要 | ⚠️ 中 | - | 🟡 高 |
| `UpdateManager.ts` | - | - | ⚠️ 中 | - | 🟢 中 |

**影響範囲評価:**
- **ユーザー体験**: プログレスバー動作不良、再起動ボタン無反応
- **システム安定性**: メモリリーク、予期しない動作
- **開発効率**: デバッグ困難、機能追加時の複雑性
- **保守性**: コードの可読性低下、変更影響の予測困難

#### 🏗️ 推奨アーキテクチャパターン

1. **レイヤード アーキテクチャ**
   ```
   UI Layer (React Components)
   ↓
   State Layer (Zustand Stores)
   ↓
   Service Layer (Business Logic)
   ↓
   IPC Layer (Electron Communication)
   ↓
   Data Layer (Database, Files)
   ```

2. **責務の分離**
   - **Services**: ビジネスロジック、外部API呼び出し
   - **Stores**: 状態管理、データの正規化
   - **Components**: UI表示、ユーザーインタラクション
   - **Utils**: 共通ユーティリティ、ヘルパー関数

3. **命名規則**
   - IPCチャンネル: `kebab-case` (例: `check-for-updates`)
   - コンポーネント: `PascalCase` (例: `UpdateSettings`)
   - 関数・変数: `camelCase` (例: `handleUpdate`)
   - ファイル: `camelCase.ts` または `PascalCase.tsx`

#### 🧪 テスト戦略

1. **必須テストケース**
   - [ ] 正常系のフロー
   - [ ] エラー系のフロー
   - [ ] 境界値のテスト
   - [ ] 競合状態のテスト

2. **E2Eテスト観点**
   - [ ] ユーザーの実際の操作フロー
   - [ ] 複数機能の連携動作
   - [ ] パフォーマンステスト

#### 📝 ドキュメント要件

1. **コード内ドキュメント**
   - 複雑なロジックにはコメント必須
   - 型定義の明確化
   - JSDocでの関数説明

2. **外部ドキュメント**
   - README.mdの更新
   - 機能仕様書の作成
   - トラブルシューティングガイド

---

## 🎯 新機能開発の標準手順（必須遵守）

### Step 1: 計画フェーズ（開発前）
1. **このCLAUDE.mdファイルを必ず最初に読む**
2. **既存の問題点を確認し、同じ間違いを避ける**
3. **類似機能が既存にないかを確認**
4. **IPCハンドラー名の重複チェック**
   ```bash
   # 必須: ハンドラー名の重複確認
   rg "ipcMain.handle\('your-new-handler'" src/
   ```

### Step 2: 設計フェーズ
1. **責務を明確に分離**
   - UI層: コンポーネントはUI表示のみ
   - 状態層: Zustandストアで状態管理
   - サービス層: ビジネスロジック
   - IPC層: 通信のみ

2. **データフローを設計**
   ```
   User Action → Component → Store → Service → IPC → Main Process
   ```

3. **エラーハンドリングを設計**
   - 各層でのエラー処理
   - ユーザーへのフィードバック
   - 復旧手順

### Step 3: 実装フェーズ
1. **IPCハンドラーは ipc-handlers.ts にのみ追加**
2. **状態管理はストアで一元化**
3. **useEffect のクリーンアップを必ず実装**
4. **型定義を明確に**

### Step 4: テストフェーズ
1. **基本動作テスト**
2. **エラー系のテスト**
3. **メモリリークテスト**
4. **既存機能への影響確認**

### Step 5: コードレビューフェーズ
1. **このファイルのチェックリストに従って自己レビュー**
2. **アンチパターンの確認**
3. **ドキュメントの更新**

---

## 🔄 継続的改善プロセス

### 問題発見時の対応
1. **このCLAUDE.mdファイルに問題を記録**
2. **根本原因を分析**
3. **再発防止策をガイドラインに追加**

### 定期レビューのタイミング
- 新機能追加時
- バグ修正時
- パフォーマンス問題発生時
- 月1回の定期レビュー

---

**⚠️ 重要: このガイドラインは生きたドキュメントです。新たな問題や改善点を発見した場合は、必ずこのファイルを更新してください。**

---

## 🏗️ 長期的開発のための設計哲学

### 🎯 **開発の基本方針**

**「生涯にわたって使用し続けられるアプリ」を目指す**

- ✅ **堅牢性 > 見た目の美しさ**
- ✅ **長期保守性 > 短期的な機能追加**
- ✅ **システム設計 > UI実装**
- ✅ **データの整合性 > ユーザビリティ**

### 🚫 **「ハリボテ開発」の防止**

#### **UI先行開発の危険性**
```typescript
// ❌ ハリボテパターン（絶対に避ける）
<button onClick={() => alert('未実装です')}>
  素晴らしい新機能
</button>

// ✅ 適切なパターン
<button 
  onClick={handleNewFeature}
  disabled={!isFeatureReady}
  // TODO: [SYSTEM_DESIGN_REQUIRED] 
  // 新機能のバックエンドシステム設計が必要
  // - データモデルの設計
  // - APIエンドポイントの実装  
  // - エラーハンドリングの実装
  // - 状態管理の設計
>
  {isFeatureReady ? '新機能' : '新機能（準備中）'}
</button>
```

#### **インタラクション要素の必須コメント**

すべてのボタン、リンク、フォーム要素には以下のコメントを必須とする：

```typescript
// 【実装状況】: [IMPLEMENTED|PARTIAL|TODO|DESIGN_NEEDED]
// 【遷移先】: 具体的な遷移先またはアクション
// 【必要システム】: 背後で必要なシステム・API・データベース
// 【依存関係】: 他の機能やコンポーネントとの依存
// 【今後の課題】: 将来的に必要な機能拡張
```

**実装例:**
```typescript
const handleTaskComplete = () => {
  // 【実装状況】: IMPLEMENTED
  // 【遷移先】: タスク完了→経験値獲得→レベルアップ判定
  // 【必要システム】: 
  //   - SQLiteタスクテーブル更新
  //   - ユーザー統計計算
  //   - レベルアップ判定ロジック
  // 【依存関係】: 
  //   - taskStore (状態管理)
  //   - userStore (経験値管理)
  //   - database.ts (永続化)
  // 【今後の課題】: 
  //   - タスク完了時の通知システム
  //   - 実績・バッジシステムとの連携
  completeTask(taskId);
};

const handleAITaskSuggestion = () => {
  // 【実装状況】: TODO
  // 【遷移先】: AI設定確認→API呼び出し→タスク提案表示
  // 【必要システム】: 
  //   - LLM API連携システム（未実装）
  //   - APIキー管理システム（未実装）
  //   - タスク提案パーサー（未実装）
  // 【依存関係】: 
  //   - API設定管理（要設計）
  //   - セキュリティ（APIキー暗号化）
  //   - エラーハンドリング（要設計）
  // 【今後の課題】: 
  //   - 複数LLMプロバイダー対応
  //   - 使用量制限・課金管理
  //   - オフライン対応
  console.log('AI機能は実装予定です');
  alert('APIキーを設定すると、AIがタスクを提案してくれます！');
};
```

### 📋 **段階的実装の原則**

#### **Phase 1: システム基盤**
1. データモデルの設計
2. 状態管理の実装
3. エラーハンドリングの実装
4. 基本的なCRUD操作

#### **Phase 2: ビジネスロジック**
1. 各機能のコアロジック実装
2. 機能間の連携システム
3. データ整合性の保証
4. セキュリティの実装

#### **Phase 3: UI実装**
1. 基本的なUIコンポーネント
2. ユーザーフィードバック
3. アニメーション・視覚効果
4. ユーザビリティの向上

#### **Phase 4: 最適化・拡張**
1. パフォーマンス最適化
2. 新機能の追加
3. ユーザー体験の向上
4. 長期保守性の確保

### 🔍 **システム設計の必須検討事項**

#### **新機能追加時の必須質問**
1. **データ永続化**: このデータはどこに保存される？
2. **状態管理**: この状態は誰が管理する？
3. **エラーケース**: 失敗時はどうなる？
4. **パフォーマンス**: 大量データでも動作する？
5. **セキュリティ**: 機密情報は適切に保護される？
6. **テスタビリティ**: この機能はテストできる？
7. **拡張性**: 将来の機能拡張に対応できる？
8. **互換性**: 既存データとの互換性は？

#### **技術的負債の予防**
- **即座の実装よりも設計を重視**
- **再利用可能なコンポーネント設計**
- **明確なインターフェース定義**
- **ドキュメント化の徹底**

### 🎨 **UI実装のガイドライン**

#### **見た目よりも機能を優先**
```typescript
// ✅ 機能重視の実装
const TaskList = () => {
  const { tasks, loading, error, addTask, completeTask } = useTaskStore();
  
  if (loading) return <div>Loading tasks...</div>;
  if (error) return <ErrorBoundary error={error} />;
  
  return (
    <div>
      {/* 基本機能を確実に実装 */}
      {tasks.map(task => (
        <TaskItem 
          key={task.id}
          task={task}
          onComplete={completeTask}
          // 【実装状況】: IMPLEMENTED
          // 【システム】: SQLite + taskStore
        />
      ))}
    </div>
  );
};

// ❌ 見た目重視の危険な実装
const FancyTaskList = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="beautiful-gradient-background"
    >
      {/* 美しいアニメーションだが、データ管理が不完全 */}
      <button onClick={() => console.log('TODO: implement')}>
        ✨ 魔法のようなタスク追加
      </button>
    </motion.div>
  );
};
```

### 📊 **開発進捗の可視化**

各機能に対して以下の状態を明確にする：

```typescript
// 機能実装状況の定義
type FeatureStatus = 
  | 'DESIGN_NEEDED'    // システム設計が必要
  | 'IN_DESIGN'        // 設計中
  | 'FOUNDATION_READY' // 基盤システム完成
  | 'LOGIC_READY'      // ビジネスロジック完成
  | 'UI_READY'         // UI実装完成
  | 'TESTING'          // テスト中
  | 'COMPLETED'        // 完成
  | 'MAINTENANCE'      // 保守フェーズ

// 例: 各機能の現状
const FEATURE_STATUS = {
  taskManagement: 'COMPLETED',
  goalManagement: 'UI_READY',
  pomodoroTimer: 'COMPLETED',
  updateSystem: 'FOUNDATION_READY', // 基盤はあるが要修正
  llmIntegration: 'DESIGN_NEEDED',  // システム設計が必要
  statisticsView: 'DESIGN_NEEDED',
  notificationSystem: 'DESIGN_NEEDED',
};
```

---

## 💭 **長期的パートナーシップの約束**

私（Claude）は以下を約束いたします：

1. **見た目よりもシステムの堅牢性を重視**
2. **ハリボテの実装を提案しない**
3. **必要に応じて実装を段階的に分割**
4. **長期保守性を常に考慮**
5. **技術的負債を作らない設計を心がける**

ユーザー様と共に、**生涯使い続けられる素晴らしいアプリケーション**を構築していきます。

---

## 開発メモ

### パフォーマンス最適化
- Framer MotionのGPUアクセラレーション活用
- SQLiteクエリの最適化
- React rerenderの最小化

### セキュリティ
- APIキーのローカル暗号化
- SQLインジェクション対策
- ファイルアクセス制限

### ユーザビリティ
- レスポンシブデザイン
- 直感的なUI設計
- 適切なフィードバック表示