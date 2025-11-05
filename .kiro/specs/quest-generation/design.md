# 設計書：日次クエスト生成機能

## 概要

日次クエスト生成機能は、ユーザーの長期目標達成を支援するため、毎日午前4時（ユーザーのタイムゾーン）に自動的に3つのクエスト（小・中・検証）を生成する。過去のクエスト履歴から学習し、ユーザーの成功パターンと好みに適応したクエストを提供する。ユーザーは「いつもと違う日」機能で必要に応じて調整できる。

## アーキテクチャ

### システム構成

```
┌─────────────────────────────────────────┐
│   スケジューラー（Cron/Cloud Scheduler）  │
│   - 毎日AM 4:00にトリガー               │
│   - ユーザーごとのタイムゾーン対応        │
└─────────────────────────────────────────┘
              ↓ HTTP POST
┌─────────────────────────────────────────┐
│   バックエンドAPI                         │
│   - クエスト生成エンドポイント            │
│   - 学習エンジン                         │
│   - パターン分析                         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   LLM（クエスト生成）                     │
│   - GPT-4 / Claude                      │
│   - プロンプトエンジニアリング            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   データベース                            │
│   - Quest                               │
│   - QuestLog                            │
│   - SuccessPattern                      │
│   - FailurePattern                      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   ChatGPT Apps SDK（表示）               │
│   - 生成されたクエストを表示              │
│   - 「いつもと違う日」調整UI              │
└─────────────────────────────────────────┘
```

### 技術スタック

- **スケジューラー**: Cron / AWS EventBridge / Google Cloud Scheduler
- **バックエンド**: Node.js / Python
- **LLM**: OpenAI GPT-4 / Anthropic Claude
- **データベース**: PostgreSQL（リレーショナルデータ） + Redis（キャッシュ）
- **フロントエンド**: ChatGPT Apps SDK
- **通信**: MCP (Model Context Protocol)

## コンポーネントとインターフェース

### 1. スケジューラーコンポーネント

#### DailyQuestScheduler
毎日午前4時にユーザーごとのクエスト生成をトリガーする。

**主要機能:**
- ユーザーのタイムゾーンを考慮したスケジューリング
- バッチ処理（複数ユーザーの並列処理）
- エラーハンドリングとリトライ
- 生成失敗時の通知

**実装例（Cron式）:**
```
0 4 * * * # 毎日午前4時
```

**処理フロー:**
1. アクティブユーザーリストを取得
2. 各ユーザーのタイムゾーンをチェック
3. 該当ユーザーのクエスト生成APIを呼び出し
4. 生成結果をログに記録

### 2. 学習エンジンコンポーネント

#### PatternAnalyzer
過去のクエスト履歴から成功パターンと失敗パターンを分析する。

**分析項目:**
```typescript
interface SuccessPattern {
  userId: string;
  questType: 'small' | 'medium' | 'validation';
  successRate: number;
  preferredTimeOfDay: string;
  preferredDifficulty: 'easy' | 'medium' | 'challenging';
  preferredDuration: number; // 分
  preferredQuestStyle: 'practical' | 'theoretical' | 'mixed';
  lastUpdated: Date;
}

interface FailurePattern {
  userId: string;
  commonFailureReasons: string[];
  problematicQuestTypes: string[];
  problematicDaysOfWeek: number[];
  commonObstacles: string[];
  lastUpdated: Date;
}
```

**分析アルゴリズム:**
1. 過去30日間のクエストログを取得
2. 成功率を計算（完了/全体）
3. クエストタイプ別の成功率を算出
4. 時間帯、難易度、長さごとの成功率を分析
5. 失敗理由の頻度を集計
6. パターンをデータベースに保存

### 3. クエスト生成エンジン

#### QuestGenerator
LLMを使用してユーザーに最適なクエストを生成する。

**入力データ:**
```typescript
interface QuestGenerationInput {
  userId: string;
  goal: Goal;
  currentStation: number; // 1-10
  userProfile: UserProfile;
  dailyCommitTime: string;
  successPattern: SuccessPattern;
  failurePattern: FailurePattern;
  previousLog: QuestLog | null;
  adjustments?: {
    availableTime?: string;
    energyLevel?: 'high' | 'normal' | 'low';
    environment?: string;
  };
}
```

**出力データ:**
```typescript
interface QuestBundle {
  id: string;
  userId: string;
  generatedAt: Date;
  validUntil: Date;
  quests: [SmallQuest, MediumQuest, ValidationQuest];
  totalEstimatedTime: number; // 分
  difficulty: 'easy' | 'medium' | 'challenging';
}

interface Quest {
  id: string;
  type: 'small' | 'medium' | 'validation';
  title: string;
  description: string;
  estimatedTime: number; // 分
  difficulty: 'easy' | 'medium' | 'challenging';
  completionCriteria: string;
  evidenceType: 'screenshot' | 'note' | 'artifact' | 'none';
  contributesToStation: number;
  order: number; // 推奨実行順序
}
```

**LLMプロンプト構造:**
```
あなたは目標達成支援AIです。以下の情報に基づいて、ユーザーに最適な3つのクエストを生成してください。

【ユーザー情報】
- 長期目標: {goal.title}
- 現在の進捗: {currentStation}合目/10合目
- 1日のコミット時間: {dailyCommitTime}
- スキルレベル: {userProfile.skillLevel}

【成功パターン】
- 成功率の高いクエストタイプ: {successPattern.questType}
- 好みの難易度: {successPattern.preferredDifficulty}
- 好みの時間: {successPattern.preferredDuration}分

【失敗パターン】
- よくある失敗理由: {failurePattern.commonFailureReasons}
- 避けるべきクエストタイプ: {failurePattern.problematicQuestTypes}

【前日の状況】
- 達成状況: {previousLog.status}
- 見送り理由: {previousLog.skipReason}

【生成ルール】
1. 小クエスト（15-30分）、中クエスト（30-60分）、検証クエスト（10-20分）を1つずつ
2. 合計時間は{dailyCommitTime}以内
3. 成功パターンに沿った内容
4. 失敗パターンを避ける
5. 前日の状況を考慮して難易度調整

【出力形式】
JSON形式で3つのクエストを返してください。
```

### 4. MCPツール定義

#### quest.generate
クエストを生成する（自動生成とユーザー調整の両方で使用）。

**入力スキーマ:**
```json
{
  "name": "quest.generate",
  "description": "ユーザーに最適な日次クエストを生成する",
  "inputSchema": {
    "type": "object",
    "properties": {
      "userId": { "type": "string" },
      "adjustments": {
        "type": "object",
        "properties": {
          "availableTime": { "type": "string" },
          "energyLevel": { "type": "string", "enum": ["high", "normal", "low"] },
          "environment": { "type": "string" }
        }
      }
    },
    "required": ["userId"]
  }
}
```

**出力スキーマ:**
```json
{
  "type": "object",
  "properties": {
    "questBundle": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "quests": {
          "type": "array",
          "items": { "$ref": "#/definitions/Quest" }
        },
        "totalEstimatedTime": { "type": "number" }
      }
    },
    "success": { "type": "boolean" }
  }
}
```

**必要なOAuthスコープ:** `quests:write`

#### quest.regenerate
特定のクエストまたは全体を再生成する。

**入力スキーマ:**
```json
{
  "name": "quest.regenerate",
  "description": "クエストを再生成する",
  "inputSchema": {
    "type": "object",
    "properties": {
      "questBundleId": { "type": "string" },
      "questId": { "type": "string", "description": "特定のクエストのみ再生成する場合" },
      "reason": { "type": "string", "enum": ["too_hard", "too_easy", "time_mismatch", "content_mismatch", "other"] }
    },
    "required": ["questBundleId", "reason"]
  }
}
```

**必要なOAuthスコープ:** `quests:write`

#### quest.postpone
クエストを保留する。

**入力スキーマ:**
```json
{
  "name": "quest.postpone",
  "description": "クエストを保留し、次回に繰り越す",
  "inputSchema": {
    "type": "object",
    "properties": {
      "questId": { "type": "string" },
      "reason": { "type": "string", "enum": ["no_time", "sick", "schedule_change", "other"] },
      "customReason": { "type": "string" }
    },
    "required": ["questId", "reason"]
  }
}
```

**必要なOAuthスコープ:** `quests:write`

### 5. バックエンドAPI エンドポイント

#### POST /api/v1/quests/generate
クエストを生成する（スケジューラーまたはユーザーから呼び出し）。

**リクエスト:**
```json
{
  "userId": "user_123",
  "adjustments": {
    "availableTime": "30分",
    "energyLevel": "low",
    "environment": "移動中"
  }
}
```

**レスポンス:**
```json
{
  "questBundle": {
    "id": "qb_789",
    "userId": "user_123",
    "generatedAt": "2025-10-19T04:00:00Z",
    "validUntil": "2025-10-19T23:59:59Z",
    "quests": [
      {
        "id": "q_001",
        "type": "small",
        "title": "TOEIC単語10個を復習",
        "description": "昨日学習した単語を音声で復習する",
        "estimatedTime": 15,
        "difficulty": "easy",
        "completionCriteria": "10個全て正しく発音できる",
        "evidenceType": "note",
        "contributesToStation": 3,
        "order": 1
      },
      {
        "id": "q_002",
        "type": "medium",
        "title": "リスニング問題5問を解く",
        "description": "Part 2の問題を5問解き、解説を読む",
        "estimatedTime": 30,
        "difficulty": "medium",
        "completionCriteria": "5問中4問以上正解",
        "evidenceType": "screenshot",
        "contributesToStation": 3,
        "order": 2
      },
      {
        "id": "q_003",
        "type": "validation",
        "title": "今週の学習を振り返る",
        "description": "学習した内容を3つ書き出す",
        "estimatedTime": 10,
        "difficulty": "easy",
        "completionCriteria": "3つ以上書き出す",
        "evidenceType": "note",
        "contributesToStation": 3,
        "order": 3
      }
    ],
    "totalEstimatedTime": 55
  },
  "success": true
}
```

#### POST /api/v1/quests/regenerate
クエストを再生成する。

**リクエスト:**
```json
{
  "questBundleId": "qb_789",
  "questId": "q_002",
  "reason": "too_hard"
}
```

**レスポンス:**
```json
{
  "quest": {
    "id": "q_004",
    "type": "medium",
    "title": "リスニング問題3問を解く",
    "description": "Part 1の問題を3問解く",
    "estimatedTime": 20,
    "difficulty": "easy",
    "completionCriteria": "3問中2問以上正解",
    "evidenceType": "screenshot",
    "contributesToStation": 3,
    "order": 2
  },
  "success": true
}
```

#### POST /api/v1/quests/postpone
クエストを保留する。

**リクエスト:**
```json
{
  "questId": "q_002",
  "reason": "no_time",
  "customReason": "急な会議が入った"
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "クエストを保留しました。次回優先的に提案します。",
  "validUntil": "2025-10-26T23:59:59Z"
}
```

#### GET /api/v1/quests/today
今日のクエストを取得する。

**レスポンス:**
```json
{
  "questBundle": { /* questBundle object */ },
  "success": true
}
```

#### POST /api/v1/patterns/analyze
ユーザーの成功・失敗パターンを分析する（バッチ処理で定期実行）。

**リクエスト:**
```json
{
  "userId": "user_123"
}
```

**レスポンス:**
```json
{
  "successPattern": {
    "questType": "small",
    "successRate": 0.85,
    "preferredTimeOfDay": "morning",
    "preferredDifficulty": "medium",
    "preferredDuration": 30
  },
  "failurePattern": {
    "commonFailureReasons": ["time_shortage", "too_difficult"],
    "problematicQuestTypes": ["validation"],
    "problematicDaysOfWeek": [1, 5]
  },
  "success": true
}
```

## データモデル

### Quest テーブル
```sql
CREATE TABLE quests (
  id VARCHAR(255) PRIMARY KEY,
  quest_bundle_id VARCHAR(255) NOT NULL REFERENCES quest_bundles(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('small', 'medium', 'validation')),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  estimated_time INTEGER NOT NULL,
  difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'challenging')),
  completion_criteria TEXT NOT NULL,
  evidence_type VARCHAR(50) NOT NULL,
  contributes_to_station INTEGER NOT NULL CHECK (contributes_to_station >= 1 AND contributes_to_station <= 10),
  execution_order INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'postponed')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### QuestBundle テーブル
```sql
CREATE TABLE quest_bundles (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  generated_at TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  total_estimated_time INTEGER NOT NULL,
  difficulty VARCHAR(50) NOT NULL,
  is_adjusted BOOLEAN DEFAULT FALSE,
  adjustments JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### QuestLog テーブル
```sql
CREATE TABLE quest_logs (
  id VARCHAR(255) PRIMARY KEY,
  quest_id VARCHAR(255) NOT NULL REFERENCES quests(id),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  status VARCHAR(50) NOT NULL CHECK (status IN ('completed', 'skipped', 'postponed')),
  skip_reason VARCHAR(200),
  obstacle TEXT,
  evidence_url TEXT,
  evidence_note TEXT,
  actual_time INTEGER,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### SuccessPattern テーブル
```sql
CREATE TABLE success_patterns (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  quest_type VARCHAR(50),
  success_rate DECIMAL(3, 2),
  preferred_time_of_day VARCHAR(50),
  preferred_difficulty VARCHAR(50),
  preferred_duration INTEGER,
  preferred_quest_style VARCHAR(50),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);
```

### FailurePattern テーブル
```sql
CREATE TABLE failure_patterns (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  common_failure_reasons JSONB,
  problematic_quest_types JSONB,
  problematic_days_of_week JSONB,
  common_obstacles JSONB,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);
```

### PostponedQuest テーブル
```sql
CREATE TABLE postponed_quests (
  id VARCHAR(255) PRIMARY KEY,
  quest_id VARCHAR(255) NOT NULL REFERENCES quests(id),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  postponed_at TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  reason VARCHAR(200),
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## エラーハンドリング

### スケジューラーエラー
1. **生成失敗** - リトライ（最大3回）、失敗時は管理者に通知
2. **タイムアウト** - 60秒でタイムアウト、次回に再試行
3. **LLMエラー** - フォールバック（テンプレートベースの生成）

### ユーザー調整エラー
1. **無効な入力** - バリデーションエラーメッセージを表示
2. **再生成制限超過** - 「カスタマイズ」オプションを提案
3. **ネットワークエラー** - Widget Stateに保存、再接続時に再送信

## テスト戦略

### 単体テスト
- パターン分析アルゴリズムのテスト
- クエスト生成ロジックのテスト
- スケジューラーのタイムゾーン処理テスト

### 統合テスト
- スケジューラー → API → データベースの連携テスト
- LLM呼び出しとレスポンス処理のテスト
- 学習エンジンとクエスト生成の連携テスト

### E2Eテスト
- 自動生成から表示までのフローテスト
- 「いつもと違う日」調整フローテスト
- 保留と繰越のフローテスト

## セキュリティ考慮事項

### スケジューラー
- API呼び出しに認証トークンを使用
- レート制限（ユーザーあたり1日1回）
- 不正なリクエストの検出とブロック

### データ保護
- クエスト内容の暗号化（個人情報を含む場合）
- 学習データの匿名化
- 保留クエストの自動削除（7日後）

## パフォーマンス最適化

### スケジューラー
- バッチ処理（100ユーザーずつ）
- 並列処理（最大10並列）
- タイムゾーンごとのグループ化

### LLM呼び出し
- プロンプトのキャッシング
- 類似パターンの再利用
- レスポンスタイムの監視（5秒以内）

### データベース
- クエストログのパーティショニング（月ごと）
- インデックスの最適化
- 古いログの定期削除（180日後）

## 将来の拡張性

### 高度な学習機能
- 機械学習モデルによる予測
- A/Bテストによる最適化
- ユーザー間の類似パターン分析

### 通知機能
- クエスト生成完了の通知
- リマインダー通知
- 達成率低下時のアラート

### カスタマイズ機能
- ユーザー独自のクエストテンプレート
- クエスト生成時刻の変更
- 週末モード（異なる生成ルール）
