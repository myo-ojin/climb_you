# 設計書：マイルストーン達成管理機能

## 概要

マイルストーン達成管理機能は、ユーザーが各合目（1〜10合目）に到達した際に、実質的な目標達成を確認し、未達成の場合は適切なサポートとワークフローを提供する。歩数による進捗とマイルストーンの実質的な達成の両方を管理することで、ユーザーの確実な成長を支援する。

## アーキテクチャ

### システム構成

```
┌─────────────────────────────────────────┐
│   クエスト達成ログシステム                 │
│   - 歩数付与                             │
│   - 累計歩数更新                         │
└─────────────────────────────────────────┘
              ↓ 歩数到達イベント
┌─────────────────────────────────────────┐
│   マイルストーン達成管理システム           │
│   - 合目到達検知                         │
│   - 達成確認                             │
│   - 未達成サポート                       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   バックエンドAPI                         │
│   - 達成判定ロジック                      │
│   - 調整・再設計エンジン                  │
│   - 停滞検知                             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   データベース                            │
│   - MilestoneProgress                   │
│   - MilestoneAchievement                │
│   - MilestoneAdjustment                 │
│   - StagnationAlert                     │
└─────────────────────────────────────────┘
```

### 技術スタック

- **フロントエンド**: ChatGPT Apps SDK (TypeScript)
- **バックエンド**: Node.js / Python
- **LLM**: OpenAI GPT-4 / Anthropic Claude（マイルストーン再設計用）
- **データベース**: PostgreSQL
- **通信**: MCP (Model Context Protocol)

## コンポーネントとインターフェース

### 1. 合目到達検知コンポーネント

#### StationReachDetector
歩数の累計を監視し、合目到達を検知する。

**主要機能:**
- 累計歩数の監視
- 合目到達判定
- 到達通知の生成

**実装ロジック:**
```typescript
interface StationConfig {
  station: number; // 1-10
  requiredSteps: number;
  title: string;
  criteria: string;
}

class StationReachDetector {
  async checkReach(userId: string, newTotalSteps: number): Promise<StationReachEvent | null> {
    const currentProgress = await this.getCurrentProgress(userId);
    const nextStation = currentProgress.currentStation + 1;
    
    if (nextStation > 10) return null;
    
    const stationConfig = await this.getStationConfig(userId, nextStation);
    
    if (newTotalSteps >= stationConfig.requiredSteps) {
      return {
        userId,
        station: nextStation,
        title: stationConfig.title,
        criteria: stationConfig.criteria,
        totalSteps: newTotalSteps,
        timestamp: new Date()
      };
    }
    
    return null;
  }
}
```

### 2. 達成確認コンポーネント

#### AchievementVerifier
ユーザーに達成確認を行い、証跡を収集する。

**データ構造:**
```typescript
interface AchievementConfirmation {
  userId: string;
  station: number;
  achieved: boolean;
  evidence?: {
    type: 'image' | 'note' | 'file';
    url?: string;
    content?: string;
  };
  timestamp: Date;
}

interface UnachievedResponse {
  userId: string;
  station: number;
  reason: 'no_time' | 'too_difficult' | 'low_motivation' | 'other';
  customReason?: string;
  progressRate: number; // 0-100
  selectedOption: 'continue' | 'adjust' | 'redesign';
}
```

### 3. 未達成サポートコンポーネント

#### UnachievedSupportEngine
未達成時の3つの選択肢を提供し、適切な処理を実行する。

**選択肢A: このまま続ける**
```typescript
async handleContinue(response: UnachievedResponse): Promise<void> {
  await this.updateProgress({
    userId: response.userId,
    station: response.station,
    progressRate: response.progressRate,
    prioritizeRemaining: true
  });
  
  await this.setQuestGenerationFlag({
    userId: response.userId,
    prioritizeTasks: this.getRemainingTasks(response.station, response.progressRate)
  });
}
```

**選択肢B: 目標を調整する**
```typescript
async handleAdjust(response: UnachievedResponse): Promise<AdjustmentProposal> {
  const currentCriteria = await this.getMilestoneCriteria(response.userId, response.station);
  const proposal = this.generateAdjustmentProposal(currentCriteria, response.progressRate);
  
  return {
    station: response.station,
    originalCriteria: currentCriteria,
    adjustedCriteria: proposal.newCriteria,
    reason: `現在の進捗率${response.progressRate}%を考慮しました`,
    requiresApproval: true
  };
}

private generateAdjustmentProposal(criteria: string, progressRate: number): AdjustmentProposal {
  // 進捗率に基づいて達成条件を緩和
  // 例: 50問 → 30問（60%進捗の場合）
  const adjustmentFactor = progressRate / 100;
  // LLMを使用して自然な調整案を生成
  return this.llmGenerateAdjustment(criteria, adjustmentFactor);
}
```

**選択肢C: マイルストーンを再設計する**
```typescript
async handleRedesign(response: UnachievedResponse): Promise<RedesignProposal> {
  const goal = await this.getGoal(response.userId);
  const currentMilestones = await this.getMilestones(response.userId);
  const userProfile = await this.getUserProfile(response.userId);
  
  const redesignOptions = await this.llmGenerateRedesign({
    goal,
    currentStation: response.station,
    failureReason: response.reason,
    progressRate: response.progressRate,
    userProfile
  });
  
  return {
    currentMilestones: currentMilestones.slice(response.station - 1),
    proposedMilestones: redesignOptions,
    comparison: this.generateComparison(currentMilestones, redesignOptions)
  };
}
```

### 4. 停滞検知コンポーネント

#### StagnationDetector
同じ合目に長期間滞在しているユーザーを検知する。

**検知ロジック:**
```typescript
interface StagnationAlert {
  userId: string;
  station: number;
  daysStagnant: number;
  attemptCount: number;
  lastAttemptDate: Date;
}

class StagnationDetector {
  async checkStagnation(userId: string): Promise<StagnationAlert | null> {
    const progress = await this.getMilestoneProgress(userId);
    const daysSinceReach = this.calculateDays(progress.reachedAt, new Date());
    
    if (daysSinceReach >= 30) {
      return {
        userId,
        station: progress.currentStation,
        daysStagnant: daysSinceReach,
        attemptCount: progress.attemptCount,
        lastAttemptDate: progress.lastAttemptDate
      };
    }
    
    return null;
  }
  
  async checkMultipleFailures(userId: string, station: number): Promise<boolean> {
    const attempts = await this.getAttempts(userId, station);
    const recentFailures = attempts.filter(a => 
      !a.achieved && 
      this.isRecent(a.timestamp, 30) // 過去30日以内
    );
    
    return recentFailures.length >= 3;
  }
}
```

### 5. MCPツール定義

#### milestone.checkAchievement
合目達成を確認する。

**入力スキーマ:**
```json
{
  "name": "milestone.checkAchievement",
  "description": "合目の達成状況を確認する",
  "inputSchema": {
    "type": "object",
    "properties": {
      "userId": { "type": "string" },
      "station": { "type": "integer", "minimum": 1, "maximum": 10 },
      "achieved": { "type": "boolean" },
      "evidence": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["image", "note", "file"] },
          "url": { "type": "string" },
          "content": { "type": "string" }
        }
      }
    },
    "required": ["userId", "station", "achieved"]
  }
}
```

**出力スキーマ:**
```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "message": { "type": "string" },
    "nextStation": {
      "type": "object",
      "properties": {
        "station": { "type": "integer" },
        "title": { "type": "string" },
        "criteria": { "type": "string" },
        "requiredSteps": { "type": "integer" }
      }
    }
  }
}
```

**必要なOAuthスコープ:** `milestones:write`

#### milestone.reportUnachieved
未達成を報告する。

**入力スキーマ:**
```json
{
  "name": "milestone.reportUnachieved",
  "description": "合目の未達成を報告し、サポートを受ける",
  "inputSchema": {
    "type": "object",
    "properties": {
      "userId": { "type": "string" },
      "station": { "type": "integer" },
      "reason": { "type": "string", "enum": ["no_time", "too_difficult", "low_motivation", "other"] },
      "customReason": { "type": "string" },
      "progressRate": { "type": "number", "minimum": 0, "maximum": 100 },
      "selectedOption": { "type": "string", "enum": ["continue", "adjust", "redesign"] }
    },
    "required": ["userId", "station", "reason", "progressRate", "selectedOption"]
  }
}
```

**必要なOAuthスコープ:** `milestones:write`

#### milestone.adjust
マイルストーンを調整する。

**入力スキーマ:**
```json
{
  "name": "milestone.adjust",
  "description": "マイルストーンの達成条件を調整する",
  "inputSchema": {
    "type": "object",
    "properties": {
      "userId": { "type": "string" },
      "station": { "type": "integer" },
      "approved": { "type": "boolean" },
      "customAdjustment": { "type": "string" }
    },
    "required": ["userId", "station", "approved"]
  }
}
```

**必要なOAuthスコープ:** `milestones:write`

#### milestone.redesign
マイルストーンを再設計する。

**入力スキーマ:**
```json
{
  "name": "milestone.redesign",
  "description": "マイルストーンを再設計する",
  "inputSchema": {
    "type": "object",
    "properties": {
      "userId": { "type": "string" },
      "fromStation": { "type": "integer" },
      "redesignOption": { "type": "string", "enum": ["finer_steps", "lower_difficulty", "extend_duration"] },
      "approved": { "type": "boolean" }
    },
    "required": ["userId", "fromStation", "redesignOption", "approved"]
  }
}
```

**必要なOAuthスコープ:** `milestones:write`

#### milestone.getProgress
進捗状況を取得する。

**入力スキーマ:**
```json
{
  "name": "milestone.getProgress",
  "description": "マイルストーンの進捗状況を取得する",
  "inputSchema": {
    "type": "object",
    "properties": {
      "userId": { "type": "string" }
    },
    "required": ["userId"]
  }
}
```

**必要なOAuthスコープ:** `milestones:read`

### 6. バックエンドAPI エンドポイント

#### POST /api/v1/milestones/:station/check
合目達成を確認する。

**リクエスト:**
```json
{
  "userId": "user_123",
  "station": 3,
  "achieved": true,
  "evidence": {
    "type": "image",
    "url": "https://cdn.example.com/evidence/abc123.jpg"
  }
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "おめでとうございます！3合目を達成しました！",
  "achievement": {
    "station": 3,
    "achievedAt": "2025-10-19T10:30:00Z",
    "badge": "station_3_badge"
  },
  "nextStation": {
    "station": 4,
    "title": "リスニング応用",
    "criteria": "Part 3-4の問題を100問解く",
    "requiredSteps": 2000
  },
  "overallProgress": 30
}
```

#### POST /api/v1/milestones/:station/unachieved
未達成を報告する。

**リクエスト:**
```json
{
  "userId": "user_123",
  "station": 3,
  "reason": "too_difficult",
  "progressRate": 60,
  "selectedOption": "adjust"
}
```

**レスポンス（選択肢Bの場合）:**
```json
{
  "success": true,
  "adjustmentProposal": {
    "station": 3,
    "originalCriteria": "Part 1-2の問題を50問解く",
    "adjustedCriteria": "Part 1-2の問題を30問解く",
    "reason": "現在の進捗率60%を考慮しました"
  },
  "requiresApproval": true
}
```

#### POST /api/v1/milestones/:station/adjust
マイルストーンを調整する。

**リクエスト:**
```json
{
  "userId": "user_123",
  "station": 3,
  "approved": true
}
```

**レスポンス:**
```json
{
  "success": true,
  "message": "目標を調整しました。3合目達成です！",
  "updatedMilestone": {
    "station": 3,
    "criteria": "Part 1-2の問題を30問解く",
    "adjustedAt": "2025-10-19T10:35:00Z"
  },
  "nextStation": {
    "station": 4,
    "title": "リスニング応用",
    "criteria": "Part 3-4の問題を100問解く",
    "requiredSteps": 2000
  }
}
```

#### POST /api/v1/milestones/redesign
マイルストーンを再設計する。

**リクエスト:**
```json
{
  "userId": "user_123",
  "fromStation": 3,
  "redesignOption": "finer_steps"
}
```

**レスポンス:**
```json
{
  "success": true,
  "proposedMilestones": [
    {
      "station": 3,
      "title": "リスニング基礎（前半）",
      "criteria": "Part 1の問題を30問解く",
      "requiredSteps": 1250
    },
    {
      "station": 4,
      "title": "リスニング基礎（後半）",
      "criteria": "Part 2の問題を30問解く",
      "requiredSteps": 1500
    }
  ],
  "comparison": {
    "before": "3合目: Part 1-2の問題を50問解く",
    "after": "3合目と4合目に分割し、より細かいステップに"
  }
}
```

#### GET /api/v1/milestones/progress
進捗状況を取得する。

**レスポンス:**
```json
{
  "userId": "user_123",
  "currentStation": 3,
  "totalSteps": 1200,
  "stationProgress": 80,
  "overallProgress": 25,
  "milestones": [
    {
      "station": 1,
      "title": "基礎文法の復習",
      "status": "achieved",
      "achievedAt": "2025-10-01T10:00:00Z"
    },
    {
      "station": 2,
      "title": "語彙力の強化",
      "status": "achieved",
      "achievedAt": "2025-10-08T15:30:00Z"
    },
    {
      "station": 3,
      "title": "リスニング基礎",
      "status": "in_progress",
      "progressRate": 80,
      "requiredSteps": 1500
    }
  ]
}
```

## データモデル

### MilestoneProgress テーブル
```sql
CREATE TABLE milestone_progress (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  goal_id VARCHAR(255) NOT NULL REFERENCES goals(id),
  current_station INTEGER NOT NULL CHECK (current_station >= 1 AND current_station <= 10),
  total_steps INTEGER NOT NULL DEFAULT 0,
  station_progress_rate DECIMAL(5, 2) DEFAULT 0,
  reached_at TIMESTAMP,
  attempt_count INTEGER DEFAULT 0,
  last_attempt_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, goal_id)
);
```

### MilestoneAchievement テーブル
```sql
CREATE TABLE milestone_achievements (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  milestone_id VARCHAR(255) NOT NULL REFERENCES milestones(id),
  station INTEGER NOT NULL,
  achieved BOOLEAN NOT NULL,
  evidence_type VARCHAR(50),
  evidence_url TEXT,
  evidence_content TEXT,
  achieved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### MilestoneAdjustment テーブル
```sql
CREATE TABLE milestone_adjustments (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  milestone_id VARCHAR(255) NOT NULL REFERENCES milestones(id),
  station INTEGER NOT NULL,
  original_criteria TEXT NOT NULL,
  adjusted_criteria TEXT NOT NULL,
  reason TEXT,
  progress_rate DECIMAL(5, 2),
  adjusted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### UnachievedAttempt テーブル
```sql
CREATE TABLE unachieved_attempts (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  station INTEGER NOT NULL,
  reason VARCHAR(100) NOT NULL,
  custom_reason TEXT,
  progress_rate DECIMAL(5, 2),
  selected_option VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### StagnationAlert テーブル
```sql
CREATE TABLE stagnation_alerts (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  station INTEGER NOT NULL,
  days_stagnant INTEGER NOT NULL,
  alert_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP
);
```

## エラーハンドリング

### クライアント側エラー
1. **ネットワークエラー** - Widget Stateに保存、再接続時に再送信
2. **証跡アップロードエラー** - リトライ処理、ユーザーに通知
3. **タイムアウト** - 30秒でタイムアウト、再試行オプション

### サーバー側エラー
1. **認証エラー (401)** - OAuth再認証を促す
2. **バリデーションエラー (400)** - 詳細なエラーメッセージを返す
3. **LLMエラー** - フォールバック（テンプレートベースの調整案）
4. **サーバーエラー (500)** - エラーログ記録、ユーザーに一般的なエラーメッセージ

## テスト戦略

### 単体テスト
- 合目到達検知ロジックのテスト
- 調整案生成アルゴリズムのテスト
- 停滞検知ロジックのテスト

### 統合テスト
- 達成確認フローのテスト
- 未達成サポートフローのテスト
- マイルストーン再設計フローのテスト

### E2Eテスト
- 合目到達から達成確認までのフロー
- 未達成時の3つの選択肢のフロー
- 停滞検知とサポートのフロー

## セキュリティ考慮事項

### 認証・認可
- OAuth 2.1 + PKCE を使用
- 最小権限の原則（必要なスコープのみ要求）

### データ保護
- 証跡の暗号化
- 個人情報の匿名化
- アクセスログの記録

### 入力検証
- クライアント側とサーバー側の両方で検証
- 進捗率の範囲チェック（0〜100%）
- 証跡ファイルのサイズとタイプの検証

## パフォーマンス最適化

### フロントエンド
- 確認プロセスの最適化（90秒以内）
- アニメーションのパフォーマンス最適化

### バックエンド
- LLM呼び出しのキャッシング
- 調整案の事前生成（よくあるパターン）
- データベースクエリの最適化

### データベース
- 適切なインデックス作成
- 古いアラートの定期削除

## 将来の拡張性

### AI支援の強化
- ユーザーの行動パターンから最適な調整案を提案
- 停滞予測（事前にサポートを提供）

### ソーシャル機能
- 同じ合目で頑張っている仲間の表示
- 達成者からのアドバイス機能

### ゲーミフィケーション
- 合目達成バッジのカスタマイズ
- 達成記念の共有機能
