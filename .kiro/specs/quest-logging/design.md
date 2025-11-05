# 設計書：クエスト達成ログ機能

## 概要

クエスト達成ログ機能は、ユーザーが日次クエストを完了、見送り、または阻害された際に、その結果と証跡を記録し、登頂歩数を付与し、ストリークを更新し、日次サマリを生成する。記録されたログは、次回のクエスト生成や学習機能に活用され、ユーザーの成長パターンを分析する基盤となる。

## アーキテクチャ

### システム構成

```
┌─────────────────────────────────────────┐
│   ChatGPT Apps SDK（UI）                 │
│   - クエスト完了/見送り/阻害UI            │
│   - 証跡アップロード                      │
│   - 日次サマリ表示                       │
└─────────────────────────────────────────┘
              ↓ callTool()
┌─────────────────────────────────────────┐
│   MCPサーバー                             │
│   - quest.complete                      │
│   - quest.skip                          │
│   - quest.obstruct                      │
│   - summary.get                         │
└─────────────────────────────────────────┘
              ↓ HTTPS
┌─────────────────────────────────────────┐
│   バックエンドAPI                         │
│   - ログ記録処理                         │
│   - 歩数計算・付与                       │
│   - ストリーク更新                       │
│   - サマリ生成                           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   データベース                            │
│   - QuestLog                            │
│   - UserProgress（累計歩数・ストリーク）  │
│   - DailySummary                        │
│   - Evidence（証跡ストレージ）            │
└─────────────────────────────────────────┘
```

### 技術スタック

- **フロントエンド**: ChatGPT Apps SDK (TypeScript)
- **通信**: MCP (Model Context Protocol)
- **バックエンド**: Node.js / Python
- **データベース**: PostgreSQL
- **ストレージ**: AWS S3 / Google Cloud Storage（証跡保存）
- **API**: RESTful API

## コンポーネントとインターフェース

### 1. Apps SDK コンポーネント

#### QuestCompletionFlow
クエスト完了の記録フローを管理する。

**主要メソッド:**
- `recordCompletion()`: 完了を記録
- `uploadEvidence()`: 証跡をアップロード
- `inputActualTime()`: 実際の所要時間を入力
- `displayStepsEarned()`: 獲得歩数を表示

#### QuestSkipFlow
クエスト見送りの記録フローを管理する。

**主要メソッド:**
- `recordSkip()`: 見送りを記録
- `selectSkipReason()`: 見送り理由を選択
- `inputSkipDetails()`: 詳細メモを入力

#### QuestObstructionFlow
クエスト阻害の記録フローを管理する。

**主要メソッド:**
- `recordObstruction()`: 阻害を記録
- `selectObstacle()`: 阻害要因を選択
- `inputContingencyPlan()`: 対処計画を入力

#### DailySummaryView
日次サマリを表示する。

**主要メソッド:**
- `generateSummary()`: サマリを生成
- `displayStats()`: 統計を表示
- `showProgressToNextStation()`: 次の合目までの進捗を表示

### 2. MCPツール定義

#### quest.complete
クエスト完了を記録する。

**入力スキーマ:**
```json
{
  "name": "quest.complete",
  "description": "クエストの完了を記録し、歩数を付与する",
  "inputSchema": {
    "type": "object",
    "properties": {
      "questId": { "type": "string" },
      "userId": { "type": "string" },
      "actualTime": { "type": "number", "description": "実際の所要時間（分）" },
      "evidence": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["screenshot", "note", "artifact", "none"] },
          "content": { "type": "string", "description": "証跡の内容またはURL" }
        }
      },
      "memo": { "type": "string", "description": "一言メモ（オプション）" }
    },
    "required": ["questId", "userId"]
  }
}
```

**出力スキーマ:**
```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "stepsEarned": { "type": "number", "description": "獲得した歩数" },
    "totalSteps": { "type": "number", "description": "累計歩数" },
    "streakUpdated": { "type": "boolean" },
    "currentStreak": { "type": "number" },
    "message": { "type": "string" }
  }
}
```

**必要なOAuthスコープ:** `quests:write`, `progress:write`

#### quest.skip
クエスト見送りを記録する。

**入力スキーマ:**
```json
{
  "name": "quest.skip",
  "description": "クエストの見送りを記録する",
  "inputSchema": {
    "type": "object",
    "properties": {
      "questId": { "type": "string" },
      "userId": { "type": "string" },
      "reason": { 
        "type": "string", 
        "enum": ["no_time", "too_difficult", "low_motivation", "sick", "other"]
      },
      "customReason": { "type": "string", "description": "その他の理由（自由記入）" },
      "memo": { "type": "string", "description": "詳細メモ（オプション）" }
    },
    "required": ["questId", "userId", "reason"]
  }
}
```

**出力スキーマ:**
```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "streakMaintained": { "type": "boolean" },
    "message": { "type": "string" }
  }
}
```

**必要なOAuthスコープ:** `quests:write`

#### quest.obstruct
クエスト阻害を記録する。

**入力スキーマ:**
```json
{
  "name": "quest.obstruct",
  "description": "クエストの阻害を記録する",
  "inputSchema": {
    "type": "object",
    "properties": {
      "questId": { "type": "string" },
      "userId": { "type": "string" },
      "obstacle": { 
        "type": "string", 
        "enum": ["schedule_change", "environment_issue", "resource_unavailable", "technical_problem", "other"]
      },
      "customObstacle": { "type": "string", "description": "その他の阻害要因（自由記入）" },
      "details": { "type": "string", "description": "阻害要因の詳細" },
      "contingencyPlan": { "type": "string", "description": "次回の対処計画" }
    },
    "required": ["questId", "userId", "obstacle"]
  }
}
```

**出力スキーマ:**
```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "message": { "type": "string" }
  }
}
```

**必要なOAuthスコープ:** `quests:write`

#### summary.getDaily
日次サマリを取得する。

**入力スキーマ:**
```json
{
  "name": "summary.getDaily",
  "description": "指定日の日次サマリを取得する",
  "inputSchema": {
    "type": "object",
    "properties": {
      "userId": { "type": "string" },
      "date": { "type": "string", "format": "date", "description": "YYYY-MM-DD形式" }
    },
    "required": ["userId", "date"]
  }
}
```

**出力スキーマ:**
```json
{
  "type": "object",
  "properties": {
    "summary": {
      "type": "object",
      "properties": {
        "date": { "type": "string" },
        "completedCount": { "type": "number" },
        "skippedCount": { "type": "number" },
        "obstructedCount": { "type": "number" },
        "stepsEarned": { "type": "number" },
        "currentStreak": { "type": "number" },
        "completionRate": { "type": "number" },
        "progressToNextStation": { "type": "string" }
      }
    },
    "success": { "type": "boolean" }
  }
}
```

**必要なOAuthスコープ:** `progress:read`

### 3. バックエンドAPI エンドポイント

#### POST /api/v1/quests/:questId/complete
クエスト完了を記録する。

**リクエスト:**
```json
{
  "userId": "user_123",
  "actualTime": 25,
  "evidence": {
    "type": "screenshot",
    "content": "https://storage.example.com/evidence/abc123.png"
  },
  "memo": "思ったより簡単でした"
}
```

**レスポンス:**
```json
{
  "success": true,
  "stepsEarned": 100,
  "totalSteps": 1250,
  "streakUpdated": true,
  "currentStreak": 7,
  "message": "+100歩登りました！"
}
```

**処理フロー:**
1. クエスト情報を取得（難易度、タイプ）
2. 歩数を計算（難易度に応じて50/100/150歩）
3. ユーザーの累計歩数を更新
4. ストリークを更新
5. ログをデータベースに保存
6. 合目到達チェック（Milestone Management Systemに通知）

#### POST /api/v1/quests/:questId/skip
クエスト見送りを記録する。

**リクエスト:**
```json
{
  "userId": "user_123",
  "reason": "no_time",
  "memo": "急な会議が入った"
}
```

**レスポンス:**
```json
{
  "success": true,
  "streakMaintained": true,
  "message": "明日は頑張りましょう"
}
```

#### POST /api/v1/quests/:questId/obstruct
クエスト阻害を記録する。

**リクエスト:**
```json
{
  "userId": "user_123",
  "obstacle": "environment_issue",
  "details": "カフェが混雑していて集中できなかった",
  "contingencyPlan": "次回は朝の時間帯に行く"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "次回は対策を立てましょう"
}
```

#### GET /api/v1/users/:userId/summary/daily?date=2025-10-19
日次サマリを取得する。

**レスポンス:**
```json
{
  "summary": {
    "date": "2025-10-19",
    "completedCount": 2,
    "skippedCount": 1,
    "obstructedCount": 0,
    "stepsEarned": 200,
    "currentStreak": 7,
    "completionRate": 66.67,
    "progressToNextStation": "3合目まであと300歩"
  },
  "success": true
}
```

## データモデル

### QuestLog テーブル
```sql
CREATE TABLE quest_logs (
  id VARCHAR(255) PRIMARY KEY,
  quest_id VARCHAR(255) NOT NULL REFERENCES quests(id),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  status VARCHAR(50) NOT NULL CHECK (status IN ('completed', 'skipped', 'obstructed')),
  actual_time INTEGER,
  skip_reason VARCHAR(200),
  skip_memo TEXT,
  obstacle VARCHAR(200),
  obstacle_details TEXT,
  contingency_plan TEXT,
  evidence_type VARCHAR(50),
  evidence_url TEXT,
  evidence_note TEXT,
  memo TEXT,
  steps_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### UserProgress テーブル
```sql
CREATE TABLE user_progress (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) UNIQUE,
  total_steps INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  freeze_days_remaining INTEGER DEFAULT 1,
  freeze_days_reset_at TIMESTAMP,
  last_activity_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### DailySummary テーブル
```sql
CREATE TABLE daily_summaries (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  completed_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  obstructed_count INTEGER DEFAULT 0,
  steps_earned INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  completion_rate DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);
```

### Evidence テーブル（証跡ストレージ）
```sql
CREATE TABLE evidence (
  id VARCHAR(255) PRIMARY KEY,
  quest_log_id VARCHAR(255) NOT NULL REFERENCES quest_logs(id),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('screenshot', 'note', 'artifact')),
  storage_url TEXT,
  content TEXT,
  file_size INTEGER,
  mime_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 歩数計算ロジック

### 基本歩数
```typescript
function calculateSteps(quest: Quest): number {
  let steps = 0;
  
  // 難易度による基本歩数
  switch (quest.difficulty) {
    case 'easy':
      steps = 50;
      break;
    case 'medium':
      steps = 100;
      break;
    case 'challenging':
      steps = 150;
      break;
  }
  
  // 検証クエストの場合
  if (quest.type === 'validation') {
    steps = 30;
  }
  
  return steps;
}
```

### ボーナス歩数
```typescript
function calculateBonusSteps(userId: string, date: string): number {
  const completedQuests = getCompletedQuestsForDay(userId, date);
  const totalQuests = getTotalQuestsForDay(userId, date);
  
  // 全クエスト完了ボーナス
  if (completedQuests === totalQuests && totalQuests > 0) {
    return 50; // コンプリートボーナス
  }
  
  return 0;
}
```

## ストリーク更新ロジック

```typescript
function updateStreak(userId: string, date: string): StreakUpdate {
  const userProgress = getUserProgress(userId);
  const yesterday = subtractDays(date, 1);
  const yesterdayLogs = getQuestLogsForDay(userId, yesterday);
  
  // 前日のクエスト状況を確認
  const allCompleted = yesterdayLogs.every(log => log.status === 'completed');
  const allSkippedOrObstructed = yesterdayLogs.every(log => 
    log.status === 'skipped' || log.status === 'obstructed'
  );
  
  if (allCompleted) {
    // 全完了：ストリーク継続
    userProgress.current_streak += 1;
    userProgress.max_streak = Math.max(userProgress.max_streak, userProgress.current_streak);
  } else if (allSkippedOrObstructed) {
    // 全見送り/阻害：ストリークリセット
    userProgress.current_streak = 0;
  }
  // 部分達成：ストリーク維持（リセットしない）
  
  return {
    currentStreak: userProgress.current_streak,
    maxStreak: userProgress.max_streak,
    updated: true
  };
}
```

## エラーハンドリング

### クライアント側
1. **証跡アップロード失敗** - リトライ機能、ローカル保存
2. **ネットワークエラー** - Widget Stateに保存、再接続時に再送信
3. **入力検証エラー** - リアルタイムバリデーション、エラーメッセージ表示

### サーバー側
1. **重複記録防止** - questId + userId のユニーク制約
2. **トランザクション管理** - 歩数付与とログ記録を同一トランザクションで実行
3. **ストレージエラー** - 証跡保存失敗時もログは記録（証跡なしとして）

## テスト戦略

### 単体テスト
- 歩数計算ロジックのテスト
- ストリーク更新ロジックのテスト
- ボーナス計算のテスト

### 統合テスト
- クエスト完了フローのテスト
- 証跡アップロードのテスト
- サマリ生成のテスト

### E2Eテスト
- 完了→見送り→阻害の一連のフローテスト
- ストリーク維持・リセットのテスト
- 日次サマリ表示のテスト

## セキュリティ考慮事項

### 証跡ストレージ
- 署名付きURLの使用（一時的なアクセス権限）
- ファイルサイズ制限（10MB）
- 許可されたMIMEタイプのみ受付
- ウイルススキャン

### データ保護
- 個人情報の暗号化
- アクセスログの記録
- 180日後の自動削除

## パフォーマンス最適化

### データベース
- quest_logs テーブルのインデックス（user_id, created_at）
- user_progress テーブルのキャッシング（Redis）
- 日次サマリの事前計算

### ストレージ
- CDNの使用（証跡配信）
- 画像の自動圧縮
- サムネイル生成

## 将来の拡張性

### 高度な分析
- 時間帯別の達成率分析
- クエストタイプ別の成功率
- 長期トレンドの可視化

### ソーシャル機能
- 証跡の共有機能
- 仲間との進捗比較
- グループチャレンジ
