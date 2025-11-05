# OAuth 2.1 + PKCE 実装ガイド

## 概要

climb-you モバイルアプリは、OAuth 2.1 Proof Key for Code Exchange (PKCE) フロー（RFC 7636）を使用してセキュアな認証を実現します。

PKCE は、モバイルアプリのような公開クライアント（クライアントシークレットを安全に保存できない）でのセキュアな認可コードフローを実現するための拡張仕様です。

## セキュリティの特徴

### 1. PKCE（Proof Key for Code Exchange）

**問題**: 従来の認可コードフローでは、攻撃者が以下の方法で認可コードを盗むことができます：
- アプリがリダイレクト URL を開く際に、他のアプリに横取りされる
- ネットワークトラフィックの盗聴

**解決策**: PKCE では、認可コードの交換時に「コードベリファイア」を検証することで、盗まれたコードを使用不可にします。

```
1. アプリが生成: code_verifier（128文字のランダム文字列）
2. アプリが計算: code_challenge = BASE64_URL(SHA256(code_verifier))
3. ステップ1で code_challenge をリクエストに含める
4. ステップ2で code_verifier をトークンリクエストに含める
5. サーバーが code_verifier から code_challenge を再計算して検証
```

### 2. State パラメータ（CSRF 対策）

```
code = authorization_code&state=xyz123
```

リダイレクト URL の state パラメータがリクエスト時の state と一致することを確認。

### 3. セキュアストレージ

トークンは `expo-secure-store` でデバイスのセキュアストレージに保存。

```
❌ AsyncStorage（暗号化なし）
✅ SecureStore（デバイスの暗号化キーで保護）
```

## アーキテクチャ

### クラス図

```
┌─────────────────────────┐
│      OAuth2Client       │
├─────────────────────────┤
│ - config: OAuthConfig   │
│ - pkceChallenge         │
│ - state: string         │
├─────────────────────────┤
│ + startLogin()          │
│ + exchangeCodeForToken()│
│ + refreshAccessToken()  │
│ + revokeToken()         │
└─────────────────────────┘

┌─────────────────────────┐
│      PKCEFlow           │
├─────────────────────────┤
│ + generateCodeVerifier()│
│ + generateCodeChallenge()
│ + generateChallenge()   │
│ + validateCodeVerifier()│
│ + validateCodeChallenge()
└─────────────────────────┘

┌─────────────────────────┐
│    TokenManager         │
├─────────────────────────┤
│ - ACCESS_TOKEN_KEY      │
│ - REFRESH_TOKEN_KEY     │
│ - TOKEN_EXPIRY_KEY      │
├─────────────────────────┤
│ + saveTokens()          │
│ + getAccessToken()      │
│ + getRefreshToken()     │
│ + isTokenValid()        │
│ + refreshAccessToken()  │
│ + deleteTokens()        │
└─────────────────────────┘
```

## 使用方法

### 1. OAuth 設定

```typescript
import { OAuth2Client } from '@/core/network/oauth';
import { OAuthConfig } from '@/core/domain/entities';

const oauthConfig: OAuthConfig = {
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret', // 信頼されたサーバーのみ
  redirectUrl: 'com.climbYou://oauth-callback', // Deep link
  authorizeUrl: 'https://auth-server.com/authorize',
  tokenUrl: 'https://auth-server.com/token',
  revokeUrl: 'https://auth-server.com/revoke',
  scopes: ['openid', 'profile', 'email'],
};

const oauth2Client = new OAuth2Client(oauthConfig);
```

### 2. ログイン実装

```typescript
import { OAuth2Client } from '@/core/network/oauth';
import { TokenManager } from '@/services/auth';

async function login() {
  try {
    // 1. OAuth フローを開始（ブラウザで認可エンドポイントを開く）
    const authCode = await oauth2Client.startLogin();
    console.log('Authorization code received:', authCode.code);

    // 2. 認可コードをトークンに交換
    const token = await oauth2Client.exchangeCodeForToken(authCode.code);
    console.log('Token received:', token);

    // 3. トークンをセキュアストレージに保存
    await TokenManager.saveTokens(token);

    console.log('Login successful');
  } catch (error) {
    console.error('Login failed:', error);
    // エラー処理: ユーザーに通知など
  }
}
```

### 3. トークンの検証と使用

```typescript
import { TokenManager } from '@/services/auth';

async function getAuthHeaders(): Promise<HeadersInit> {
  // トークンが有効か確認
  const isValid = await TokenManager.isTokenValid();

  if (!isValid) {
    // トークンが有効期限切れの場合、リフレッシュ
    const refreshToken = await TokenManager.getRefreshToken();
    if (refreshToken) {
      const newToken = await oauth2Client.refreshAccessToken(refreshToken);
      await TokenManager.saveTokens(newToken);
    } else {
      // リフレッシュトークンがない場合は再ログイン
      throw new Error('Session expired. Please login again.');
    }
  }

  const accessToken = await TokenManager.getAccessToken();

  return {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
}

// API リクエスト例
async function getUserProfile() {
  const headers = await getAuthHeaders();

  const response = await fetch('https://api.example.com/user/profile', {
    method: 'GET',
    headers,
  });

  return response.json();
}
```

### 4. ログアウト実装

```typescript
async function logout() {
  try {
    // 1. サーバー側でトークンを無効化
    const accessToken = await TokenManager.getAccessToken();
    if (accessToken) {
      await oauth2Client.revokeToken(accessToken);
    }

    // 2. ローカルストレージからトークンを削除
    await TokenManager.deleteTokens();

    console.log('Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    // エラーでもローカルトークンは削除（とにかくログアウト）
    await TokenManager.deleteTokens();
  }
}
```

### 5. トークンリフレッシュ（自動）

```typescript
async function refreshTokenIfNeeded() {
  const isExpiringSoon = await TokenManager.isTokenExpiringSoon();

  if (isExpiringSoon) {
    const refreshToken = await TokenManager.getRefreshToken();
    if (refreshToken) {
      const newToken = await oauth2Client.refreshAccessToken(refreshToken);
      await TokenManager.saveTokens(newToken);
    }
  }
}

// アプリ起動時、バックグラウンド復帰時に実行
useEffect(() => {
  refreshTokenIfNeeded();
}, []);
```

## ファイル構成

```
src/
├── core/
│   ├── domain/
│   │   └── entities/
│   │       └── Auth.ts              # Auth エンティティ定義
│   └── network/
│       └── oauth/
│           ├── PKCEFlow.ts          # PKCE フロー実装
│           ├── OAuth2Client.ts      # OAuth 2.1 クライアント
│           └── index.ts
└── services/
    └── auth/
        ├── TokenManager.ts          # トークン管理
        └── index.ts
```

## 設定例

### backend サーバー側の設定

```typescript
// Node.js/Express 例

app.post('/token', async (req, res) => {
  const { code, code_verifier, client_id, grant_type } = req.body;

  if (grant_type === 'authorization_code') {
    // 1. code_verifier から code_challenge を再計算
    const crypto = require('crypto');
    const hash = crypto
      .createHash('sha256')
      .update(code_verifier)
      .digest('base64');
    const calculatedChallenge = hash
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    // 2. 保存されている code_challenge と比較
    const storedChallenge = getStoredCodeChallenge(code);
    if (calculatedChallenge !== storedChallenge) {
      return res.status(400).json({ error: 'invalid_grant' });
    }

    // 3. トークンを発行
    const token = {
      access_token: generateAccessToken(),
      refresh_token: generateRefreshToken(),
      expires_in: 3600,
      token_type: 'Bearer',
    };

    res.json(token);
  }
});
```

## エンティティ定義

### AuthToken
```typescript
interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;        // 秒単位
  tokenType: string;         // "Bearer"
  scope?: string;
  issuedAt: number;          // Unix timestamp
}
```

### OAuthConfig
```typescript
interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  redirectUrl: string;       // Deep link: com.climbYou://oauth-callback
  authorizeUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  scopes: string[];          // ['openid', 'profile', 'email']
}
```

### PKCEChallenge
```typescript
interface PKCEChallenge {
  codeVerifier: string;      // 128 文字のランダム文字列
  codeChallenge: string;     // BASE64_URL(SHA256(codeVerifier))
  method: 'S256' | 'plain';  // 常に 'S256' を使用
}
```

## トラブルシューティング

### 問題1: "State parameter mismatch"

**原因**: CSRF 対策のため、リクエスト時の state とレスポンスの state が一致しない

**解決**: ブラウザがリダイレクト URL を正しく処理していることを確認

### 問題2: "invalid_grant"

**原因**:
- code_verifier と code_challenge のミスマッチ
- コードが有効期限切れ（通常5分以内）
- クライアント認証失敗

**解決**: PKCE チャレンジのハッシュ計算が正しいことを確認

### 問題3: トークンがセキュアストレージに保存されない

**原因**: `expo-secure-store` がデバイスで利用不可

**解決**: 開発時は `SecureStore.setItemAsync` がモックされているか確認

## ベストプラクティス

### 1. トークン有効期限の管理

```typescript
// 有効期限まで60秒以上残っているか確認
const isTokenValid = await TokenManager.isTokenValid();

// 5分以内に有効期限切れになるか確認（プロアクティブリフレッシュ）
const isExpiringSoon = await TokenManager.isTokenExpiringSoon();
```

### 2. リフレッシュトークンの取り扱い

```typescript
// ✅ Good: 長期保存、ローテーション可能
// 定期的に新しいリフレッシュトークンを取得
const newToken = await oauth2Client.refreshAccessToken(refreshToken);
await TokenManager.saveTokens(newToken); // 新しいトークンで上書き

// ❌ Bad: ハードコード、ローカル変数に保存
```

### 3. エラーハンドリング

```typescript
// ✅ Good: 401 エラー時は再ログイン
if (response.status === 401) {
  await TokenManager.deleteTokens();
  // ログイン画面に遷移
}

// ❌ Bad: トークン無効時にリトライするだけ
```

### 4. HTTPS 強制

```typescript
// ✅ すべてのトークンリクエストは HTTPS 必須
// Axios インターセプターで強制
axios.interceptors.request.use((config) => {
  if (!config.url.startsWith('https://')) {
    throw new Error('HTTPS required');
  }
  return config;
});
```

## 関連リソース

- [RFC 6749 - OAuth 2.0 Authorization Framework](https://tools.ietf.org/html/rfc6749)
- [RFC 7636 - PKCE](https://tools.ietf.org/html/rfc7636)
- [OAuth 2.1 Authorization Framework](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-07)
- [Expo AuthSession Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Expo SecureStore Documentation](https://docs.expo.dev/versions/latest/sdk/securestore/)

---

**作成日**: 2025-10-22
**タスク**: 2.1 OAuth 2.1 + PKCE 実装
**ステータス**: ✅ 完了
