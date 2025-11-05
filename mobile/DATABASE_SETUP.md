# データベースセットアップ：SQLite + AsyncStorage

## 概要

climb-youモバイルアプリケーションのローカルデータ管理システムです。
- **SQLite**: 構造化データの永続化（goals, quests, quest_logs, milestones など）
- **AsyncStorage**: アプリケーション設定、トークンなどの簡易データ保存

## テーブル設計

### 1. users テーブル
ユーザー基本情報

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar TEXT,
  auth_provider_id TEXT,
  auth_provider_type TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

| カラム | 型 | 説明 |
|-------|-----|------|
| id | TEXT PRIMARY KEY | ユーザーID（UUID） |
| email | TEXT | メールアドレス |
| display_name | TEXT | 表示名 |
| avatar | TEXT | アバターURL |
| auth_provider_id | TEXT | OAuth プロバイダーID |
| auth_provider_type | TEXT | 認証タイプ（apple/google/oauth） |
| created_at | TEXT | 作成日時（ISO 8601） |
| updated_at | TEXT | 更新日時（ISO 8601） |

### 2. goals テーブル
長期目標（山登り）

```sql
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  kpi TEXT NOT NULL,
  duration TEXT NOT NULL,
  deadline TEXT,
  obstacles TEXT,           -- JSON配列
  plans TEXT,               -- JSON配列
  status TEXT NOT NULL,     -- active/completed/abandoned
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_synced INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
```

| カラム | 型 | 説明 |
|-------|-----|------|
| id | TEXT PRIMARY KEY | 目標ID |
| user_id | TEXT NOT NULL | ユーザーID（外部キー） |
| title | TEXT NOT NULL | 目標タイトル |
| kpi | TEXT NOT NULL | Key Performance Indicator |
| duration | TEXT NOT NULL | 期間（例："3ヶ月"） |
| deadline | TEXT | 期限（ISO 8601） |
| obstacles | TEXT | WOOP分析の障害（JSON配列） |
| plans | TEXT | WOOP分析の計画（JSON配列） |
| status | TEXT NOT NULL | ステータス |
| created_at | TEXT NOT NULL | 作成日時 |
| updated_at | TEXT NOT NULL | 更新日時 |
| is_synced | INTEGER | 同期済みフラグ（0=未同期, 1=同期済み） |

### 3. milestones テーブル
合目（10段階のマイルストーン）

```sql
CREATE TABLE milestones (
  id TEXT PRIMARY KEY,
  goal_id TEXT NOT NULL,
  station INTEGER NOT NULL,     -- 1-10
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target_steps INTEGER NOT NULL,
  completion_criteria TEXT NOT NULL,
  status TEXT NOT NULL,         -- pending/in_progress/completed
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  is_synced INTEGER DEFAULT 0,
  FOREIGN KEY (goal_id) REFERENCES goals(id)
);

CREATE INDEX idx_milestones_goal_id ON milestones(goal_id);
```

| カラム | 型 | 説明 |
|-------|-----|------|
| id | TEXT PRIMARY KEY | マイルストーンID |
| goal_id | TEXT NOT NULL | 目標ID（外部キー） |
| station | INTEGER NOT NULL | 合目（1-10） |
| title | TEXT NOT NULL | タイトル（例："1合目"） |
| description | TEXT NOT NULL | 詳細説明 |
| target_steps | INTEGER NOT NULL | 到達に必要な歩数 |
| completion_criteria | TEXT NOT NULL | 達成基準 |
| status | TEXT NOT NULL | ステータス |
| completed_at | TEXT | 達成日時 |
| created_at | TEXT NOT NULL | 作成日時 |
| updated_at | TEXT NOT NULL | 更新日時 |
| is_synced | INTEGER | 同期済みフラグ |

### 4. quests テーブル
毎日のクエスト

```sql
CREATE TABLE quests (
  id TEXT PRIMARY KEY,
  quest_bundle_id TEXT NOT NULL,
  type TEXT NOT NULL,                  -- small/medium/validation
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_time INTEGER NOT NULL,    -- 分単位
  difficulty TEXT NOT NULL,            -- easy/medium/challenging
  completion_criteria TEXT NOT NULL,
  evidence_type TEXT NOT NULL,         -- text/image/url/none
  contributes_to_station INTEGER NOT NULL,  -- 1-10
  order_num INTEGER NOT NULL,
  status TEXT NOT NULL,                -- pending/completed/skipped/obstructed
  created_at TEXT NOT NULL,
  valid_until TEXT NOT NULL,           -- このクエストの有効期限
  is_synced INTEGER DEFAULT 0
);

CREATE INDEX idx_quests_bundle_id ON quests(quest_bundle_id);
```

### 5. quest_logs テーブル
クエスト完了ログ

```sql
CREATE TABLE quest_logs (
  id TEXT PRIMARY KEY,
  quest_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL,                 -- completed/skipped/obstructed
  actual_time INTEGER,                  -- 実際にかかった時間（分）
  skip_reason TEXT,
  skip_memo TEXT,
  obstacle TEXT,
  obstacle_details TEXT,
  contingency_plan TEXT,
  evidence_type TEXT,
  evidence_url TEXT,
  evidence_note TEXT,
  memo TEXT,
  steps_earned INTEGER NOT NULL,        -- 獲得した歩数
  completed_at TEXT,
  created_at TEXT NOT NULL,
  is_synced INTEGER DEFAULT 0,
  FOREIGN KEY (quest_id) REFERENCES quests(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_quest_logs_user_id ON quest_logs(user_id);
CREATE INDEX idx_quest_logs_quest_id ON quest_logs(quest_id);
```

| カラム | 型 | 説明 |
|-------|-----|------|
| id | TEXT PRIMARY KEY | ログID |
| quest_id | TEXT NOT NULL | クエストID（外部キー） |
| user_id | TEXT NOT NULL | ユーザーID（外部キー） |
| status | TEXT NOT NULL | 完了/見送り/阻害 |
| actual_time | INTEGER | 実際の所要時間（分） |
| skip_reason | TEXT | 見送り理由 |
| obstacle | TEXT | 遭遇した障害 |
| evidence_url | TEXT | 完了の証跡URL |
| steps_earned | INTEGER NOT NULL | 獲得した歩数 |
| completed_at | TEXT | 完了日時 |
| created_at | TEXT NOT NULL | ログ作成日時 |
| is_synced | INTEGER | 同期済みフラグ |

### 6. user_progress テーブル
ユーザーの進捗状況

```sql
CREATE TABLE user_progress (
  user_id TEXT PRIMARY KEY,
  total_steps INTEGER NOT NULL,
  current_streak INTEGER NOT NULL,
  max_streak INTEGER NOT NULL,
  freeze_days_remaining INTEGER NOT NULL,
  last_activity_date TEXT NOT NULL,
  current_station INTEGER NOT NULL,     -- 現在の合目
  steps_for_current_station INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  is_synced INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

| カラム | 型 | 説明 |
|-------|-----|------|
| user_id | TEXT PRIMARY KEY | ユーザーID（外部キー） |
| total_steps | INTEGER NOT NULL | 累計歩数 |
| current_streak | INTEGER NOT NULL | 現在のストリーク |
| max_streak | INTEGER NOT NULL | 最大ストリーク |
| freeze_days_remaining | INTEGER NOT NULL | 残り休息日数 |
| last_activity_date | TEXT NOT NULL | 最後のアクティビティ日時 |
| current_station | INTEGER NOT NULL | 現在の合目（1-10） |
| steps_for_current_station | INTEGER NOT NULL | 合目達成までの歩数 |
| updated_at | TEXT NOT NULL | 更新日時 |
| is_synced | INTEGER | 同期済みフラグ |

### 7. streaks テーブル
ストリーク管理

```sql
CREATE TABLE streaks (
  user_id TEXT PRIMARY KEY,
  current_streak INTEGER NOT NULL,
  max_streak INTEGER NOT NULL,
  freeze_days_used INTEGER NOT NULL,
  last_completion_date TEXT NOT NULL,
  start_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## API

### LocalDataSource

シングルトンパターンで実装。`LocalDataSource.getInstance()` でインスタンス取得。

#### 初期化

```typescript
const localDataSource = LocalDataSource.getInstance();
await localDataSource.initialize();
```

#### Goal操作

```typescript
// 目標を保存
await localDataSource.saveGoal(goal);

// ユーザーの目標を取得
const goal = await localDataSource.getGoal(userId);
```

#### Quest操作

```typescript
// クエスト一覧を保存
await localDataSource.saveQuests(quests);

// 今日のクエストを取得（有効期限内）
const todayQuests = await localDataSource.getTodayQuests();

// 特定のクエストを取得
const quest = await localDataSource.getQuest(questId);
```

#### QuestLog操作

```typescript
// クエスト完了ログを保存
await localDataSource.saveQuestLog(log);

// ユーザーのログ一覧を取得
const logs = await localDataSource.getQuestLogs(userId, limit);
```

#### UserProgress操作

```typescript
// ユーザー進捗を保存
await localDataSource.saveUserProgress(progress);

// ユーザー進捗を取得
const progress = await localDataSource.getUserProgress(userId);
```

#### Milestone操作

```typescript
// マイルストーン一覧を保存
await localDataSource.saveMilestones(milestones);

// 目標のマイルストーンを取得
const milestones = await localDataSource.getMilestones(goalId);
```

### StorageManager

AsyncStorage のラッパークラス。静的メソッドで簡単にアクセス。

#### 基本的な使用方法

```typescript
import { StorageManager } from '@/shared/utils/StorageManager';

// 文字列を保存・取得
await StorageManager.setString('key', 'value');
const value = await StorageManager.getString('key');

// JSON オブジェクトを保存・取得
await StorageManager.setObject('user', { id: '123', name: 'John' });
const user = await StorageManager.getObject('user');

// 数値を保存・取得
await StorageManager.setNumber('count', 42);
const count = await StorageManager.getNumber('count');

// ブール値を保存・取得
await StorageManager.setBoolean('isLoggedIn', true);
const isLoggedIn = await StorageManager.getBoolean('isLoggedIn');
```

#### 認証トークン管理

```typescript
// トークンを保存
await StorageManager.setAuthToken('jwt_token_here');
const token = await StorageManager.getAuthToken();

// 認証情報をクリア
await StorageManager.clearAuthData();
```

#### ユーティリティ

```typescript
// すべてのキーを取得
const keys = await StorageManager.getAllKeys();

// キーを削除
await StorageManager.removeKey('key');

// 複数のキーを削除
await StorageManager.removeKeys(['key1', 'key2']);

// すべてをクリア（デバッグ用）
await StorageManager.clearAll();
```

## DatabaseManager

アプリケーション全体でのデータベース初期化を管理します。

```typescript
import { DatabaseManager } from '@/core/data/DatabaseManager';

// アプリ起動時に初期化（App.tsx で実施）
const dbManager = DatabaseManager.getInstance();
await dbManager.initialize();

// ローカルデータソースを取得
const localDataSource = dbManager.getLocalDataSource();
```

## ファイル構成

```
src/
├── core/
│   └── data/
│       ├── datasources/
│       │   ├── LocalDataSource.ts    # SQLite + AsyncStorage 実装
│       │   └── index.ts
│       ├── DatabaseManager.ts        # 初期化管理
│       └── index.ts
└── shared/
    └── utils/
        ├── StorageManager.ts         # AsyncStorage ラッパー
        └── index.ts
```

## 使用例

### 目標を保存・取得

```typescript
import { LocalDataSource } from '@/core/data/datasources';
import { Goal, GoalStatus } from '@/core/domain/entities';

const localDataSource = LocalDataSource.getInstance();

const goal: Goal = {
  id: 'goal-123',
  userId: 'user-456',
  title: 'TOEIC 800点を取得する',
  kpi: 'TOEIC 800点以上',
  duration: '6ヶ月',
  obstacles: ['時間がない', '継続が難しい'],
  plans: ['毎日30分勉強', 'アプリで学習'],
  status: GoalStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date()
};

// 保存
await localDataSource.saveGoal(goal);

// 取得
const savedGoal = await localDataSource.getGoal('user-456');
```

### クエストを保存・取得

```typescript
import { Quest, QuestType, QuestDifficulty, QuestStatus, EvidenceType } from '@/core/domain/entities';

const quest: Quest = {
  id: 'quest-123',
  questBundleId: 'bundle-123',
  type: QuestType.SMALL,
  title: '英単語を30個覚える',
  description: '指定された単語リストから30個を暗記',
  estimatedTime: 30,
  difficulty: QuestDifficulty.EASY,
  completionCriteria: '30個全て正解',
  evidenceType: EvidenceType.IMAGE,
  contributesToStation: 1,
  order: 1,
  status: QuestStatus.PENDING,
  createdAt: new Date(),
  validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
};

// 保存
await localDataSource.saveQuests([quest]);

// 取得
const todayQuests = await localDataSource.getTodayQuests();
```

### クエスト完了をログ

```typescript
import { QuestLog } from '@/core/domain/entities';

const log: QuestLog = {
  id: 'log-123',
  questId: 'quest-123',
  userId: 'user-456',
  status: QuestStatus.COMPLETED,
  actualTime: 25,
  evidenceUrl: 'https://example.com/image.jpg',
  stepsEarned: 50,
  completedAt: new Date(),
  createdAt: new Date(),
  isSynced: false
};

// 保存
await localDataSource.saveQuestLog(log);

// 取得
const logs = await localDataSource.getQuestLogs('user-456', 10);
```

## オフライン対応

`is_synced` フラグでサーバーとの同期状態を管理：

- `is_synced = 0`: ローカルのみ（未同期）
- `is_synced = 1`: サーバーと同期済み

同期時には未同期データを抽出し、バックエンドAPI経由でサーバーに送信します。

## パフォーマンス考慮事項

1. **インデックス**: 頻繁に検索されるカラムにインデックスを作成
2. **トランザクション**: 複数レコード操作時にトランザクション使用
3. **バッチ操作**: 複数レコード保存時は一括処理
4. **キャッシング**: React Query でメモリキャッシング

## データ整合性

- 外部キー制約で参照整合性を確保
- `created_at`, `updated_at` で変更履歴を記録
- `is_synced` でレプリケーション状態を管理

---

**作成日**: 2025-10-22
**タスク**: 1.3 SQLite + AsyncStorage セットアップ
**ステータス**: ✅ 完了
