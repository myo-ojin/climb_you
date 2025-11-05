# ネットワークエラーハンドリング実装ガイド

## 概要

ネットワークエラーハンドリングは、アプリケーションの安定性と ユーザー体験を向上させるための重要なシステムです。以下の3つの層で構成されています：

1. **NetworkErrorHandler** - エラー復旧戦略の判定
2. **OfflineManager** - オフライン状態の管理
3. **RetryStrategy** - 自動リトライ実装

## アーキテクチャ

```
┌─────────────────────────────────────┐
│   Application Code                  │
└──────────────┬──────────────────────┘
               │ API Call
      ┌────────▼──────────────┐
      │ RetryStrategy         │
      │ (Auto-retry logic)    │
      └────────┬──────────────┘
               │
      ┌────────▼──────────────┐
      │ HTTP Request          │
      │ (Axios + Interceptors)│
      └────────┬──────────────┘
               │
      ┌────────▼──────────────┐
      │ NetworkErrorHandler   │
      │ (Error analysis)      │
      └────────┬──────────────┘
               │
      ┌────────▼──────────────┐
      │ OfflineManager        │
      │ (Request queue)       │
      └────────┬──────────────┘
               │
      ┌────────▼──────────────┐
      │ Recovery Action       │
      │ (Retry/Offline/Login) │
      └──────────────────────┘
```

## NetworkErrorHandler

### 機能

- **エラーコードから復旧戦略を判定**
- **リトライ可否を判定**
- **エクスポーネンシャルバックオフで遅延を計算**
- **Retry-After ヘッダーをパース**

### 使用例

```typescript
import { NetworkErrorHandler, ErrorRecoveryStrategy } from '@/core/network/utils';

// ハンドラを初期化
const errorHandler = new NetworkErrorHandler({
  maxRetries: 3,
  initialRetryDelay: 1000,
  maxRetryDelay: 30000,
  backoffMultiplier: 2,
  onUnauthorized: () => {
    // ログイン画面へ遷移
    navigation.replace('Login');
  },
  onRateLimited: (retryAfter) => {
    // レート制限を通知
    showNotification(
      `リクエストが多すぎます。${retryAfter || 60}秒後にお試しください`
    );
  },
  onNetworkError: () => {
    // ネットワークエラーを通知
    showNotification('ネットワークに接続できません');
  },
});

// APIリクエストでエラーが発生した場合
try {
  const response = await axiosInstance.get('/api/data');
} catch (error) {
  if (error instanceof AppError) {
    // 復旧戦略を判定
    const strategy = errorHandler.getRecoveryStrategy(error);

    switch (strategy) {
      case ErrorRecoveryStrategy.RETRY:
        // リトライ可能 → retryStrategy で処理
        break;

      case ErrorRecoveryStrategy.REFRESH_TOKEN:
        // トークンをリフレッシュ（Auth Interceptor で自動処理）
        break;

      case ErrorRecoveryStrategy.LOGIN_REQUIRED:
        // ログインが必要 → ユーザーをログイン画面へ
        navigation.replace('Login');
        break;

      case ErrorRecoveryStrategy.OFFLINE_MODE:
        // オフラインモード → OfflineManager で処理
        break;

      case ErrorRecoveryStrategy.RATE_LIMIT_WAIT:
        // レート制限 → 待機してからリトライ
        const delay = errorHandler.getRetryAfterDelay(error) || 60000;
        setTimeout(() => {
          retryRequest();
        }, delay);
        break;

      default:
        showErrorAlert(error.message);
    }

    // エラーハンドラコールバックを実行
    await errorHandler.handleError(error);
  }
}
```

### 復旧戦略の種類

| エラーコード | 戦略 | 説明 |
|------------|------|------|
| UNAUTHORIZED (401) | REFRESH_TOKEN | トークンをリフレッシュ |
| FORBIDDEN (403) | LOGIN_REQUIRED | ログイン画面へ遷移 |
| NOT_FOUND (404) | REFRESH_DATA | データを再取得 |
| CONFLICT (409) | REFRESH_DATA | データを再取得 |
| TOO_MANY_REQUESTS (429) | RATE_LIMIT_WAIT | 時間を置いてリトライ |
| SERVICE_UNAVAILABLE (503) | RETRY_LATER | 後でリトライ |
| 5xx エラー | RETRY | 自動リトライ |
| ネットワークエラー | OFFLINE_MODE | オフラインモード |

## OfflineManager

### 機能

- **ネットワーク接続状態を監視**
- **オフライン時にリクエストをキューイング**
- **オンライン復帰時に自動リトライ**
- **キュー内リクエストの管理**

### 使用例

```typescript
import {
  OfflineManager,
  initializeGlobalOfflineManager,
  useNetworkStatus,
  ConnectionStatus,
} from '@/core/network/utils';

// アプリ起動時に初期化
async function initializeApp() {
  const offlineManager = await initializeGlobalOfflineManager({
    enableAutoRetry: true,
    retryInterval: 5000,
    maxQueuedRequests: 50,
    onOnline: () => {
      showNotification('インターネット接続が復旧しました');
    },
    onOffline: () => {
      showNotification('インターネット接続が失われました');
    },
    onStatusChange: (status) => {
      console.log('Network status:', status);
    },
  });

  // その他の初期化...
}

// React Component でネットワーク状態を監視
function MyComponent() {
  const { status, isOnline, networkInfo } = useNetworkStatus();

  return (
    <View>
      {!isOnline && (
        <Banner
          message="オフラインモードで動作しています"
          action="同期"
          onAction={syncQueuedRequests}
        />
      )}

      {status === ConnectionStatus.OFFLINE && (
        <Text style={styles.offline}>オフラインモード</Text>
      )}

      {networkInfo && (
        <Text>接続タイプ: {networkInfo.type}</Text>
      )}
    </View>
  );
}

// オフライン時のリクエストをキューイング
async function fetchDataWithQueue() {
  const offlineManager = getGlobalOfflineManager();

  if (!await offlineManager.isOnline()) {
    // オフラインの場合、リクエストをキューに追加
    offlineManager.queueRequest({
      id: `req_${Date.now()}`,
      url: '/api/data',
      method: 'GET',
      timestamp: Date.now(),
      retries: 0,
    });

    showNotification(
      `リクエストがキューに追加されました (${offlineManager.getQueueSize()}件待機中)`
    );
    return null;
  }

  // オンラインの場合、通常通りリクエスト
  try {
    const response = await axiosInstance.get('/api/data');
    return response.data;
  } catch (error) {
    if (!await offlineManager.isOnline()) {
      // リクエスト実行中にオフラインになった場合、キューに追加
      offlineManager.queueRequest({
        id: `req_${Date.now()}`,
        url: '/api/data',
        method: 'GET',
        timestamp: Date.now(),
        retries: 0,
      });
    }
    throw error;
  }
}
```

### ネットワーク状態フロー

```
[Online]
   ↓ インターネット接続喪失
[Offline] → キューイング開始
   ↓ リクエストキューに追加
[キューイング]
   ↓ インターネット接続復旧
[Online] → 自動リトライ開始
   ↓ キューのリクエストを処理
[リトライ処理完了]
```

## RetryStrategy

### 機能

- **複数のバックオフ戦略（指数/リニア/固定）**
- **ジッター付きリトライ**
- **試行履歴の追跡**
- **統計情報の収集**

### バックオフ戦略

#### エクスポーネンシャルバックオフ（推奨）

```
試行 1: すぐにリトライ
試行 2: 1秒待機 (1 * 2^0)
試行 3: 2秒待機 (1 * 2^1)
試行 4: 4秒待機 (1 * 2^2)
試行 5: 失敗
```

使用シーン: ネットワークエラー、サーバーエラー

#### リニアバックオフ

```
試行 1: すぐにリトライ
試行 2: 1秒待機 (1 * 1)
試行 3: 2秒待機 (1 * 2)
試行 4: 3秒待機 (1 * 3)
試行 5: 失敗
```

使用シーン: リソース競合

#### 固定遅延

```
試行 1: すぐにリトライ
試行 2: 1秒待機
試行 3: 1秒待機
試行 4: 1秒待機
試行 5: 失敗
```

使用シーン: レート制限

### 使用例

```typescript
import {
  RetryStrategy,
  executeWithRetry,
  retryApiCall,
  RetryStrategyType,
} from '@/core/network/utils';

// 方法1: RetryStrategy クラスを使用
async function fetchUserData() {
  const strategy = new RetryStrategy({
    strategy: RetryStrategyType.EXPONENTIAL,
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    multiplier: 2,
    jitterFactor: 0.1,
  });

  const result = await strategy.execute(async (attempt) => {
    console.log(`Attempt ${attempt + 1}`);
    const response = await axiosInstance.get('/api/user');
    return response.data;
  });

  if (result.success) {
    console.log('Success:', result.result);
    console.log('Stats:', strategy.getStats());
  } else {
    console.error('Failed after retries:', result.error);
    console.log('Attempts:', result.attempts);
  }
}

// 方法2: executeWithRetry 便利関数を使用
async function fetchQuestData() {
  try {
    const data = await executeWithRetry(
      async () => {
        const response = await axiosInstance.get('/api/quests');
        return response.data;
      },
      {
        strategy: RetryStrategyType.EXPONENTIAL,
        maxAttempts: 3,
        initialDelay: 500,
      }
    );

    console.log('Quests:', data);
  } catch (error) {
    console.error('Failed to fetch quests:', error);
  }
}

// 方法3: retryApiCall 最も簡単な方法
async function fetchProfile() {
  try {
    const profile = await retryApiCall(
      () => axiosInstance.get('/api/profile').then((r) => r.data),
      3, // maxAttempts
      1000 // initialDelay
    );

    console.log('Profile:', profile);
  } catch (error) {
    console.error('Failed to fetch profile:', error);
  }
}

// カスタム判定関数
async function fetchWithCustomRetry() {
  const strategy = new RetryStrategy({
    maxAttempts: 5,
    shouldRetry: (error, attempt) => {
      // 特定の条件でのみリトライ
      if (error instanceof AppError) {
        return (
          error.code === 'NETWORK_ERROR' ||
          (error.code === 'INTERNAL_SERVER_ERROR' && attempt < 3)
        );
      }
      return false;
    },
  });

  const result = await strategy.execute(async () => {
    return axiosInstance.get('/api/data');
  });
}
```

### 試行履歴と統計情報

```typescript
const strategy = new RetryStrategy({
  maxAttempts: 3,
  initialDelay: 100,
});

const result = await strategy.execute(async (attempt) => {
  if (attempt < 2) {
    throw new Error('Network error');
  }
  return 'success';
});

// 試行履歴を取得
console.log('Attempts:', result.attempts);
// [
//   { attempt: 0, timestamp: ..., error: Error, delayMs: 100 },
//   { attempt: 1, timestamp: ..., error: Error, delayMs: 200 },
//   { attempt: 2, timestamp: ..., error: null, delayMs: 0 }
// ]

// 統計情報を取得
const stats = strategy.getStats();
console.log('Stats:', stats);
// {
//   totalAttempts: 3,
//   successAttempt: 2,
//   totalDuration: 320,
//   averageDelay: 100
// }
```

## エラーハンドリングの実装パターン

### パターン1: 基本的なAPI呼び出し

```typescript
async function loadData() {
  try {
    setLoading(true);
    const data = await retryApiCall(() =>
      axiosInstance.get('/api/data').then((r) => r.data)
    );
    setData(data);
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === 'UNAUTHORIZED') {
        // トークンリフレッシュは自動（Auth Interceptor）
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // リトライ
        return loadData();
      }
    }
    showErrorAlert(error.message);
  } finally {
    setLoading(false);
  }
}
```

### パターン2: 複数のAPI呼び出し

```typescript
async function loadUserAndQuests() {
  try {
    // 両方のリクエストを並列実行（自動リトライ）
    const [user, quests] = await Promise.all([
      retryApiCall(() =>
        axiosInstance.get('/api/user').then((r) => r.data)
      ),
      retryApiCall(() =>
        axiosInstance.get('/api/quests').then((r) => r.data)
      ),
    ]);

    return { user, quests };
  } catch (error) {
    console.error('Failed to load data:', error);
    throw error;
  }
}
```

### パターン3: オフライン対応

```typescript
async function syncData() {
  const offlineManager = getGlobalOfflineManager();

  if (!await offlineManager.isOnline()) {
    showNotification('オフラインモードでデータは同期されません');
    return;
  }

  try {
    const queuedRequests = offlineManager.getQueuedRequests();

    for (const request of queuedRequests) {
      try {
        await retryApiCall(() =>
          axiosInstance({
            method: request.method,
            url: request.url,
            data: request.data,
          })
        );

        offlineManager.removeQueuedRequest(request.id);
      } catch (error) {
        console.error('Failed to sync request:', request.id, error);
      }
    }

    showNotification('データを同期しました');
  } catch (error) {
    showErrorAlert('同期に失敗しました');
  }
}
```

## ベストプラクティス

### 1. 適切なバックオフ戦略を選択

```typescript
// ✅ 良い例: エラータイプに応じて戦略を選択
if (error.code === 'NETWORK_ERROR') {
  strategy = RetryStrategyType.EXPONENTIAL; // 指数バックオフ
} else if (error.code === 'TOO_MANY_REQUESTS') {
  strategy = RetryStrategyType.FIXED; // 固定遅延
}

// ❌ 悪い例: すべてのエラーで同じ戦略
strategy = RetryStrategyType.EXPONENTIAL;
```

### 2. リトライ回数を制限

```typescript
// ✅ 良い例: 最大3-5回
const result = await executeWithRetry(fn, {
  maxAttempts: 3,
});

// ❌ 悪い例: 無制限リトライ
while (true) {
  try {
    return await fn();
  } catch (error) {
    // リトライし続ける
  }
}
```

### 3. ジッターを追加

```typescript
// ✅ 良い例: ジッターで同時リトライを避ける
const result = await executeWithRetry(fn, {
  jitterFactor: 0.1,
});

// ❌ 悪い例: ジッターなし
const delay = 1000 * Math.pow(2, attempt);
await wait(delay);
```

### 4. Retry-After を尊重

```typescript
// ✅ 良い例: Retry-After ヘッダーをチェック
const retryAfter = errorHandler.getRetryAfterDelay(error);
if (retryAfter) {
  await wait(retryAfter);
  retry();
}

// ❌ 悪い例: サーバーの指示を無視
await wait(1000);
retry();
```

## テスト

### Unit Tests

```bash
# ネットワークエラーハンドリングテスト実行
npm test -- errorHandling.test.ts

# 特定のテストケースを実行
npm test -- errorHandling.test.ts -t "NetworkErrorHandler"

# カバレッジレポート
npm test -- errorHandling.test.ts --coverage
```

## 関連ファイル

| ファイル | 説明 |
|---------|------|
| `src/core/network/utils/networkErrorHandler.ts` | エラーハンドラ |
| `src/core/network/utils/offlineManager.ts` | オフラインマネージャ |
| `src/core/network/utils/retryStrategy.ts` | リトライ戦略 |
| `src/core/network/utils/__tests__/errorHandling.test.ts` | テスト |

---

**作成日**: 2025-10-22
**タスク**: 3.3 ネットワークエラーハンドリング
**ステータス**: ✅ 完了
