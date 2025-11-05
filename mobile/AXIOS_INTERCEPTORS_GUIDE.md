# Axios インターセプター実装ガイド

## 概要

Axios インターセプターは、すべての HTTP リクエスト/レスポンスをインターセプトして共通の処理を実行するNetworkレイヤーの重要なコンポーネントです。

### 3つのインターセプター

1. **Auth Interceptor** - 認証トークン管理とリフレッシュ
2. **Error Interceptor** - エラーハンドリングとメッセージ統一
3. **Logging Interceptor** - デバッグログとセンシティブ情報マスク

## アーキテクチャ

```
┌─────────────────────────────────────┐
│   Application Code                  │
└──────────────┬──────────────────────┘
               │ axios.get/post
      ┌────────▼──────────────┐
      │ Logging Interceptor   │
      │ (Request Start)       │
      └────────┬──────────────┘
               │
      ┌────────▼──────────────┐
      │ Auth Interceptor      │
      │ (Token Attachment)    │
      └────────┬──────────────┘
               │
      ┌────────▼──────────────┐
      │ HTTP Request          │
      │ → Server              │
      └────────┬──────────────┘
               │
      ┌────────▼──────────────┐
      │ Error Interceptor     │
      │ (Error Check)         │
      └────────┬──────────────┘
               │
      ┌────────▼──────────────┐
      │ Auth Interceptor      │
      │ (Token Refresh)       │
      └────────┬──────────────┘
               │
      ┌────────▼──────────────┐
      │ Logging Interceptor   │
      │ (Response Log)        │
      └────────┬──────────────┘
               │
      ┌────────▼──────────────┐
      │ Response/Error        │
      │ ← Application         │
      └──────────────────────┘
```

## 初期化

### 基本的なセットアップ

```typescript
import axios from 'axios';
import {
  setupAuthInterceptor,
  setupErrorInterceptor,
  setupLoggingInterceptor,
  LogLevel,
} from '@/core/network/interceptors';
import { OAuth2Client } from '@/core/network/oauth';

// Axiosインスタンス作成
const axiosInstance = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 30000,
});

// OAuth2クライア ント初期化
const oauthClient = new OAuth2Client({
  clientId: 'your_client_id',
  redirectUrl: 'com.climbYou://oauth-callback',
  authorizeUrl: 'https://auth.example.com/authorize',
  tokenUrl: 'https://auth.example.com/token',
  scopes: ['openid', 'profile', 'email'],
});

// インターセプターをセットアップ
setupLoggingInterceptor(axiosInstance, {
  level: __DEV__ ? LogLevel.DEBUG : LogLevel.INFO,
  maskSensitiveData: true,
});

setupAuthInterceptor(axiosInstance, oauthClient, {
  tokenRefreshUrl: 'https://api.example.com/auth/refresh',
  onUnauthorized: () => {
    // ログイン画面へ遷移
    navigateToLogin();
  },
  onTokenRefreshed: (token) => {
    console.log('Token refreshed');
  },
});

setupErrorInterceptor(axiosInstance, {
  onError: (error) => {
    console.error('API Error:', error.message);
  },
  onNetworkError: () => {
    showNetworkErrorNotification();
  },
  onServerError: (error) => {
    showServerErrorNotification(error.message);
  },
});

export default axiosInstance;
```

## Auth Interceptor

### 機能

- **リクエストに認証トークンを自動付与**
- **401エラー時にトークンをリフレッシュ**
- **複数のリクエストからのリフレッシュリクエストをキュー化**
- **特定URL での認証スキップ**

### API

```typescript
interface AuthInterceptorConfig {
  tokenRefreshUrl: string;           // トークンリフレッシュエンドポイント
  excludeUrls?: RegExp[];            // 認証をスキップするURL（正規表現）
  onUnauthorized?: () => void;       // 認証失敗時のコールバック
  onTokenRefreshed?: (token: string) => void;  // トークンリフレッシュ成功時のコールバック
}
```

### 使用例

```typescript
// 除外URL でのセットアップ
setupAuthInterceptor(axiosInstance, oauthClient, {
  tokenRefreshUrl: 'https://api.example.com/auth/refresh',
  excludeUrls: [
    /\/auth\//,      // 認証関連エンドポイント
    /\/public\//,    // パブリックエンドポイント
    /\/health/,      // ヘルスチェック
  ],
  onUnauthorized: () => {
    // セッション無効 → ログイン画面へ
    authStore.clear();
    navigation.replace('Login');
  },
  onTokenRefreshed: (newToken) => {
    // トークンをリフレッシュしたことを通知
    eventBus.emit('tokenRefreshed', newToken);
  },
});
```

### リフレッシュフロー

```
Request 1: GET /api/data
  ↓ Returns 401 (token expired)
  ↓ Interceptor detects 401
  ↓ Refresh lock acquired

Request 2: GET /api/user
  ↓ Returns 401 (token expired)
  ↓ Interceptor detects 401
  ↓ Refresh already in progress → Queue request

Request 3: POST /api/quest
  ↓ Returns 401 (token expired)
  ↓ Interceptor detects 401
  ↓ Refresh already in progress → Queue request

Token Refresh: POST /auth/refresh
  ↓ Returns new token
  ↓ Release refresh lock
  ↓ Process queued requests with new token
  ↓ Retry original requests

Response: Original requests succeed with new token
```

### トークンリフレッシュ時のエラーハンドリング

```typescript
setupAuthInterceptor(axiosInstance, oauthClient, {
  tokenRefreshUrl: 'https://api.example.com/auth/refresh',
  onUnauthorized: () => {
    // リフレッシュ失敗時
    // 1. ローカルキャッシュをクリア
    AsyncStorage.removeItem('auth_state');

    // 2. トークンストアをクリア
    await SecureTokenStore.clearAllSecureData();

    // 3. ログイン画面へ遷移
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  },
});
```

## Error Interceptor

### 機能

- **HTTP ステータスコードを標準的なエラーコードに変換**
- **ローカライズされたエラーメッセージを提供**
- **ネットワークエラーとAPIエラーを区別**
- **エラーの詳細情報を保持**

### API

```typescript
interface ErrorInterceptorConfig {
  onError?: (error: AppError) => void;        // すべてのエラー
  onNetworkError?: () => void;                // ネットワークエラー
  onServerError?: (error: AppError) => void;  // サーバーエラー(5xx)
  onClientError?: (error: AppError) => void;  // クライアントエラー(4xx)
}

class AppError extends Error {
  code: string;              // エラーコード
  message: string;           // エラーメッセージ
  statusCode?: number;       // HTTP ステータスコード
  details?: any;             // エラー詳細
}
```

### エラーコードマッピング

| HTTP ステータス | エラーコード | メッセージ |
|----------------|------------|----------|
| 400 | BAD_REQUEST | リクエストが不正です |
| 401 | UNAUTHORIZED | 認証が失敗しました |
| 403 | FORBIDDEN | アクセス権がありません |
| 404 | NOT_FOUND | リソースが見つかりません |
| 409 | CONFLICT | リソースの競合が発生しました |
| 422 | UNPROCESSABLE_ENTITY | 入力値の検証に失敗しました |
| 429 | TOO_MANY_REQUESTS | リクエストが多すぎます |
| 500 | INTERNAL_SERVER_ERROR | サーバーエラーが発生しました |
| 503 | SERVICE_UNAVAILABLE | サーバーはメンテナンス中です |

### 使用例

```typescript
setupErrorInterceptor(axiosInstance, {
  onError: (error) => {
    // すべてのエラーをキャッチ
    console.error(`[${error.code}] ${error.message}`);

    // エラーをSentry/Crashlyticsに送信
    logErrorToServer(error);
  },
  onNetworkError: () => {
    // ネットワーク接続エラー
    showNotification({
      type: 'error',
      message: 'ネットワークに接続できません。インターネット接続を確認してください。',
    });
  },
  onServerError: (error) => {
    // サーバーエラー(500+)
    showNotification({
      type: 'error',
      message: `サーバーエラー: ${error.message}`,
    });

    // リトライを提案
    showRetryDialog(() => {
      // リトライロジック
    });
  },
  onClientError: (error) => {
    // クライアントエラー(4xx)
    if (error.code === 'UNPROCESSABLE_ENTITY') {
      // バリデーションエラーを詳細に表示
      const validationErrors = error.details?.validation;
      displayValidationErrors(validationErrors);
    } else {
      showNotification({
        type: 'error',
        message: error.message,
      });
    }
  },
});
```

### エラーハンドリングの実装例

```typescript
async function fetchUserData() {
  try {
    const response = await axiosInstance.get('/api/user');
    return response.data;
  } catch (error) {
    if (error instanceof AppError) {
      switch (error.code) {
        case 'UNAUTHORIZED':
          // ログイン画面へ遷移
          navigation.replace('Login');
          break;

        case 'FORBIDDEN':
          // アクセス権なし
          showAlert('アクセス権がありません');
          break;

        case 'NOT_FOUND':
          // リソースが見つからない
          showAlert('ユーザーが見つかりません');
          break;

        case 'NETWORK_ERROR':
          // ネットワークエラー
          showAlert('ネットワークに接続できません');
          break;

        case 'INTERNAL_SERVER_ERROR':
          // サーバーエラー
          showAlert('サーバーエラーが発生しました。しばらく待ってからお試しください。');
          break;

        default:
          showAlert(error.message);
      }
    }

    throw error;
  }
}
```

## Logging Interceptor

### 機能

- **リクエスト/レスポンスをログ出力**
- **センシティブ情報（パスワード、トークン）をマスク**
- **レスポンスタイムを計測**
- **ログレベル による制御**
- **特定URL のログをスキップ**

### API

```typescript
enum LogLevel {
  NONE = 0,      // ログ出力なし
  ERROR = 1,     // エラーのみ
  WARN = 2,      // 警告以上
  INFO = 3,      // 情報以上（デフォルト）
  DEBUG = 4,     // すべてをログ出力
}

interface LoggingInterceptorConfig {
  level: LogLevel;                   // ログレベル
  maskSensitiveData: boolean;        // センシティブ情報をマスク
  excludeUrls?: RegExp[];            // ログをスキップするURL
  sensitiveHeaders?: string[];       // センシティブと判定するヘッダー
  sensitiveFields?: string[];        // センシティブと判定するフィールド
}
```

### 使用例

```typescript
// 開発環境 ではDEBUG、本番環境ではINFO
setupLoggingInterceptor(axiosInstance, {
  level: __DEV__ ? LogLevel.DEBUG : LogLevel.INFO,
  maskSensitiveData: true,
  excludeUrls: [
    /\/health/,      // ヘルスチェック
    /\/analytics\//,  // 分析（ログが多い）
  ],
  sensitiveHeaders: [
    'Authorization',
    'X-API-Key',
    'Cookie',
  ],
  sensitiveFields: [
    'password',
    'token',
    'secret',
    'accessToken',
    'refreshToken',
    'creditCard',
  ],
});
```

### ログ出力例

```
// DEBUG ログ出力
[REQUEST] GET https://api.example.com/api/user
  Params: undefined
  Body: undefined
  Headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbG***"
  }

[RESPONSE] 200 OK (245ms)
  Body: {
    "id": "user_123",
    "name": "John Doe",
    "email": "john@example.com"
  }

// エラーログ出力
[ERROR] POST https://api.example.com/api/login - 401 Unauthorized (150ms)
  Error: {
    "code": "UNAUTHORIZED",
    "message": "Invalid credentials"
  }
```

### マスキング例

```typescript
// センシティブなリクエスト
const request = {
  email: 'user@example.com',
  password: 'SecretPassword123',
  token: 'very_long_sensitive_token_xyz789abc'
};

// ログに出力される場合（マスク有効）
{
  email: 'user@example.com',
  password: '***',
  token: 'very_lo***'
}
```

## ベストプラクティス

### 1. エラーハンドリング

```typescript
// ✅ 良い例: エラー型をチェック
try {
  await axiosInstance.get('/api/data');
} catch (error) {
  if (error instanceof AppError) {
    handleAppError(error);
  } else {
    handleUnknownError(error);
  }
}

// ❌ 悪い例: エラーを無視
await axiosInstance.get('/api/data');
```

### 2. トークンリフレッシュ

```typescript
// ✅ 良い例: コールバックで通知
setupAuthInterceptor(axiosInstance, oauthClient, {
  tokenRefreshUrl: '/auth/refresh',
  onTokenRefreshed: (token) => {
    eventBus.emit('tokenRefreshed', token);
  },
});

// ❌ 悪い例: トークンリフレッシュロジックをインターセプター外に
// インターセプター内で行うべき
```

### 3. センシティブ情報

```typescript
// ✅ 良い例: 本番環境でマスク有効
setupLoggingInterceptor(axiosInstance, {
  maskSensitiveData: !__DEV__,
  level: __DEV__ ? LogLevel.DEBUG : LogLevel.INFO,
});

// ❌ 悪い例: すべての環境でセンシティブ情報をログ
setupLoggingInterceptor(axiosInstance, {
  maskSensitiveData: false,
  level: LogLevel.DEBUG,
});
```

### 4. 除外URL

```typescript
// ✅ 良い例: ヘルスチェックと認証をスキップ
setupAuthInterceptor(axiosInstance, oauthClient, {
  tokenRefreshUrl: '/auth/refresh',
  excludeUrls: [/\/health/, /\/auth\/login/],
});

setupLoggingInterceptor(axiosInstance, {
  excludeUrls: [/\/health/, /\/analytics\//],
});

// ❌ 悪い例: すべてのリクエストを処理
// パフォーマンスと情報漏洩のリスク
```

## テスト

### Unit Tests

```bash
# インターセプターテスト実行
npm test -- interceptors.test.ts

# 特定のインターセプターをテスト
npm test -- interceptors.test.ts -t "Auth Interceptor"

# カバレッジレポート
npm test -- interceptors.test.ts --coverage
```

### Integration Tests

```bash
# MCPClient + Auth統合テスト
npm test -- mcp-auth-integration.test.ts
```

## トラブルシューティング

### 問題1: トークンリフレッシュが無限ループ

```typescript
// ❌ 悪い例: リフレッシュエンドポイントにも認証が必要
setupAuthInterceptor(axiosInstance, oauthClient, {
  tokenRefreshUrl: '/auth/refresh',
  // /auth/refresh にも Bearer トークンが付与される
});

// ✅ 良い例: リフレッシュエンドポイントを除外
setupAuthInterceptor(axiosInstance, oauthClient, {
  tokenRefreshUrl: '/auth/refresh',
  excludeUrls: [/\/auth\/refresh/],
});
```

### 問題2: ログが大量に出力される

```typescript
// ✅ 解決策: ログレベルを下げる、除外URL を追加
setupLoggingInterceptor(axiosInstance, {
  level: LogLevel.INFO,  // DEBUG から INFO に変更
  excludeUrls: [/\/health/, /\/analytics\//],
});
```

### 問題3: センシティブ情報が本番環境でログに出力

```typescript
// ✅ 解決策: マスキングを有効化
setupLoggingInterceptor(axiosInstance, {
  maskSensitiveData: true,
  sensitiveFields: ['password', 'token', 'secret'],
});
```

## 関連ファイル

| ファイル | 説明 |
|---------|------|
| `src/core/network/interceptors/authInterceptor.ts` | Auth Interceptor |
| `src/core/network/interceptors/errorInterceptor.ts` | Error Interceptor |
| `src/core/network/interceptors/loggingInterceptor.ts` | Logging Interceptor |
| `src/core/network/interceptors/__tests__/interceptors.test.ts` | テスト |

---

**作成日**: 2025-10-22
**タスク**: 3.2 Axiosインターセプター実装
**ステータス**: ✅ 完了
