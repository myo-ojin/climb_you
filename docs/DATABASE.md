# データベース設計

## 概要

climb-youは以下のデータベースを使用します：

- **PostgreSQL**: メインデータベース（バックエンドAPI）
- **Core Data**: iOSローカルデータベース（オフライン対応）
- **CloudKit**: iCloud同期（オプション、iOS）

## ER図

```
Users (ユーザー)
├── id (PK)
├── anonymous_id (UNIQUE)
├── consent_timestamp
└── created_at

Goals (長期目標)
├── id (PK)
├── user_id (FK → Users)
├── title
├── kpi
├── duration
├── deadline
├── expected_outcome (WOOP)
├── anticipated_obstacle (WOOP)
├── contingency_plan (WOOP)
└── status

Milestones (マイルストーン)
├── id (PK)
├── goal_id (FK → Goals)
├── station (1-10)
├── title
├── description
├── estimated_duration
├── completion_criteria
└── status

UserProfiles (ユーザープロファイル)
├── id (PK)
├── user_id (FK → Users)
├── daily_commit_time
├── lifestyle
├── focus_time
├── work_environment
├── task_pace
├── past_failure_reason
├── skill_level
└── difficulty_preference

QuestBundles (クエストバンドル)
├── id (PK)
├── user_id (FK → Users)
├── generated_at
├── valid_until
└── total_estimated_time

Quests (クエスト)
├── id (PK)
├── quest_bundle_id (FK → QuestBundles)
├── type (small/medium/validation)
├── title
├── description
├── estimated_time
├── difficulty
├── completion_criteria
├── evidence_type
└── contributes_to_station

QuestLogs (クエストログ)
├── id (PK)
├── quest_id (FK → Quests)
├── user_id (FK → Users)
├── status (completed/skipped/obstructed)
├── actual_time
├── evidence
├── skip_reason
└── obstacle

ClimbingProgress (登頂進捗)
├── id (PK)
├── user_id (FK → Users)
├── total_steps
├── current_station
└── station_progress

Streaks (ストリーク)
├── id (PK)
├── user_id (FK → Users)
├── current_streak
├── max_streak
└── last_updated

SuccessPatterns (成功パターン)
├── id (PK)
├── user_id (FK → Users)
├── quest_type
├── success_rate
├── preferred_difficulty
└── preferred_duration

FailurePatterns (失敗パターン)
├── id (PK)
├── user_id (FK → Users)
├── common_failure_reasons (JSONB)
├── problematic_quest_types (JSONB)
└── common_obstacles (JSONB)
```

## テーブル定義

### Users

```sql
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  anonymous_id VARCHAR(255) UNIQUE NOT NULL,
  consent_timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_anonymous_id ON users(anonymous_id);
```

### Goals

```sql
CREATE TABLE goals (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  kpi TEXT NOT NULL,
  duration VARCHAR(100) NOT NULL,
  deadline DATE,
  expected_outcome TEXT,
  anticipated_obstacle TEXT,
  contingency_plan TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'abandoned')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_status ON goals(status);
```

### Milestones

```sql
CREATE TABLE milestones (
  id VARCHAR(255) PRIMARY KEY,
  goal_id VARCHAR(255) NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  station INTEGER NOT NULL CHECK (station >= 1 AND station <= 10),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  estimated_duration VARCHAR(100),
  completion_criteria TEXT,
  status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(goal_id, station)
);

CREATE INDEX idx_milestones_goal_id ON milestones(goal_id);
CREATE INDEX idx_milestones_status ON milestones(status);
```

### UserProfiles

```sql
CREATE TABLE user_profiles (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  daily_commit_time VARCHAR(50) NOT NULL,
  lifestyle VARCHAR(100),
  focus_time VARCHAR(100),
  work_environment VARCHAR(100),
  task_pace VARCHAR(100),
  past_failure_reason VARCHAR(200),
  skill_level VARCHAR(100),
  difficulty_preference VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
```

### QuestBundles

```sql
CREATE TABLE quest_bundles (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  generated_at TIMESTAMP NOT NULL,
  valid_until TIMESTAMP NOT NULL,
  total_estimated_time INTEGER NOT NULL,
  difficulty VARCHAR(50) NOT NULL,
  is_adjusted BOOLEAN DEFAULT FALSE,
  adjustments JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quest_bundles_user_id ON quest_bundles(user_id);
CREATE INDEX idx_quest_bundles_generated_at ON quest_bundles(generated_at);
```

### Quests

```sql
CREATE TABLE quests (
  id VARCHAR(255) PRIMARY KEY,
  quest_bundle_id VARCHAR(255) NOT NULL REFERENCES quest_bundles(id) ON DELETE CASCADE,
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

CREATE INDEX idx_quests_quest_bundle_id ON quests(quest_bundle_id);
CREATE INDEX idx_quests_status ON quests(status);
```

### QuestLogs

```sql
CREATE TABLE quest_logs (
  id VARCHAR(255) PRIMARY KEY,
  quest_id VARCHAR(255) NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL CHECK (status IN ('completed', 'skipped', 'obstructed')),
  actual_time INTEGER,
  evidence_url TEXT,
  evidence_note TEXT,
  skip_reason VARCHAR(200),
  obstacle TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_quest_logs_quest_id ON quest_logs(quest_id);
CREATE INDEX idx_quest_logs_user_id ON quest_logs(user_id);
CREATE INDEX idx_quest_logs_created_at ON quest_logs(created_at);
```

### ClimbingProgress

```sql
CREATE TABLE climbing_progress (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_steps INTEGER DEFAULT 0,
  current_station INTEGER DEFAULT 0 CHECK (current_station >= 0 AND current_station <= 10),
  station_progress DECIMAL(5, 2) DEFAULT 0.00 CHECK (station_progress >= 0 AND station_progress <= 100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_climbing_progress_user_id ON climbing_progress(user_id);
```

### Streaks

```sql
CREATE TABLE streaks (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  max_streak INTEGER DEFAULT 0,
  last_updated DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_streaks_user_id ON streaks(user_id);
```

### SuccessPatterns

```sql
CREATE TABLE success_patterns (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_type VARCHAR(50),
  success_rate DECIMAL(3, 2),
  preferred_time_of_day VARCHAR(50),
  preferred_difficulty VARCHAR(50),
  preferred_duration INTEGER,
  preferred_quest_style VARCHAR(50),
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_success_patterns_user_id ON success_patterns(user_id);
```

### FailurePatterns

```sql
CREATE TABLE failure_patterns (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  common_failure_reasons JSONB,
  problematic_quest_types JSONB,
  problematic_days_of_week JSONB,
  common_obstacles JSONB,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE INDEX idx_failure_patterns_user_id ON failure_patterns(user_id);
```

## マイグレーション

### ディレクトリ構造

```
database/
├── migrations/
│   ├── 001_create_users.sql
│   ├── 002_create_goals.sql
│   ├── 003_create_milestones.sql
│   ├── 004_create_user_profiles.sql
│   ├── 005_create_quest_bundles.sql
│   ├── 006_create_quests.sql
│   ├── 007_create_quest_logs.sql
│   ├── 008_create_climbing_progress.sql
│   ├── 009_create_streaks.sql
│   ├── 010_create_success_patterns.sql
│   └── 011_create_failure_patterns.sql
└── seeds/
    └── 001_sample_data.sql
```

### マイグレーション実行

```bash
# マイグレーション実行
npm run db:migrate

# ロールバック
npm run db:rollback

# シードデータ投入
npm run db:seed
```

## インデックス戦略

### 主要なクエリパターン

1. **ユーザーIDでの検索** - 最も頻繁
2. **日付範囲での検索** - ログ、統計
3. **ステータスでのフィルタリング** - アクティブなクエスト

### インデックス一覧

- `users.anonymous_id` - ユーザー認証
- `goals.user_id` - ユーザーの目標取得
- `quests.quest_bundle_id` - バンドルのクエスト取得
- `quest_logs.created_at` - 日付範囲検索

## データ保持ポリシー

- **QuestLogs**: 180日間保持、その後自動削除
- **Goals**: ユーザー削除まで保持
- **Milestones**: ユーザー削除まで保持
- **SuccessPatterns/FailurePatterns**: 定期的に更新

## バックアップ

### 自動バックアップ

```bash
# 毎日午前3時に実行
0 3 * * * pg_dump climb_you > /backups/climb_you_$(date +\%Y\%m\%d).sql
```

### 手動バックアップ

```bash
# バックアップ作成
pg_dump -h localhost -U user climb_you > backup.sql

# リストア
psql -h localhost -U user climb_you < backup.sql
```

## パフォーマンス最適化

### クエリ最適化

```sql
-- EXPLAIN ANALYZEで実行計画を確認
EXPLAIN ANALYZE
SELECT * FROM quests WHERE quest_bundle_id = 'bundle_123';

-- 遅いクエリを特定
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### コネクションプール

```javascript
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## iOS Core Data スキーマ

### 概要

iOSアプリ版では、オフライン対応のためにCore Dataを使用してローカルデータを管理します。Core DataのスキーマはPostgreSQLのスキーマと対応していますが、以下の違いがあります：

- **同期フラグ**: `isSynced`属性で未同期データを追跡
- **データ範囲**: 必要最小限のデータのみをローカルに保存
- **リレーションシップ**: Core Dataのリレーションシップを活用

### Core Data Entities

#### GoalEntity

```swift
@objc(GoalEntity)
public class GoalEntity: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var userId: String
    @NSManaged public var title: String
    @NSManaged public var kpi: String
    @NSManaged public var duration: String
    @NSManaged public var deadline: Date?
    @NSManaged public var obstacles: Data // JSON encoded [String]
    @NSManaged public var plans: Data // JSON encoded [String]
    @NSManaged public var status: String
    @NSManaged public var createdAt: Date
    @NSManaged public var updatedAt: Date
    @NSManaged public var isSynced: Bool
    @NSManaged public var milestones: NSSet? // Relationship to MilestoneEntity
}
```

#### MilestoneEntity

```swift
@objc(MilestoneEntity)
public class MilestoneEntity: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var goalId: String
    @NSManaged public var station: Int16
    @NSManaged public var title: String
    @NSManaged public var milestoneDescription: String
    @NSManaged public var estimatedDuration: String
    @NSManaged public var completionCriteria: String
    @NSManaged public var status: String
    @NSManaged public var completedAt: Date?
    @NSManaged public var createdAt: Date
    @NSManaged public var updatedAt: Date
    @NSManaged public var isSynced: Bool
    @NSManaged public var goal: GoalEntity? // Relationship to GoalEntity
}
```

#### QuestEntity

```swift
@objc(QuestEntity)
public class QuestEntity: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var questBundleId: String
    @NSManaged public var type: String
    @NSManaged public var title: String
    @NSManaged public var questDescription: String
    @NSManaged public var estimatedTime: Int16
    @NSManaged public var difficulty: String
    @NSManaged public var completionCriteria: String
    @NSManaged public var evidenceType: String
    @NSManaged public var contributesToStation: Int16
    @NSManaged public var order: Int16
    @NSManaged public var status: String
    @NSManaged public var createdAt: Date
    @NSManaged public var validUntil: Date
    @NSManaged public var isSynced: Bool
}
```

#### QuestLogEntity

```swift
@objc(QuestLogEntity)
public class QuestLogEntity: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var questId: String
    @NSManaged public var userId: String
    @NSManaged public var status: String
    @NSManaged public var actualTime: Int16
    @NSManaged public var skipReason: String?
    @NSManaged public var skipMemo: String?
    @NSManaged public var obstacle: String?
    @NSManaged public var obstacleDetails: String?
    @NSManaged public var contingencyPlan: String?
    @NSManaged public var evidenceType: String?
    @NSManaged public var evidenceURL: String?
    @NSManaged public var evidenceNote: String?
    @NSManaged public var memo: String?
    @NSManaged public var stepsEarned: Int16
    @NSManaged public var completedAt: Date?
    @NSManaged public var createdAt: Date
    @NSManaged public var isSynced: Bool
}
```

#### UserProgressEntity

```swift
@objc(UserProgressEntity)
public class UserProgressEntity: NSManagedObject {
    @NSManaged public var userId: String
    @NSManaged public var totalSteps: Int32
    @NSManaged public var currentStreak: Int16
    @NSManaged public var maxStreak: Int16
    @NSManaged public var freezeDaysRemaining: Int16
    @NSManaged public var lastActivityDate: Date
    @NSManaged public var currentStation: Int16
    @NSManaged public var updatedAt: Date
    @NSManaged public var isSynced: Bool
}
```

#### UserProfileEntity

```swift
@objc(UserProfileEntity)
public class UserProfileEntity: NSManagedObject {
    @NSManaged public var id: String
    @NSManaged public var userId: String
    @NSManaged public var dailyCommitTime: String
    @NSManaged public var lifestyle: String?
    @NSManaged public var focusTime: String?
    @NSManaged public var workEnvironment: String?
    @NSManaged public var taskPace: String?
    @NSManaged public var pastFailureReason: String?
    @NSManaged public var skillLevel: String?
    @NSManaged public var difficultyPreference: String?
    @NSManaged public var createdAt: Date
    @NSManaged public var updatedAt: Date
    @NSManaged public var isSynced: Bool
}
```

### Core Data Model (.xcdatamodeld)

Core Dataモデルファイルには以下の設定が含まれます：

**リレーションシップ:**
- `GoalEntity.milestones` ↔ `MilestoneEntity.goal` (One-to-Many)

**Fetch Indexes:**
- `QuestEntity`: `validUntil`, `status`
- `QuestLogEntity`: `createdAt`, `userId`
- `UserProgressEntity`: `userId`

**Delete Rules:**
- `GoalEntity` → `MilestoneEntity`: Cascade
- その他: Nullify

### データ保持ポリシー（iOS）

- **Quests**: 今日と過去7日分のみ保存
- **QuestLogs**: 過去30日分のみ保存
- **Goals/Milestones**: 全て保存
- **UserProfile/Progress**: 全て保存

### 同期戦略

**同期タイミング:**
1. アプリ起動時
2. フォアグラウンド復帰時
3. データ変更後（5秒のデバウンス）
4. バックグラウンド同期（15分ごと）

**同期フロー:**
```
1. ローカルの未同期データ（isSynced = false）を取得
2. サーバーに送信
3. 成功したらisSynced = trueに更新
4. サーバーから最新データを取得
5. ローカルに保存
6. 競合があればサーバー優先で解決
```

**競合解決:**
- サーバー優先（Server Wins）
- ローカルの変更は上書きされる
- 重要な競合はユーザーに通知

### Core Data Stack

```swift
class CoreDataManager {
    static let shared = CoreDataManager()
    
    lazy var persistentContainer: NSPersistentContainer = {
        let container = NSPersistentContainer(name: "ClimbYou")
        container.loadPersistentStores { description, error in
            if let error = error {
                fatalError("Core Data failed to load: \(error.localizedDescription)")
            }
        }
        return container
    }()
    
    var context: NSManagedObjectContext {
        return persistentContainer.viewContext
    }
    
    func saveContext() {
        if context.hasChanges {
            do {
                try context.save()
            } catch {
                let nsError = error as NSError
                fatalError("Unresolved error \(nsError), \(nsError.userInfo)")
            }
        }
    }
}
```

### CloudKit統合（オプション）

iCloud同期を有効にする場合：

```swift
lazy var persistentContainer: NSPersistentCloudKitContainer = {
    let container = NSPersistentCloudKitContainer(name: "ClimbYou")
    
    // CloudKit設定
    guard let description = container.persistentStoreDescriptions.first else {
        fatalError("Failed to retrieve a persistent store description.")
    }
    
    description.cloudKitContainerOptions = NSPersistentCloudKitContainerOptions(
        containerIdentifier: "iCloud.com.climbYou.app"
    )
    
    container.loadPersistentStores { description, error in
        if let error = error {
            fatalError("Core Data failed to load: \(error.localizedDescription)")
        }
    }
    
    return container
}()
```

## 参考リンク

- [システム全体概要](OVERVIEW.md)
- [開発ガイド](DEVELOPMENT.md)
- [iOSアプリ仕様](./.kiro/specs/ios-app/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Core Data Documentation](https://developer.apple.com/documentation/coredata)
- [CloudKit Documentation](https://developer.apple.com/documentation/cloudkit)
