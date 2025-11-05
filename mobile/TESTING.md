# テスト戦略とセットアップ

## 概要

climb-youモバイルアプリケーションは、複数レベルのテストを実装します：
- **ユニットテスト** (Jest) - ビジネスロジック、ユーティリティの検証
- **コンポーネントテスト** (React Native Testing Library) - UI コンポーネントの検証
- **E2E テスト** (Detox / 将来) - 完全なユーザーフロー検証

## テストツール

### インストール済みパッケージ

```json
{
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@testing-library/react-native": "^12.4.0",
    "@testing-library/jest-native": "^5.4.0",
    "jest": "^29.7.0",
    "jest-environment-node": "^29.7.0"
  }
}
```

## ディレクトリ構造

テストファイルは各モジュール内の `__tests__` ディレクトリに配置：

```
src/
├── core/
│   └── data/
│       ├── datasources/
│       │   ├── LocalDataSource.ts
│       │   └── __tests__/
│       │       └── LocalDataSource.test.ts
│       ├── __tests__/
│       │   └── DatabaseManager.test.ts
│       └── DatabaseManager.ts
├── shared/
│   └── utils/
│       ├── StorageManager.ts
│       └── __tests__/
│           └── StorageManager.test.ts
└── features/
    └── {feature}/
        ├── screens/
        │   └── __tests__/
        │       └── {Screen}.test.tsx
        └── hooks/
            └── __tests__/
                └── {hook}.test.ts
```

## 実行方法

### すべてのテストを実行

```bash
npm test
```

### ウォッチモード（ファイル変更時に自動再実行）

```bash
npm run test:watch
```

### カバレッジレポート付きで実行

```bash
npm run test:coverage
```

### 特定のテストファイルのみ実行

```bash
npm test -- LocalDataSource.test.ts
npm test -- StorageManager.test.ts
```

### 特定のテストスイートのみ実行

```bash
npm test -- --testNamePattern="LocalDataSource"
npm test -- --testNamePattern="String operations"
```

## Jest 設定

### jest.config.js

```javascript
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
```

**主な設定:**
- `preset: 'react-native'` - React Native 向けプリセット
- `moduleNameMapper` - パスエイリアス `@/` をサポート
- `coverageThreshold` - カバレッジ最小要件（50%）
- `setupFilesAfterEnv` - テスト前の環境設定

### jest.setup.js

テスト環境の初期化：
- React Native Testing Library の拡張をロード
- Expo/React Native API のモック
- コンソール警告のフィルタリング

## テストファイル構成

### 1. LocalDataSource.test.ts

**テスト対象:** `src/core/data/datasources/LocalDataSource.ts`

**テストスイート:**
- `initialization` - シングルトンパターン、DB初期化
- `Goal operations` - 目標の保存・取得
- `Quest operations` - クエストの保存・取得
- `QuestLog operations` - クエスト完了ログの保存・取得
- `UserProgress operations` - ユーザー進捗の管理
- `Milestone operations` - マイルストーンの管理
- `Sync status tracking` - 同期状態の追跡

**サンプルテスト:**
```typescript
it('should save and retrieve a goal', async () => {
  const goal: Goal = {
    id: 'goal-1',
    userId: 'user-1',
    title: 'Learn TypeScript',
    // ... その他のプロパティ
  };

  await localDataSource.saveGoal(goal);
  const retrieved = await localDataSource.getGoal('user-1');

  expect(retrieved).toEqual(goal);
});
```

### 2. StorageManager.test.ts

**テスト対象:** `src/shared/utils/StorageManager.ts`

**テストスイート:**
- `String operations` - 文字列の保存・取得
- `Object operations` - JSON オブジェクトの保存・取得
- `Number operations` - 数値の保存・取得
- `Boolean operations` - ブール値の保存・取得
- `Key management` - キーの管理
- `Authentication operations` - 認証情報の管理
- `User-specific operations` - ユーザー設定の管理
- `Sync-specific operations` - 同期状態の管理
- `Error handling` - エラー処理

**サンプルテスト:**
```typescript
it('should set and get string value', async () => {
  const mockSetItem = jest.fn().mockResolvedValue(undefined);
  const mockGetItem = jest.fn().mockResolvedValue('test-value');

  (AsyncStorage.setItem as jest.Mock) = mockSetItem;
  (AsyncStorage.getItem as jest.Mock) = mockGetItem;

  await StorageManager.setString('key', 'value');
  expect(mockSetItem).toHaveBeenCalledWith('key', 'value');

  const value = await StorageManager.getString('key');
  expect(value).toBe('test-value');
});
```

### 3. DatabaseManager.test.ts

**テスト対象:** `src/core/data/DatabaseManager.ts`

**テストスイート:**
- `Singleton pattern` - シングルトンパターン検証
- `initialization` - DB初期化
- `Status checking` - 初期化状態確認
- `LocalDataSource access` - LocalDataSource への アクセス

## モックとスタブ

### Expo SQLite のモック

```typescript
jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
  SQLiteDatabase: jest.fn(),
}));
```

### AsyncStorage のモック

```typescript
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  getAllKeys: jest.fn(),
  multiRemove: jest.fn(),
  clear: jest.fn(),
}));
```

## テストベストプラクティス

### 1. AAA パターン（Arrange-Act-Assert）

```typescript
it('should complete quest and earn steps', async () => {
  // Arrange: テストデータを準備
  const quest = createMockQuest();
  const expectedSteps = 50;

  // Act: テスト対象の操作を実行
  await localDataSource.saveQuest(quest);
  const result = await localDataSource.getQuest(quest.id);

  // Assert: 結果を検証
  expect(result.id).toBe(quest.id);
});
```

### 2. 独立したテストケース

各テストは独立して実行可能：
```typescript
beforeEach(() => {
  jest.clearAllMocks();
  // テスト固有のセットアップ
});

afterEach(() => {
  // テスト固有のクリーンアップ
});
```

### 3. 説明的なテスト名

```typescript
// ✅ Good
it('should return empty list when no quests for today', async () => {});

// ❌ Bad
it('test getQuests', async () => {});
```

### 4. スナップショットテストの回避

データベースやストレージをテストする場合、スナップショットテストは避け、具体的な検証を行う。

### 5. エラーケースのテスト

```typescript
it('should handle errors when database fails', async () => {
  (LocalDataSource.prototype.getGoal as jest.Mock).mockRejectedValue(
    new Error('Database error')
  );

  await expect(localDataSource.getGoal('user-1')).rejects.toThrow(
    'Database error'
  );
});
```

## カバレッジ目標

### Phase 1（現在）
- **全体**: 50%以上
- **Core レイヤー**: 80%以上
- **Domain エンティティ**: 100%（型定義のため自動達成）

### Phase 2 以降
- **全体**: 70%以上
- **UI コンポーネント**: 60%以上
- **ビジネスロジック**: 80%以上

### カバレッジレポート確認

```bash
npm run test:coverage
```

レポートは `coverage/lcov-report/index.html` で確認可能：
```bash
# macOS
open coverage/lcov-report/index.html

# Windows (VS Code)
code coverage/lcov-report/index.html
```

## CI/CD 統合

### GitHub Actions（将来）

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v3
```

## トラブルシューティング

### テストが見つからない場合

ファイル名が `*.test.ts` または `*.test.tsx` で終わることを確認：
```
✅ LocalDataSource.test.ts
❌ LocalDataSource.spec.ts
❌ LocalDataSource_test.ts
```

### モックが効かない場合

モックの定義順序を確認（import の前に jest.mock()）：
```typescript
// ✅ Correct
jest.mock('expo-sqlite');
import { LocalDataSource } from '../LocalDataSource';

// ❌ Wrong
import { LocalDataSource } from '../LocalDataSource';
jest.mock('expo-sqlite');
```

### メモリリーク警告

各テスト後に確実にクリーンアップ：
```typescript
afterEach(async () => {
  await jest.clearAllMocks();
  await jest.resetModules();
});
```

## 拡張テスト（Phase 2+）

### E2E テスト（Detox）

```typescript
describe('Onboarding Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should complete onboarding', async () => {
    await element(by.id('goal-input')).typeText('TOEIC 800点');
    await element(by.id('next-button')).tap();
    await expect(element(by.text('マイルストーン'))).toBeVisible();
  });
});
```

### パフォーマンステスト

```typescript
it('should load today quests within 1 second', async () => {
  const startTime = performance.now();
  await localDataSource.getTodayQuests();
  const endTime = performance.now();

  expect(endTime - startTime).toBeLessThan(1000);
});
```

### ネットワークテスト

```typescript
describe('Offline functionality', () => {
  it('should work when network is unavailable', async () => {
    // オフライン状態をシミュレート
    mockNetworkError();

    const quests = await localDataSource.getTodayQuests();
    expect(quests).toBeDefined();
  });
});
```

## 参考リンク

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Detox E2E Testing](https://wix.github.io/Detox/)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)

---

**作成日**: 2025-10-22
**タスク**: 1.4 基本的なテストセットアップ
**ステータス**: ✅ 完了
