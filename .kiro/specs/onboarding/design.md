# 設計書：オンボーディング機能

## 概要

オンボーディング機能は、climb-youアプリケーションの初回利用時にユーザーが長期目標を設定し、10合目のマイルストンに分解し、ユーザープロファイルを構築するプロセスを提供する。本設計では、ChatGPT Apps SDK、MCP（Model Context Protocol）、外部バックエンドAPIの3層アーキテクチャを採用し、会話型UIと構造化データの両立を実現する。

## アーキテクチャ

### システム構成

```
┌─────────────────────────────────────────┐
│   ChatGPT クライアント                    │
│   ┌───────────────────────────────────┐ │
│   │  Apps SDK (iframe UI)             │ │
│   │  - window.openai API              │ │
│   │  - Widget State (軽量状態管理)     │ │
│   │  - 会話型インターフェース            │ │
│   └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
              ↓ callTool()
┌─────────────────────────────────────────┐
│   MCPサーバー                             │
│   - OAuth 2.1 + PKCE 認証               │
│   - ツール定義 (JSON Schema)             │
│   - リクエスト検証                        │
└─────────────────────────────────────────┘
              ↓ HTTPS
┌─────────────────────────────────────────┐
│   バックエンドAPI                         │
│   - 認証・認可                           │
│   - ビジネスロジック                      │
│   - データ永続化                         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   データベース                            │
│   - User                                │
│   - Goal                                │
│   - Milestone                           │
│   - UserProfile                         │
└─────────────────────────────────────────┘
```

### 技術スタック

- **フロントエンド**: ChatGPT Apps SDK (JavaScript/TypeScript)
- **通信プロトコル**: MCP (Model Context Protocol)
- **認証**: OAuth 2.1 + PKCE
- **バックエンド**: Node.js / Python (実装言語は後で決定)
- **データベース**: PostgreSQL / MongoDB (実装時に決定)
- **API**: RESTful API

## コンポーネントと インターフェース

### 1. Apps SDK コンポーネント

#### OnboardingFlow コンポーネント
会話型UIを管理し、ユーザーの入力を受け取り、MCPツールを呼び出す。

**主要メソッド:**
- `startOnboarding()`: オンボーディングを開始
- `collectGoal()`: 目標を収集しSMART + WOOP分析を実行
- `identifyObstacles()`: 障害を特定し対処計画を作成
- `selectDuration()`: 期間を選択
- `collectCommitTimeAndProfile()`: コミットタイムとプロファイルを収集
- `generateMilestones()`: 10合目マイルストンを生成
- `saveOnboardingData()`: データを永続化

#### WidgetState 管理
セッション間で保持する軽量データ（約4kトークン以内）:
```typescript
interface OnboardingState {
  step: 'goal' | 'obstacles' | 'duration' | 'profile' | 'milestones' | 'complete';
  goal?: {
    title: string;
    kpi: string;
    smartAnalysis: SmartAnalysis;
    woopAnalysis: WoopAnalysis;
  };
  obstacles?: string[];
  plans?: string[];
  duration?: string;
  dailyCommitTime?: string;
  profile?: UserProfile;
  milestones?: Milestone[];
  lastUpdated: number;
}
```

### 2. MCPツール定義

#### goal.analyze
ユーザーが入力した目標をSMART + WOOP基準で分析する。

**入力スキーマ:**
```json
{
  "name": "goal.analyze",
  "description": "ユーザーの目標をSMART + WOOP基準で分析し、不足要素を特定する",
  "inputSchema": {
    "type": "object",
    "properties": {
      "goalText": {
        "type": "string",
        "description": "ユーザーが入力した目標テキスト"
      },
      "context": {
        "type": "string",
        "description": "目標の背景や動機（オプション）"
      }
    },
    "required": ["goalText"]
  }
}
```

**出力スキーマ:**
```json
{
  "type": "object",
  "properties": {
    "isComplete": {
      "type": "boolean",
      "description": "SMART基準を全て満たしているか"
    },
    "smartAnalysis": {
      "type": "object",
      "properties": {
        "specific": { "type": "boolean" },
        "measurable": { "type": "boolean" },
        "achievable": { "type": "boolean" },
        "relevant": { "type": "boolean" },
        "timeBound": { "type": "boolean" }
      }
    },
    "woopAnalysis": {
      "type": "object",
      "properties": {
        "wish": { "type": "string", "description": "明確化された願望" },
        "outcome": { "type": "string", "description": "期待される結果" },
        "obstacles": {
          "type": "array",
          "items": { "type": "string" },
          "description": "予想される障害のリスト"
        },
        "plan": {
          "type": "array",
          "items": { "type": "string" },
          "description": "障害への対処計画"
        }
      }
    },
    "missingElements": {
      "type": "array",
      "items": { "type": "string" },
      "description": "不足している要素のリスト"
    },
    "suggestions": {
      "type": "array",
      "items": { "type": "string" },
      "description": "改善のための質問や提案"
    }
  }
}
```

**必要なOAuthスコープ:** なし（分析のみ）

#### goal.create
SMART + WOOP基準を満たした目標を作成する。

**入力スキーマ:**
```json
{
  "name": "goal.create",
  "description": "長期目標を作成し、データベースに保存する",
  "inputSchema": {
    "type": "object",
    "properties": {
      "userId": { "type": "string" },
      "title": { "type": "string" },
      "kpi": { "type": "string" },
      "duration": { "type": "string" },
      "deadline": { "type": "string", "format": "date" },
      "obstacles": {
        "type": "array",
        "items": { "type": "string" },
        "description": "予想される障害"
      },
      "plans": {
        "type": "array",
        "items": { "type": "string" },
        "description": "障害への対処計画"
      }
    },
    "required": ["userId", "title", "kpi", "duration"]
  }
}
```

**出力スキーマ:**
```json
{
  "type": "object",
  "properties": {
    "goalId": { "type": "string" },
    "success": { "type": "boolean" },
    "message": { "type": "string" }
  }
}
```

**必要なOAuthスコープ:** `goals:write`

#### profile.create
ユーザープロファイルを作成する。

**入力スキーマ:**
```json
{
  "name": "profile.create",
  "description": "ユーザープロファイルを作成し、保存する",
  "inputSchema": {
    "type": "object",
    "properties": {
      "userId": { "type": "string" },
      "dailyCommitTime": { "type": "string" },
      "lifestyle": { "type": "string" },
      "focusTime": { "type": "string" },
      "workEnvironment": { "type": "string" },
      "taskPace": { "type": "string" },
      "pastFailureReason": { "type": "string" },
      "skillLevel": { "type": "string" },
      "difficultyPreference": { "type": "string" }
    },
    "required": ["userId", "dailyCommitTime"]
  }
}
```

**出力スキーマ:**
```json
{
  "type": "object",
  "properties": {
    "profileId": { "type": "string" },
    "success": { "type": "boolean" },
    "message": { "type": "string" }
  }
}
```

**必要なOAuthスコープ:** `profile:write`

#### milestone.generate
10合目のマイルストンを自動生成する。

**入力スキーマ:**
```json
{
  "name": "milestone.generate",
  "description": "長期目標を10段階のマイルストンに分解する",
  "inputSchema": {
    "type": "object",
    "properties": {
      "goalId": { "type": "string" },
      "userId": { "type": "string" }
    },
    "required": ["goalId", "userId"]
  }
}
```

**出力スキーマ:**
```json
{
  "type": "object",
  "properties": {
    "milestones": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "station": { "type": "integer", "minimum": 1, "maximum": 10 },
          "title": { "type": "string" },
          "description": { "type": "string" },
          "estimatedDuration": { "type": "string" },
          "completionCriteria": { "type": "string" }
        }
      }
    },
    "success": { "type": "boolean" }
  }
}
```

**必要なOAuthスコープ:** `goals:read`, `milestones:write`

### 3. バックエンドAPI エンドポイント

#### POST /api/v1/goals/analyze
目標のSMART + WOOP分析を実行する（LLMを使用）。

**リクエスト:**
```json
{
  "goalText": "英語を勉強したい",
  "context": "海外で働きたいから"
}
```

**レスポンス:**
```json
{
  "isComplete": false,
  "smartAnalysis": {
    "specific": false,
    "measurable": false,
    "achievable": true,
    "relevant": true,
    "timeBound": false
  },
  "woopAnalysis": {
    "wish": "英語を勉強したい",
    "outcome": "海外で働けるレベルの英語力を身につける",
    "obstacles": [
      "仕事が忙しくて時間が取れない",
      "モチベーションが続かない",
      "何から始めればいいか分からない"
    ],
    "plan": [
      "毎朝30分早く起きて勉強時間を確保する",
      "週次で進捗を確認し、小さな達成を祝う",
      "まずは基礎文法から始める"
    ]
  },
  "missingElements": ["specific", "measurable", "timeBound"],
  "suggestions": [
    "具体的には、どのレベルの英語力を目指しますか？（例：TOEIC 800点）",
    "いつまでに達成したいですか？"
  ]
}
```

#### POST /api/v1/goals
目標を作成する。

**リクエスト:**
```json
{
  "userId": "user_123",
  "title": "TOEIC 800点を取得する",
  "kpi": "TOEIC スコア 800点以上",
  "duration": "6ヶ月",
  "deadline": "2025-10-18",
  "obstacles": [
    "仕事が忙しくて時間が取れない",
    "モチベーションが続かない"
  ],
  "plans": [
    "毎朝30分早く起きて勉強時間を確保する",
    "週次で進捗を確認し、小さな達成を祝う"
  ]
}
```

**レスポンス:**
```json
{
  "goalId": "goal_456",
  "success": true,
  "message": "目標が作成されました"
}
```

#### POST /api/v1/profiles
ユーザープロファイルを作成する。

**リクエスト:**
```json
{
  "userId": "user_123",
  "dailyCommitTime": "30分",
  "lifestyle": "会社員（9-18時）",
  "focusTime": "夜（18-21時）",
  "workEnvironment": "自宅",
  "taskPace": "毎日少しずつ",
  "pastFailureReason": "時間がなくなった",
  "skillLevel": "少し経験あり",
  "difficultyPreference": "少し頑張れば達成できること"
}
```

**レスポンス:**
```json
{
  "profileId": "profile_789",
  "success": true,
  "message": "プロファイルが作成されました"
}
```

#### POST /api/v1/milestones/generate
10合目のマイルストンを生成する（LLMを使用）。

**リクエスト:**
```json
{
  "goalId": "goal_456",
  "userId": "user_123"
}
```

**レスポンス:**
```json
{
  "milestones": [
    {
      "station": 1,
      "title": "基礎文法の復習",
      "description": "中学・高校レベルの文法を復習し、基礎を固める",
      "estimatedDuration": "2週間",
      "completionCriteria": "文法問題集を1冊完了する"
    },
    {
      "station": 2,
      "title": "語彙力の強化（初級）",
      "description": "TOEIC頻出単語500語を習得する",
      "estimatedDuration": "3週間",
      "completionCriteria": "単語テストで90%以上正解する"
    }
    // ... 10合目まで
  ],
  "success": true
}
```

## データモデル

### User テーブル
```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  anonymous_id VARCHAR(255) UNIQUE NOT NULL,
  consent_timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Goal テーブル
```sql
CREATE TABLE goals (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  title VARCHAR(500) NOT NULL,
  kpi TEXT NOT NULL,
  duration VARCHAR(100) NOT NULL,
  deadline DATE,
  obstacles JSONB,
  plans JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### UserProfile テーブル
```sql
CREATE TABLE user_profiles (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  daily_commit_time VARCHAR(50) NOT NULL,
  lifestyle VARCHAR(100),
  focus_time VARCHAR(100),
  work_environment VARCHAR(100),
  task_pace VARCHAR(100),
  past_failure_reason VARCHAR(200),
  skill_level VARCHAR(100),
  difficulty_preference VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Milestone テーブル
```sql
CREATE TABLE milestones (
  id VARCHAR(255) PRIMARY KEY,
  goal_id VARCHAR(255) NOT NULL REFERENCES goals(id),
  station INTEGER NOT NULL CHECK (station >= 1 AND station <= 10),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  estimated_duration VARCHAR(100),
  completion_criteria TEXT,
  status VARCHAR(50) DEFAULT 'not_started',
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(goal_id, station)
);
```

## エラーハンドリング

### クライアント側エラー

1. **ネットワークエラー**
   - Widget Stateに一時保存
   - 接続回復後に自動再送信
   - ユーザーに「オフラインモード」を通知

2. **入力検証エラー**
   - リアルタイムで検証
   - 具体的なエラーメッセージを表示
   - 修正方法を提案

3. **タイムアウト**
   - 30秒でタイムアウト
   - 再試行オプションを提供
   - 進捗を保存

### サーバー側エラー

1. **認証エラー (401)**
   - OAuth再認証を促す
   - セッションをクリア

2. **認可エラー (403)**
   - 必要なスコープを明示
   - 同意画面に誘導

3. **バリデーションエラー (400)**
   - 詳細なエラーメッセージを返す
   - 修正すべきフィールドを明示

4. **サーバーエラー (500)**
   - エラーログを記録
   - ユーザーに一般的なエラーメッセージを表示
   - サポート連絡先を提供

## テスト戦略

### 単体テスト
- MCPツールの入出力検証
- SMART分析ロジックのテスト
- マイルストン生成アルゴリズムのテスト
- データモデルのバリデーション

### 統合テスト
- Apps SDK ↔ MCPサーバー間の通信
- MCPサーバー ↔ バックエンドAPI間の通信
- OAuth認証フロー
- データベース操作

### E2Eテスト
- オンボーディング全体のフロー
- エラーハンドリング
- セッション復元
- 各ステップの遷移

### ユーザビリティテスト
- 5分以内に完了できるか
- 質問が分かりやすいか
- エラーメッセージが理解できるか
- 進捗が分かりやすいか

## セキュリティ考慮事項

### 認証・認可
- OAuth 2.1 + PKCE を使用
- 最小権限の原則（必要なスコープのみ要求）
- トークンの安全な保存（HttpOnly Cookie）
- セッションタイムアウト（30分）

### データ保護
- 通信は全てHTTPS
- 個人情報の暗号化（データベース）
- 匿名IDの使用（個人特定を避ける）
- データ削除APIの提供

### 入力検証
- クライアント側とサーバー側の両方で検証
- SQLインジェクション対策（パラメータ化クエリ）
- XSS対策（入力のサニタイズ）
- プロンプトインジェクション対策（入力の検証と制限）

### 監査ログ
- 全てのAPI呼び出しをログ記録
- ユーザーの同意・拒否を記録
- データアクセスの記録
- 異常なアクセスパターンの検出

## パフォーマンス最適化

### フロントエンド
- Widget Stateの最小化（4k以内）
- 不要なAPI呼び出しの削減
- ローディング状態の表示
- 楽観的UI更新

### バックエンド
- LLM呼び出しのキャッシング（類似の目標）
- データベースインデックスの最適化
- API レスポンスの圧縮
- レート制限の実装

### データベース
- 適切なインデックス作成
- クエリの最適化
- コネクションプーリング
- 定期的なバックアップ

## 将来の拡張性

### Sign in with ChatGPT 対応
- 認証アダプタパターンの採用
- OAuth実装を抽象化
- 公式認証への切り替えを容易に

### 外部アプリ展開
- Apps SDKで検証したUXを流用
- データモデルの再利用
- APIの共通化

### 多言語対応
- メッセージの外部化
- ロケールの管理
- 文化的な配慮（期間の表現など）

### アクセシビリティ
- スクリーンリーダー対応
- キーボードナビゲーション
- 色覚異常への配慮
- WCAG 2.1 AA準拠
