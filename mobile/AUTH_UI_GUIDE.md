# 認証UI実装ガイド

## 概要

climb-youモバイルアプリの認証UIは、以下の3つの認証方式をサポートしています：

1. **ソーシャル認証** - Apple Sign-In（iOS）/ Google Sign-In（Android）
2. **生体認証** - Face ID / Touch ID / Fingerprint
3. **従来認証** - メール / パスワード（OAuth 2.1 + PKCE）

## 画面構成

### 1. LoginScreen

**位置**: `src/features/auth/screens/LoginScreen.tsx`

**目的**: ユーザーのログイン画面。複数の認証方式を提供します。

#### 機能

- **生体認証ボタン** - 登録済みトークンを使用した高速ログイン
- **Appleでサインイン** - iOS専用（Sign in with Apple対応）
- **Googleでサインイン** - iOS/Android対応（Google Sign-In）
- **パスワードでサインイン** - メール/パスワードによるログイン

#### UIフロー

```
LoginScreen
├── ヘッダー（タイトル）
├── エラーメッセージ（条件付き）
├── ボタングループ
│   ├── 生体認証ボタン（利用可能時）
│   ├── Appleボタン（iOS時）
│   ├── Googleボタン
│   └── パスワードボタン
└── 利用規約・プライバシーポリシー
```

#### コンポーネント使用例

```typescript
import { LoginScreen } from '@/features/auth';

function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
      />
    </Stack.Navigator>
  );
}
```

### 2. SignUpScreen

**位置**: `src/features/auth/screens/SignUpScreen.tsx`

**目的**: ユーザーのサインアップ・パスワードログイン画面。

#### 機能

- **ログインモード** - メール/パスワードでログイン
- **サインアップモード** - 新規アカウント作成
- **モード切替** - ログイン↔サインアップの相互切替
- **パスワード可視化** - セキュリティと使いやすさのバランス

#### UIフロー

```
SignUpScreen
├── バックボタン
├── タイトル（ログイン/アカウント作成）
├── エラーメッセージ（条件付き）
├── フォーム
│   ├── メールアドレス入力
│   ├── パスワード入力（表示/非表示切替）
│   └── パスワード確認（サインアップ時のみ）
├── ボタン（ログイン/作成）
├── モード切替リンク
└── パスワード忘却リンク（ログイン時のみ）
```

#### コンポーネント使用例

```typescript
import { SignUpScreen } from '@/features/auth';

function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
      />
    </Stack.Navigator>
  );
}
```

## 認証フロー

### フロー1: 生体認証ログイン

```
ユーザーがLoginScreenを開く
    ↓
BiometricAuth.isAvailable()で利用可能性確認
    ↓
生体認証ボタンが表示される
    ↓
ユーザーが生体認証ボタンをタップ
    ↓
BiometricAuth.authenticate()を実行
    ↓
SecureTokenStore.getToken()で保存済みトークン取得
    ↓
SecureTokenStore.isTokenValid()で有効性確認
    ↓
トークンが有効
    ↓
ホーム画面へ遷移 ✅
```

### フロー2: Apple Sign-In（iOS）

```
ユーザーがLoginScreenを開く
    ↓
Platform.OS === 'ios' → Appleボタン表示
    ↓
ユーザーがAppleボタンをタップ
    ↓
SocialAuthAdapter.signInWithApple()実行
    ↓
AppleSignIn.startSignIn()でダイアログ表示
    ↓
ユーザーがFace ID/Touch ID認証
    ↓
AppleSignIn.verifyIdentityToken()でバックエンド検証
    ↓
SecureTokenStore.storeToken()でトークン保存
    ↓
ホーム画面へ遷移 ✅
```

### フロー3: Google Sign-In

```
ユーザーがLoginScreenを開く
    ↓
ユーザーがGoogleボタンをタップ
    ↓
SocialAuthAdapter.signInWithGoogle()実行
    ↓
GoogleSignIn.startSignIn()でGoogleログイン画面表示
    ↓
ユーザーがGoogleアカウント認証
    ↓
GoogleSignIn.verifyIdToken()でバックエンド検証
    ↓
SecureTokenStore.storeToken()でトークン保存
    ↓
ホーム画面へ遷移 ✅
```

### フロー4: メール/パスワードログイン

```
ユーザーがLoginScreenを開く
    ↓
ユーザーが「パスワードでサインイン」をタップ
    ↓
SignUpScreenへ遷移（ログインモード）
    ↓
ユーザーがメールアドレス入力
    ↓
ユーザーがパスワード入力
    ↓
ユーザーが「ログイン」をタップ
    ↓
OAuth2Client.startLogin()でOAuth 2.1フロー開始
    ↓
ユーザーがブラウザで認証
    ↓
OAuth2Client.exchangeCodeForToken()でトークン取得
    ↓
SecureTokenStore.storeToken()でトークン保存
    ↓
生体認証登録を提案
    ↓
ホーム画面へ遷移 ✅
```

### フロー5: メール/パスワードサインアップ

```
ユーザーがLoginScreenを開く
    ↓
ユーザーが「パスワードでサインイン」をタップ
    ↓
SignUpScreenへ遷移（ログインモード）
    ↓
ユーザーが「アカウントをお持ちでない方？」をタップ
    ↓
SignUpScreenモード切替（サインアップモード）
    ↓
ユーザーがメールアドレス入力
    ↓
ユーザーがパスワード入力（要件: 8文字以上、大文字・小文字・数字）
    ↓
ユーザーがパスワード確認入力
    ↓
ユーザーが「作成」をタップ
    ↓
POST /auth/signupでサーバーに登録
    ↓
レスポンスにaccessToken, refreshTokenを含む
    ↓
SecureTokenStore.storeToken()でトークン保存
    ↓
生体認証登録を提案
    ↓
ホーム画面へ遷移 ✅
```

## セキュリティ考慮事項

### 1. トークン保存

```typescript
// ✅ 良い例: expo-secure-store を使用（暗号化）
await SecureTokenStore.storeToken(token);

// ❌ 悪い例: AsyncStorageを使用（平文）
await AsyncStorage.setItem('token', token);
```

### 2. パスワード入力

```typescript
// ✅ 良い例: secureTextEntry={true}（デフォルト）
<TextInput
  secureTextEntry={true}
  value={password}
  onChangeText={setPassword}
/>

// ❌ 悪い例: パスワードが見える
<TextInput
  secureTextEntry={false}
  value={password}
  onChangeText={setPassword}
/>
```

### 3. パスワード要件

```typescript
// ✅ パスワード要件チェック
const validatePassword = (password: string): boolean => {
  // 最小8文字、大文字・小文字・数字を含む
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
};
```

### 4. エラーメッセージ

```typescript
// ✅ 良い例: 一般的なエラーメッセージ
setError('ログインに失敗しました');

// ❌ 悪い例: 特定のアカウント情報を漏らす
setError('メールアドレス user@example.com は登録されていません');
```

### 5. HTTPS強制

```typescript
// ✅ OAuth 2.1フローはHTTPS強制
const oauthConfig: OAuthConfig = {
  authorizeUrl: 'https://auth.example.com/authorize', // HTTPS必須
  tokenUrl: 'https://auth.example.com/token',         // HTTPS必須
  scopes: ['openid', 'profile', 'email'],
};
```

## アクセシビリティ

### スクリーンリーダー対応

すべてのボタンに `accessibilityLabel` と `accessibilityHint` を設定：

```typescript
<TouchableOpacity
  accessibilityLabel="Appleでサインイン"
  accessibilityHint="Appleアカウントを使用してサインインします"
  onPress={handleAppleSignIn}
>
  <Text>Appleでサインイン</Text>
</TouchableOpacity>
```

### タッチターゲットサイズ

ボタンの最小サイズは 44x44pt を確保：

```typescript
styles.button = {
  paddingVertical: 14,  // ≈ 44pt (14 + 8 + 8 + 14)
  paddingHorizontal: 16,
  minHeight: 50,        // > 44pt
};
```

### テキストサイズ対応

`fontSizeMultiplier` を使用して動的テキストサイズに対応：

```typescript
const fontSize = 16 * PixelRatio.getFontScale();
<Text style={{ fontSize }}>アクセシブルなテキスト</Text>
```

## エラーハンドリング

### エラーケース1: 生体認証失敗

```typescript
const result = await BiometricAuth.authenticate();
if (!result.success) {
  // ユーザーに表示
  setError('生体認証に失敗しました。パスワードで再度ログインしてください。');
}
```

### エラーケース2: トークン期限切れ

```typescript
const token = await SecureTokenStore.getToken();
const isValid = await SecureTokenStore.isTokenValid();
if (!isValid) {
  // リフレッシュフロー
  setError('セッションが期限切れです。再度ログインしてください。');
  navigation.replace('Login');
}
```

### エラーケース3: ネットワーク接続失敗

```typescript
try {
  const response = await fetch(apiUrl, { ... });
  if (!response.ok) {
    throw new Error('Network request failed');
  }
} catch (error) {
  setError('ネットワークに接続できません。インターネット接続を確認してください。');
}
```

### エラーケース4: パスワード要件不足

```typescript
if (!validatePassword(password)) {
  setError('パスワードは8文字以上で、大文字・小文字・数字を含む必要があります');
  passwordRef.current?.focus();
}
```

## テスト

### Unit Test

```bash
# LoginScreen テスト
npm test -- LoginScreen.test.ts

# SignUpScreen テスト
npm test -- SignUpScreen.test.ts
```

### E2E Test（Detox）

```bash
# 生体認証ログインフロー
detox test e2e/auth.e2e.ts --configuration ios.sim.debug

# Apple Sign-Inフロー
detox test e2e/apple-signin.e2e.ts --configuration ios.sim.debug

# パスワードログインフロー
detox test e2e/password-login.e2e.ts --configuration android.emu.debug
```

## 実装チェックリスト

- [ ] LoginScreen の実装
- [ ] SignUpScreen の実装
- [ ] 生体認証統合
- [ ] Apple Sign-In 統合
- [ ] Google Sign-In 統合
- [ ] OAuth 2.1 PKCE フロー統合
- [ ] トークン管理（SecureTokenStore）
- [ ] エラーハンドリング
- [ ] アクセシビリティ対応
- [ ] ユニットテスト作成
- [ ] E2Eテスト作成
- [ ] デザイン検証（Dark Mode、iPad対応）
- [ ] セキュリティ監査

## 関連ファイル

| ファイル | 説明 |
|---------|------|
| `src/features/auth/screens/LoginScreen.tsx` | ログイン画面 |
| `src/features/auth/screens/SignUpScreen.tsx` | サインアップ/パスワードログイン画面 |
| `src/services/auth/BiometricAuth.ts` | 生体認証サービス |
| `src/services/auth/SecureTokenStore.ts` | トークン管理サービス |
| `src/core/network/oauth/SocialAuthAdapter.ts` | ソーシャル認証アダプタ |
| `src/core/network/oauth/OAuth2Client.ts` | OAuth 2.1クライアント |
| `SECURE_TOKEN_MANAGEMENT.md` | トークン管理ガイド |
| `SOCIAL_AUTH_IMPLEMENTATION.md` | ソーシャル認証ガイド |
| `OAUTH2_IMPLEMENTATION.md` | OAuth 2.1ガイド |

## 環境変数

`.env` ファイルに以下を設定：

```env
# OAuth 2.1
EXPO_OAUTH_CLIENT_ID=your_oauth_client_id
EXPO_OAUTH_AUTHORIZE_URL=https://auth.example.com/authorize
EXPO_OAUTH_TOKEN_URL=https://auth.example.com/token
EXPO_AUTH_API_URL=https://api.example.com

# Apple Sign-In
EXPO_APPLE_TEAM_ID=your_apple_team_id
EXPO_APPLE_KEY_ID=your_apple_key_id

# Google Sign-In
EXPO_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
EXPO_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com
```

---

**作成日**: 2025-10-22
**タスク**: 2.4 認証UIの構築
**ステータス**: ✅ 完了
