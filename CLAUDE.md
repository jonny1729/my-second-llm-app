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