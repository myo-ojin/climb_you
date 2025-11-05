# Sign in with Apple / Google 実装ガイド

## 概要

climb-youモバイルアプリは、以下のソーシャル認証をサポートします：

- **Apple Sign-In** (iOS) - Face ID/Touch IDをサポート
- **Google Sign-In** (Android) - リフレッシュトークンの自動管理
- **OAuth 2.1 (汎用)** - 他のプロバイダー対応

## アーキテクチャ

### アダプタパターン

複数のプロバイダーを統一インターフェースで提供：

```
SocialAuthAdapter
├── AppleSignIn         (iOS)
├── GoogleSignIn        (Android)
└── OAuth2Client        (汎用)
```

### クラス図

```
┌──────────────────────────────────┐
│    SocialAuthAdapter             │
├──────────────────────────────────┤
│ + signInWithApple()              │
│ + signInWithGoogle()             │
│ + signInWithOAuth()              │
│ + signOut(provider)              │
│ + isProviderAvailable(provider)  │
│ + getAvailableProviders()        │
└──────────────────────────────────┘
        │
        ├─► AppleSignIn (iOS専用)
        ├─► GoogleSignIn (iOS/Android)
        └─► OAuth2Client (汎用)
```

## Sign in with Apple (iOS)

### 概要

Apple の推奨認証方法で、以下の機能をサポート：
- Face ID / Touch ID による生体認証
- プライベートリレー（メールマスキング）
- 2段階認証連携

### セットアップ

#### 1. Xcode での設定

```
Xcode > Signing & Capabilities > + Capability
→ "Sign in with Apple" を追加
```

#### 2. Apple Developer での設定

1. [Apple Developer](https://developer.apple.com/) にログイン
2. Certificates, Identifiers & Profiles に移動
3. Identifiers でアプリを選択
4. "Sign in with Apple" を有効化
5. チーム ID、Bundle ID、Key ID を取得

### 実装例

```typescript
import { AppleSignIn } from '@/core/network/oauth';
import { TokenManager } from '@/services/auth';

async function loginWithApple() {
  try {
    // 1. Apple Sign-In が利用可能か確認
    const available = await AppleSignIn.isAvailable();
    if (!available) {
      throw new Error('Apple Sign-In not available');
    }

    // 2. AppleSignIn インスタンス作成
    const appleAuth = new AppleSignIn({
      teamId: 'YOUR_TEAM_ID',
      bundleId: 'com.climbYou.mobile',
      keyId: 'YOUR_KEY_ID',
    });

    // 3. Sign-In フロー開始
    const appleResponse = await appleAuth.startSignIn();
    console.log('Identity Token:', appleResponse.identityToken);
    console.log('User:', appleResponse.user);

    // 4. Real User Status を確認（詐欺対策）
    const realUserStatus = AppleSignIn.getRealUserStatus(
      appleResponse.realUserStatus
    );
    console.log('Real User Status:', realUserStatus);

    // 5. バックエンドで Identity Token を検証
    // （クライアント側では JWT 署名検証をしない）
    const verified = await appleAuth.verifyIdentityToken(
      appleResponse.identityToken
    );

    // 6. ユーザー情報を取得
    const userId = verified.sub;
    const user = appleAuth.convertToUser(appleResponse, userId);

    // 7. ここで API 呼び出し：ユーザー作成/更新
    // const newUser = await api.createOrUpdateUser(user);

    console.log('Apple Sign-In successful');
  } catch (error) {
    console.error('Apple Sign-In error:', error);
  }
}
```

## Sign in with Google (Android)

### 概要

Google の推奨認証方法で、以下の機能をサポート：
- Google アカウントでの簡単ログイン
- リフレッシュトークンの自動管理
- プロフィール情報の取得

### セットアップ

#### 1. Google Cloud Console での設定

1. [Google Cloud Console](https://console.cloud.google.com/) にログイン
2. プロジェクトを作成
3. OAuth 2.0 同意画面を設定
4. OAuth 2.0 クライアント ID を作成（Android）
5. Client ID を取得

#### 2. Android での設定

```gradle
// android/app/build.gradle
dependencies {
    // Google Sign-In は Expo で管理されるため、明示的な記述は不要
}
```

#### 3. android/app/google-services.json の配置

Google Cloud Console からダウンロードした `google-services.json` を配置

### 実装例

```typescript
import { GoogleSignIn } from '@/core/network/oauth';
import { TokenManager } from '@/services/auth';

async function loginWithGoogle() {
  try {
    // 1. Google Sign-In インスタンス作成
    const googleAuth = new GoogleSignIn({
      clientId: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
      androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
      scopes: ['profile', 'email'],
    });

    // 2. Sign-In が利用可能か確認
    const available = await googleAuth.isAvailable();
    if (!available) {
      throw new Error('Google Sign-In not available');
    }

    // 3. Sign-In フロー開始
    const googleResponse = await googleAuth.startSignIn();
    console.log('ID Token:', googleResponse.idToken);
    console.log('User:', googleResponse.user);

    // 4. バックエンドで ID Token を検証
    const verified = await googleAuth.verifyIdToken(googleResponse.idToken);

    // 5. ユーザー情報を取得
    const userId = verified.sub;
    const user = googleAuth.convertToUser(googleResponse.user, userId);

    // 6. トークンを保存
    const token = {
      accessToken: googleResponse.accessToken,
      refreshToken: googleResponse.refreshToken,
      expiresIn: googleResponse.expiresIn,
      tokenType: 'Bearer',
      issuedAt: Math.floor(Date.now() / 1000),
    };
    await TokenManager.saveTokens(token);

    console.log('Google Sign-In successful');
  } catch (error) {
    console.error('Google Sign-In error:', error);
  }
}
```

## SocialAuthAdapter（統合インターフェース）

複数のプロバイダーを統一インターフェースで操作：

```typescript
import { SocialAuthAdapter } from '@/core/network/oauth';
import { AuthProvider } from '@/core/domain/entities';

// 1. アダプタを初期化
const socialAuth = new SocialAuthAdapter(
  {
    // Apple Sign-In 設定
    teamId: 'YOUR_TEAM_ID',
    bundleId: 'com.climbYou.mobile',
    keyId: 'YOUR_KEY_ID',
  },
  {
    // Google Sign-In 設定
    clientId: 'YOUR_CLIENT_ID',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
  },
  {
    // OAuth 2.1 設定
    clientId: 'YOUR_OAUTH_CLIENT_ID',
    redirectUrl: 'com.climbYou://oauth-callback',
    authorizeUrl: 'https://auth-server.com/authorize',
    tokenUrl: 'https://auth-server.com/token',
    scopes: ['openid', 'profile', 'email'],
  }
);

// 2. 利用可能なプロバイダーを確認
const availableProviders = await socialAuth.getAvailableProviders();
console.log('Available providers:', availableProviders);
// Output: ['apple', 'google'] (iOS の場合)
// Output: ['google', 'oauth'] (Android の場合)

// 3. プロバイダー別にサインイン
async function handleAppleSignIn() {
  const user = await socialAuth.signInWithApple();
  console.log('Logged in user:', user);
}

async function handleGoogleSignIn() {
  const user = await socialAuth.signInWithGoogle();
  console.log('Logged in user:', user);
}

// 4. サインアウト
async function handleSignOut() {
  // 現在のプロバイダーを指定してサインアウト
  await socialAuth.signOut(AuthProvider.APPLE);
  // または
  await socialAuth.signOut(AuthProvider.GOOGLE);
}
```

## ファイル構成

```
src/
├── core/
│   ├── domain/
│   │   └── entities/
│   │       └── Auth.ts              # Auth エンティティ
│   └── network/
│       └── oauth/
│           ├── PKCEFlow.ts          # PKCE フロー
│           ├── OAuth2Client.ts      # OAuth 2.1 クライアント
│           ├── AppleSignIn.ts       # Apple Sign-In 実装
│           ├── GoogleSignIn.ts      # Google Sign-In 実装
│           ├── SocialAuthAdapter.ts # アダプタパターン
│           └── index.ts
```

## セキュリティベストプラクティス

### 1. Identity Token / ID Token の検証

**重要**: クライアント側では JWT 署名検証をしない

```typescript
// ❌ 悪い例：クライアント側で JWT を検証
const decoded = jwt.verify(idToken, publicKey);

// ✅ 良い例：バックエンドで検証
const response = await fetch('https://your-api.com/auth/verify', {
  method: 'POST',
  body: JSON.stringify({ idToken }),
});
const verified = await response.json();
```

### 2. Real User Indicator（Apple）

詐欺ユーザーか検出：

```typescript
const realUserStatus = AppleSignIn.getRealUserStatus(response.realUserStatus);
if (realUserStatus === 'likely') {
  // 信頼できるユーザー
} else if (realUserStatus === 'unsupported') {
  // 検出不可（プロンプトで確認）
}
```

### 3. リフレッシュトークンの管理

```typescript
// ✅ リフレッシュトークンをセキュアストレージに保存
await TokenManager.saveTokens(authToken);

// ❌ ローカル変数やAsyncStorageに保存しない
```

### 4. HTTPS 強制

すべての認証関連通信は HTTPS で行う：

```typescript
// Axios インターセプター例
axios.interceptors.request.use((config) => {
  if (!config.url.startsWith('https://')) {
    throw new Error('HTTPS required for auth requests');
  }
  return config;
});
```

## トラブルシューティング

### 問題1: "Apple Sign-In is not available"

**原因**: iOS デバイスまたは iOS 13.0 未満

**解決**:
```typescript
const available = await AppleSignIn.isAvailable();
if (!available) {
  // 代替認証方法を提供（Google, OAuth など）
}
```

### 問題2: "Identity token verification failed"

**原因**: バックエンドの検証エンドポイントが失敗

**解決**:
1. バックエンドログを確認
2. Identity Token の形式が正しいか確認
3. Apple の署名証明書が最新か確認

### 問題3: Google Sign-In がハング

**原因**: Google Play Services が古い、またはインストールされていない

**解決**:
```typescript
const available = await googleAuth.isAvailable();
if (!available) {
  // エラーハンドリング
}
```

## エンティティ定義

### AppleUser
```typescript
interface AppleUser {
  name: {
    firstName?: string;
    lastName?: string;
    middleName?: string;
    namePrefix?: string;
    nameSuffix?: string;
    nickname?: string;
  };
  email?: string;
  phoneNumber?: string;
}
```

### GoogleUser
```typescript
interface GoogleUser {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  photo?: string;
}
```

### AuthProvider
```typescript
enum AuthProvider {
  OAUTH = 'oauth',
  APPLE = 'apple',
  GOOGLE = 'google',
}
```

## 関連リソース

- [Apple Sign in with Apple Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Google Sign-In for Mobile Apps](https://developers.google.com/identity/sign-in/ios)
- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Expo Google Sign-In](https://docs.expo.dev/versions/latest/sdk/google-sign-in/)
- [OAuth 2.1 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-07)

---

**作成日**: 2025-10-22
**タスク**: 2.2 Sign in with Apple/Google 実装
**ステータス**: ✅ 完了
