# Issue解決ガイド - Week 4完了後

**作成日**: 2025-10-23  
**対象**: タスク7.5完了後のIssue修正作業  
**推定所要時間**: 1.5〜2.5時間

---

## 📋 解決すべきIssue一覧

| ID | タイトル | 優先度 | 推定時間 | 必須度 |
|----|---------|--------|---------|--------|
| TEST-002 | 空のモジュールエクスポート | 🟢 Low | 5分 | ✅ 必須 |
| TEST-001 | テストフレームワークの不一致 | 🔴 High | 15〜20分 | ✅ 必須 |
| ARCH-002 | React Native SQLiteスキーマ | 🟡 Medium | 1〜2時間 | ⚠️ 推奨 |

**合計推定時間**: 1.5〜2.5時間

---

## 🎯 解決の目的

### Week 4完了後にIssueを解決する理由:
- ✅ タスク7.1-7.5の実装が完了している
- ✅ 実装コードに影響を与えずにIssue修正が可能
- ✅ Phase 1完了前に品質を向上させる

### 解決後の効果:
- ✅ 全テストが正常に実行可能（13個のテストスイート修正）
- ✅ 型エラー0件（約20個の型エラー解消）
- ✅ データベーススキーマのドキュメント完備
- ✅ Phase 1の品質保証

---

## 📝 Issue解決手順

### **ステップ1: TEST-002を解決（5分）** 🟢

**問題**: 空のモジュールエクスポートによる型エラー約20個

**解決方法**: 未実装モジュールの空index.tsファイルを削除

```bash
# mobile ディレクトリに移動
cd mobile

# 空のindex.tsファイルを削除
rm src/features/progress/index.ts
rm src/features/quest/index.ts
rm src/features/ranking/index.ts
rm src/features/settings/index.ts
rm src/services/notification/index.ts
rm src/services/health/index.ts
rm src/services/analytics/index.ts
rm src/services/crashlytics/index.ts
rm src/shared/components/index.ts
rm src/shared/hooks/index.ts
rm src/shared/constants/index.ts
rm src/shared/types/index.ts
rm src/shared/theme/index.ts
```

**確認方法**:
```bash
# TypeScript型チェック
npx tsc --noEmit

# エラーが0件になることを確認
```

**期待される結果**:
- ✅ 型エラー約20個が解消
- ✅ TypeScriptコンパイルエラー0件

---

### **ステップ2: TEST-001を解決（15〜20分）** 🔴

**問題**: VitestとJestの混在により13個のテストスイートが失敗

**影響を受けるファイル（13ファイル）**:
```
src/core/network/__tests__/
├── networkIntegration.test.ts
└── networkE2E.test.ts

src/features/auth/__tests__/
├── LoginScreen.test.tsx
└── SignUpScreen.test.tsx

src/features/goals/__tests__/
└── goals.test.ts

src/services/auth/__tests__/
├── BiometricAuth.test.ts
└── SecureTokenStore.test.ts

その他6ファイル
```

**解決方法**: Vitestインポートを削除し、Jestに統一

#### 2-1. 影響を受けるファイルを検索

```bash
# Vitestインポートを含むファイルを検索
grep -r "from 'vitest'" src --include="*.test.ts" --include="*.test.tsx"
```

#### 2-2. 各ファイルを修正

**修正前**:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('MyComponent', () => {
  it('should work', () => {
    const mockFn = vi.fn();
    // ...
  });
});
```

**修正後**:
```typescript
// describe, it, expect, beforeEach はグローバルで利用可能（Jestの場合）
// Vitestインポートを削除

describe('MyComponent', () => {
  it('should work', () => {
    const mockFn = jest.fn(); // vi → jest に変更
    // ...
  });
});
```

#### 2-3. 一括置換（推奨）

```bash
# Vitestインポート行を削除（手動で各ファイルを確認しながら）
# vi.fn() → jest.fn() に置換
# vi.mock() → jest.mock() に置換
# vi.spyOn() → jest.spyOn() に置換
```

#### 2-4. テスト実行で確認

```bash
# 全テストを実行
npm test

# 期待される結果:
# Test Suites: 16 passed, 16 total
# Tests:       106 passed, 106 total
```

**期待される結果**:
- ✅ 13個のテストスイートが正常に実行
- ✅ 全テストが合格（106 passed）

---

### **ステップ3: ARCH-002を解決（1〜2時間）** 🟡

**問題**: React Native SQLiteスキーマがDATABASE.mdに記載されていない

**解決方法**: DATABASE.mdにReact Native SQLiteスキーマセクションを追加

#### 3-1. DATABASE.mdを開く

```bash
# エディタでDATABASE.mdを開く
code docs/DATABASE.md
```

#### 3-2. 以下のセクションを追加

**追加場所**: iOS Core Dataスキーマの後

**追加内容**:

```markdown
---

## React Native SQLite スキーマ

### 概要

React Nativeモバイルアプリ版では、`expo-sqlite`を使用してローカルデータベースを管理します。

### データベース初期化

```typescript
// mobile/src/core/data/datasources/LocalDataSource.ts
async initializeDatabase(): Promise<void> {
  await this.db.execAsync('PRAGMA foreign_keys = ON;');
  
  await this.db.execAsync(`
    -- Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      anonymous_id TEXT UNIQUE,
      consent_timestamp TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_users_anonymous_id ON users(anonymous_id);

    -- Goals Table
    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      kpi TEXT NOT NULL,
      duration TEXT NOT NULL,
      deadline TEXT,
      obstacles TEXT,
      plans TEXT,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status);

    -- Milestones Table
    CREATE TABLE IF NOT EXISTS milestones (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      station INTEGER NOT NULL CHECK (station >= 1 AND station <= 10),
      title TEXT NOT NULL,
      description TEXT,
      estimated_duration TEXT,
      achievement_criteria TEXT,
      status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
      completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0,
      FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_milestones_goal_id ON milestones(goal_id);
    CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_milestones_goal_station ON milestones(goal_id, station);

    -- User Profiles Table
    CREATE TABLE IF NOT EXISTS user_profiles (
      user_id TEXT PRIMARY KEY,
      daily_commit_time TEXT NOT NULL,
      lifestyle TEXT,
      focus_time TEXT,
      work_environment TEXT,
      task_pace TEXT,
      past_failure_reason TEXT,
      skill_level TEXT,
      difficulty_preference TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

    -- Quests Table
    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      quest_bundle_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      estimated_time INTEGER NOT NULL,
      difficulty TEXT NOT NULL,
      completion_criteria TEXT NOT NULL,
      evidence_type TEXT NOT NULL,
      contributes_to_station INTEGER NOT NULL,
      order_num INTEGER NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      valid_until TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_quests_quest_bundle_id ON quests(quest_bundle_id);
    CREATE INDEX IF NOT EXISTS idx_quests_status ON quests(status);

    -- User Progress Table
    CREATE TABLE IF NOT EXISTS user_progress (
      user_id TEXT PRIMARY KEY,
      total_steps INTEGER NOT NULL,
      current_streak INTEGER NOT NULL,
      max_streak INTEGER NOT NULL,
      freeze_days_remaining INTEGER NOT NULL,
      last_activity_date TEXT NOT NULL,
      current_station INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

    -- Quest Logs Table
    CREATE TABLE IF NOT EXISTS quest_logs (
      id TEXT PRIMARY KEY,
      quest_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      status TEXT NOT NULL,
      actual_time INTEGER,
      skip_reason TEXT,
      skip_memo TEXT,
      obstacle TEXT,
      obstacle_details TEXT,
      contingency_plan TEXT,
      evidence_type TEXT,
      evidence_url TEXT,
      evidence_note TEXT,
      memo TEXT,
      steps_earned INTEGER NOT NULL,
      completed_at TEXT,
      created_at TEXT NOT NULL,
      is_synced INTEGER DEFAULT 0,
      FOREIGN KEY (quest_id) REFERENCES quests(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_quest_logs_quest_id ON quest_logs(quest_id);
    CREATE INDEX IF NOT EXISTS idx_quest_logs_user_id ON quest_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_quest_logs_created_at ON quest_logs(created_at);
  `);
}
```

### データ型マッピング

| PostgreSQL | SQLite | 備考 |
|-----------|--------|------|
| VARCHAR(255) | TEXT | SQLiteはVARCHARをサポートしない |
| INTEGER | INTEGER | 同じ |
| TIMESTAMP | TEXT | ISO 8601形式の文字列 |
| DATE | TEXT | ISO 8601形式の文字列 |
| BOOLEAN | INTEGER | 0=false, 1=true |
| JSONB | TEXT | JSON文字列として保存 |

### 実装ノート

#### 1. 日付の扱い

```typescript
// 保存時
const createdAt = new Date().toISOString(); // "2025-10-23T12:34:56.789Z"

// 読み込み時
const date = new Date(result.created_at);
```

#### 2. JSON配列の扱い

```typescript
// 保存時
const obstaclesJson = JSON.stringify(['時間不足', 'モチベーション低下']);

// 読み込み時
const obstacles = JSON.parse(result.obstacles);
```

#### 3. 外部キー制約

```typescript
// 外部キー制約を有効化
await this.db.execAsync('PRAGMA foreign_keys = ON;');
```

#### 4. 同期フラグ

```typescript
// 未同期データの取得
const unsyncedGoals = await this.db.getAllAsync(
  'SELECT * FROM goals WHERE is_synced = 0'
);
```

### スキーマ比較表

| Table | PostgreSQL | iOS Core Data | React Native SQLite |
|-------|-----------|---------------|---------------------|
| users | ✅ | ❌ | ✅ |
| goals | ✅ | ✅ | ✅ |
| milestones | ✅ | ✅ | ✅ |
| user_profiles | ✅ | ✅ | ✅ |
| quests | ✅ | ✅ | ✅ |
| quest_logs | ✅ | ✅ | ✅ |
| user_progress | ✅ | ✅ | ✅ |
```

#### 3-3. 保存して確認

```bash
# DATABASE.mdを保存
# 内容を確認
cat docs/DATABASE.md
```

**期待される結果**:
- ✅ DATABASE.mdにReact Native SQLiteスキーマが追加
- ✅ スキーマ比較表が完備
- ✅ データ型マッピングが明確化

---

## ✅ 完了チェックリスト

### Issue解決完了の確認:

- [ ] **TEST-002解決**: 空のindex.tsファイルを削除完了
  - [ ] `npx tsc --noEmit`で型エラー0件を確認

- [ ] **TEST-001解決**: Vitestインポートを修正完了
  - [ ] 13ファイルすべて修正完了
  - [ ] `npm test`で全テスト合格を確認
  - [ ] Test Suites: 16 passed, 16 total

- [ ] **ARCH-002解決**: DATABASE.md更新完了
  - [ ] React Native SQLiteスキーマセクション追加
  - [ ] スキーマ比較表追加
  - [ ] データ型マッピング追加

### Phase 1完了の確認:

- [ ] 全テストが正常に実行可能
- [ ] 型エラー0件
- [ ] ドキュメント完備
- [ ] Week 4のマイルストーン「MVP完成」達成

---

## 📊 解決後の効果

### Before（Issue未解決）:
- ❌ 13個のテストスイートが失敗
- ❌ 型エラー約20個
- ❌ スキーマドキュメント不足

### After（Issue解決後）:
- ✅ 全テストが正常に実行（16 passed）
- ✅ 型エラー0件
- ✅ ドキュメント完備
- ✅ Phase 1の品質保証

---

## 🚀 次のステップ

Issue解決完了後:

1. **Phase 1完了の確認**
   - 全機能が動作することを確認
   - テストカバレッジを確認

2. **Week 5（Phase 2）の準備**
   - タスク8.1: NotificationServiceの実装
   - プッシュ通知機能の開発開始

3. **KNOWN_ISSUES.mdの更新**
   - 解決済みIssueのステータスを更新
   - 新たに発見されたIssueがあれば追加

---

## 📝 トラブルシューティング

### TEST-001修正時のよくある問題:

**問題**: `vi is not defined`エラー
```typescript
ReferenceError: vi is not defined
```

**解決**: `vi`を`jest`に置換し忘れている
```typescript
// 修正前
const mockFn = vi.fn();

// 修正後
const mockFn = jest.fn();
```

---

**問題**: Vitestインポートが残っている
```typescript
Cannot find module 'vitest'
```

**解決**: Vitestインポート行を削除
```typescript
// 削除
import { describe, it, expect, beforeEach, vi } from 'vitest';
```

---

## 📞 サポート

Issue解決中に問題が発生した場合:

1. エラーメッセージを確認
2. 上記のトラブルシューティングを参照
3. 必要に応じてチームに相談

---

**作成者**: Development Team  
**最終更新**: 2025-10-23  
**対象フェーズ**: Phase 1（Week 4完了後）
