# MCP Client 実装ガイド

## 概要

MCPClient は、climb-youモバイルアプリとバックエンドの MCP（Model Context Protocol）サーバー間の通信を担当するネットワークレイヤーの中心コンポーネントです。

### 機能

- **RPC ベースの MCP 通信** - JSON-RPC 2.0 仕様に準拠
- **認証統合** - OAuth 2.1トークンの自動付与
- **リトライメカニズム** - 指数バックオフによる自動リトライ
- **キャッシング** - メモリベースの高速キャッシュ
- **エラーハンドリング** - 統一されたエラー型と処理

## アーキテクチャ

```
┌─────────────────────────────────────┐
│   MCPClient                         │
├─────────────────────────────────────┤
│ • Goal Analysis (goal.analyze)      │
│ • Goal Creation (goal.create)       │
│ • Milestone Generation              │
│ • Quest Bundle Fetching             │
│ • Quest Completion                  │
│ • User Profile Management           │
└──────────────┬──────────────────────┘
               │
        ┌──────▼──────┐
        │ Axios       │
        │ + Retry     │
        │ + Cache     │
        │ + Interceptors
        └──────┬──────┘
               │
        ┌──────▼──────────┐
        │ MCP Server      │
        │ (Backend API)   │
        └─────────────────┘
```

## 初期化

### 基本的な使用方法

```typescript
import { MCPClient } from '@/core/network/mcp';

// クライアント初期化
const mcpClient = new MCPClient({
  baseURL: 'https://api.example.com/mcp',
  timeout: 30000,           // 30秒
  retryAttempts: 3,         // 最大3回リトライ
  retryDelay: 1000,         // 初回リトライは1秒待機
});

// リクエスト実行
try {
  const analysis = await mcpClient.analyzeGoal('Run a marathon');
  console.log('Goal analysis:', analysis);
} catch (error) {
  console.error('MCP error:', error);
}
```

## API リファレンス

### 1. 目標分析（Goal Analysis）

```typescript
/**
 * 目標をSMART + WOOPフレームワークで分析
 */
async analyzeGoal(
  goal: string,              // 目標テキスト
  context?: string,          // オプション：背景情報
  options?: MCPCallOptions   // キャッシュ、リトライ設定
): Promise<GoalAnalysisResponse>
```

**使用例:**

```typescript
const analysis = await mcpClient.analyzeGoal(
  'Run a full marathon',
  'Personal fitness goal to improve cardiovascular health'
);

console.log('SMART Analysis:', analysis.smart_analysis);
// {
//   specific: 'Complete 42.195 km marathon race',
//   measurable: 'Official marathon distance',
//   achievable: 'With 6 months training',
//   relevant: 'Supports fitness improvement goals',
//   time_bound: 'Target completion within 6 months'
// }

console.log('WOOP Analysis:', analysis.woop_analysis);
// {
//   wish: 'Run a full marathon',
//   outcome: 'Cross finish line in sub-4 hours',
//   obstacle: 'Limited time due to work/family',
//   plan: 'Train 30 min daily + weekend long runs'
// }

console.log('Difficulty:', analysis.difficulty_level); // 'hard'
console.log('Duration:', analysis.estimated_duration_days); // 180
```

### 2. 目標作成（Goal Creation）

```typescript
/**
 * 目標を作成し、ローカルに保存
 */
async createGoal(
  userId: string,
  goal: string,
  analysis: GoalAnalysisResponse,
  options?: MCPCallOptions
): Promise<{ goal_id: string; created_at: string }>
```

**使用例:**

```typescript
const analysis = await mcpClient.analyzeGoal('Run a marathon');

const created = await mcpClient.createGoal(
  'user_123',
  'Run a marathon',
  analysis
);

console.log('Goal created:', created.goal_id);
// Output: 'goal_abc123def456'
```

### 3. マイルストーン生成（Milestone Generation）

```typescript
/**
 * 10合目のマイルストーンを生成
 */
async generateMilestones(
  goalId: string,
  goal: string,
  difficultyLevel: 'easy' | 'medium' | 'hard',
  durationDays: number,
  options?: MCPCallOptions
): Promise<MilestoneResponse[]>
```

**使用例:**

```typescript
const milestones = await mcpClient.generateMilestones(
  'goal_abc123',
  'Run a marathon',
  'hard',
  180 // 6ヶ月
);

console.log('Generated milestones:', milestones.length); // 10

milestones.forEach(m => {
  console.log(`Station ${m.station_number}: ${m.title}`);
  console.log(`  Criteria: ${m.criteria}`);
  console.log(`  Steps: ${m.estimated_steps}`);
});
// Output:
// Station 1: Base Training
//   Criteria: Complete 20 km of total running
//   Steps: 100
// Station 2: Endurance Building
//   Criteria: Complete 50 km of total running
//   Steps: 200
// ... (Stations 3-10)
```

### 4. クエストバンドル取得（Quest Bundle Fetching）

```typescript
/**
 * 今日のクエストバンドル（3つのクエスト）を取得
 */
async getQuestBundle(
  userId: string,
  currentMilestoneId: string,
  userProfile: {
    commit_time: string;                    // 'morning' | 'afternoon' | 'evening'
    available_minutes_per_day: number;      // 例：120
    difficulty_preference: 'easy' | 'medium' | 'hard';
    quest_type_preference: string[];        // 例: ['small', 'medium']
  },
  lastDayLogs?: any[],
  successPatterns?: any[],
  failurePatterns?: any[],
  options?: MCPCallOptions
): Promise<QuestBundleResponse>
```

**使用例:**

```typescript
const questBundle = await mcpClient.getQuestBundle(
  'user_123',
  'milestone_1',
  {
    commit_time: 'morning',
    available_minutes_per_day: 120,
    difficulty_preference: 'medium',
    quest_type_preference: ['small', 'medium'],
  }
);

console.log('Today\'s quests:', questBundle.quests.length); // 3

questBundle.quests.forEach(quest => {
  console.log(`${quest.type.toUpperCase()}: ${quest.title}`);
  console.log(`  Time: ${quest.estimated_minutes} min`);
  console.log(`  Evidence: ${quest.evidence_type}`);
});
// Output:
// SMALL: Morning stretching routine
//   Time: 15 min
//   Evidence: text
// MEDIUM: Practice running form
//   Time: 45 min
//   Evidence: image
// VALIDATION: Review daily training plan
//   Time: 10 min
//   Evidence: none
```

### 5. クエスト完了記録（Quest Completion）

```typescript
/**
 * クエスト完了、見送り、または阻害を記録
 */
async completeQuest(
  userId: string,
  questId: string,
  status: 'completed' | 'skipped' | 'obstructed',
  options?: {
    actualMinutes?: number;
    evidence?: { type: 'text' | 'image'; content: string };
    obstructionReason?: string;
    skipReason?: string;
    mcpOptions?: MCPCallOptions;
  }
): Promise<QuestCompleteResponse>
```

**使用例:**

```typescript
// クエスト完了
const result = await mcpClient.completeQuest(
  'user_123',
  'quest_abc123',
  'completed',
  {
    actualMinutes: 15,
    evidence: {
      type: 'text',
      content: 'Completed 3 km morning run at 6:30 AM'
    }
  }
);

console.log('Steps earned:', result.steps_earned); // 50
console.log('Current streak:', result.current_streak); // 5

// クエスト見送り
await mcpClient.completeQuest(
  'user_123',
  'quest_xyz789',
  'skipped',
  { skipReason: 'Unexpected meeting came up' }
);

// クエスト阻害
await mcpClient.completeQuest(
  'user_123',
  'quest_def456',
  'obstructed',
  { obstructionReason: 'Got sick with fever' }
);
```

### 6. ユーザープロファイル管理

```typescript
/**
 * ユーザープロファイルを取得
 */
async getUserProfile(userId: string, options?: MCPCallOptions): Promise<UserProfileResponse>

/**
 * ユーザープロファイルを更新
 */
async updateUserProfile(
  userId: string,
  profile: Omit<UserProfileRequest, 'user_id'>,
  options?: MCPCallOptions
): Promise<UserProfileResponse>
```

**使用例:**

```typescript
// プロファイル取得
const profile = await mcpClient.getUserProfile('user_123');
console.log('Commit time:', profile.commit_time);
console.log('Available time:', profile.available_minutes_per_day);

// プロファイル更新
const updated = await mcpClient.updateUserProfile(
  'user_123',
  {
    commit_time: 'morning',
    available_minutes_per_day: 150,
    difficulty_preference: 'medium',
    quest_type_preference: ['small', 'medium', 'validation'],
    timezone: 'Asia/Tokyo',
    language: 'ja'
  }
);

console.log('Profile updated:', updated.updated_at);
```

## キャッシング

MCPClient はメモリベースのキャッシングを実装しており、パフォーマンスを向上させます。

### キャッシュ期間

| メソッド | デフォルト期間 | 説明 |
|----------|---------------|------|
| `analyzeGoal` | 24時間 | 目標分析は変わらないため長期キャッシュ |
| `getQuestBundle` | 1分 | 時間とともに変わるため短期キャッシュ |
| `getUserProfile` | 1時間 | プロフィール更新は不頻繁 |
| `completeQuest` | キャッシュなし | 実行時のみ（副作用あり） |

### キャッシュ制御

```typescript
// キャッシュを使用（デフォルト）
await mcpClient.analyzeGoal('Test goal');

// キャッシュをスキップ
await mcpClient.analyzeGoal(
  'Test goal',
  undefined,
  { cache: false }
);

// キャッシュ期間をカスタマイズ
await mcpClient.analyzeGoal(
  'Test goal',
  undefined,
  { cache: true, cacheDuration: 60 * 60 * 1000 } // 1時間
);

// すべてのキャッシュをクリア
mcpClient.clearCache();

// 特定メソッドのキャッシュをクリア
mcpClient.clearCacheByMethod('goal.analyze');
```

## エラーハンドリング

MCPClient はネットワークエラーを統一された `NetworkError` クラスで返します。

```typescript
import { NetworkError } from '@/core/network/mcp';

try {
  await mcpClient.analyzeGoal('Test goal');
} catch (error) {
  if (error instanceof NetworkError) {
    console.log('Error code:', error.code); // 'UNAUTHORIZED', 'TIMEOUT', etc.
    console.log('Message:', error.message);
    console.log('Status code:', error.statusCode);
    console.log('Details:', error.details);

    // エラータイプに応じた処理
    switch (error.code) {
      case 'UNAUTHORIZED':
        // ログイン画面へ遷移
        navigation.replace('Login');
        break;
      case 'TIMEOUT':
        // リトライを提案
        showRetryDialog();
        break;
      case 'NETWORK_ERROR':
        // ネットワーク接続を確認
        checkNetworkConnection();
        break;
      default:
        // エラーメッセージを表示
        showErrorAlert(error.message);
    }
  }
}
```

### エラータイプ

| コード | 説明 | HTTP ステータス |
|--------|------|-----------------|
| NETWORK_ERROR | ネットワーク接続エラー | - |
| TIMEOUT | リクエストタイムアウト | - |
| UNAUTHORIZED | 認証エラー | 401 |
| FORBIDDEN | 権限なし | 403 |
| NOT_FOUND | リソースが見つからない | 404 |
| SERVER_ERROR | サーバーエラー | 500+ |
| UNKNOWN_ERROR | 不明なエラー | その他 |

## リトライメカニズム

MCPClient は自動リトライを実装しており、一時的なネットワークエラーに対応します。

```typescript
// リトライ設定でクライアント初期化
const mcpClient = new MCPClient({
  baseURL: 'https://api.example.com/mcp',
  timeout: 30000,
  retryAttempts: 3,           // 最大3回リトライ
  retryDelay: 1000,           // 初回リトライは1秒待機
});

// リトライロジック：エクスポーネンシャルバックオフ
// 1回目失敗 → 1秒待機 → 2回目試行
// 2回目失敗 → 2秒待機 → 3回目試行
// 3回目失敗 → 4秒待機 → 4回目試行
// 4回目失敗 → エラーを返す

// リクエストごとにリトライ回数をオーバーライド
await mcpClient.analyzeGoal(
  'Test goal',
  undefined,
  { retries: 5 }  // このリクエストは5回までリトライ
);
```

## 実装パターン

### パターン1: オンボーディングフロー

```typescript
async function handleOnboarding(goalText: string) {
  try {
    // 1. 目標を分析
    const analysis = await mcpClient.analyzeGoal(goalText);

    // 2. 目標を作成
    const goalResult = await mcpClient.createGoal(
      userId,
      goalText,
      analysis
    );

    // 3. マイルストーンを生成
    const milestones = await mcpClient.generateMilestones(
      goalResult.goal_id,
      goalText,
      analysis.difficulty_level,
      analysis.estimated_duration_days
    );

    // 4. ホーム画面へ遷移
    navigation.replace('Home');
  } catch (error) {
    showErrorAlert('Onboarding failed: ' + error.message);
  }
}
```

### パターン2: ホーム画面のクエスト表示

```typescript
async function loadTodayQuests() {
  try {
    setLoading(true);

    const questBundle = await mcpClient.getQuestBundle(
      userId,
      currentMilestoneId,
      userProfile,
      lastDayLogs,
      successPatterns,
      failurePatterns
    );

    setQuests(questBundle.quests);
    setExpiresAt(questBundle.expires_at);
  } catch (error) {
    showErrorAlert('Failed to load quests');
  } finally {
    setLoading(false);
  }
}

// リフレッシュ (キャッシュスキップ)
async function refreshQuests() {
  await loadTodayQuests();
  mcpClient.clearCacheByMethod('quest.generate');
}
```

### パターン3: クエスト完了フロー

```typescript
async function completeCurrentQuest(
  questId: string,
  evidenceText: string,
  actualMinutes: number
) {
  try {
    setLoading(true);

    const result = await mcpClient.completeQuest(
      userId,
      questId,
      'completed',
      {
        actualMinutes,
        evidence: {
          type: 'text',
          content: evidenceText
        }
      }
    );

    // ストリーク更新を表示
    if (result.streak_updated) {
      showStreakCelebration(result.current_streak);
    }

    // 歩数更新を表示
    showStepsEarned(result.steps_earned);

    // クエストリストを更新
    await refreshQuests();
  } catch (error) {
    showErrorAlert('Failed to complete quest');
  } finally {
    setLoading(false);
  }
}
```

## テスト

### Unit Tests

```bash
# MCPClient テスト実行
npm test -- MCPClient.test.ts

# 特定のテストケースを実行
npm test -- MCPClient.test.ts -t "analyzeGoal"

# カバレッジレポート
npm test -- MCPClient.test.ts --coverage
```

### Integration Tests

```bash
# MCPClient + Auth統合テスト
npm test -- mcp-integration.test.ts
```

## ベストプラクティス

### 1. エラーハンドリング

```typescript
// ✅ 良い例: エラーをキャッチして適切に処理
try {
  const data = await mcpClient.analyzeGoal(goal);
} catch (error) {
  if (error instanceof NetworkError) {
    handleNetworkError(error);
  }
}

// ❌ 悪い例: エラーを無視
const data = await mcpClient.analyzeGoal(goal);
```

### 2. キャッシング制御

```typescript
// ✅ 良い例: 頻繁に変わるデータはキャッシュスキップ
await mcpClient.getQuestBundle(..., { cache: false });

// ❌ 悪い例: 常にキャッシュを使用（古いデータが表示される）
await mcpClient.getQuestBundle(...);
```

### 3. リトライ設定

```typescript
// ✅ 良い例: リトライ可能な操作では複数回試行
await mcpClient.analyzeGoal(goal, undefined, { retries: 5 });

// ❌ 悪い例: 副作用がある操作をリトライ（重複実行の危険）
await mcpClient.completeQuest(userId, questId, 'completed');
```

## 関連ファイル

| ファイル | 説明 |
|---------|------|
| `src/core/network/mcp/MCPClient.ts` | MCPClient の実装 |
| `src/core/network/mcp/types.ts` | MCP 型定義 |
| `src/core/network/mcp/__tests__/MCPClient.test.ts` | MCPClient テスト |

---

**作成日**: 2025-10-22
**タスク**: 3.1 MCPClient の実装
**ステータス**: ✅ 完了
