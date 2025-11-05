# Secure Token Management & Biometric Authentication

## 概要

climb-youモバイルアプリのセキュアなトークン管理と生体認証の実装ガイド。

### 機能

- **トークンの暗号化保存** - expo-secure-store による自動暗号化
- **トークンローテーション** - 定期的なトークン更新と履歴管理
- **有効期限管理** - 自動更新とプロアクティブな期限切れ検出
- **セキュアな削除** - トークンの完全な削除保証
- **生体認証** - Face ID / Touch ID / Fingerprint による認証

## アーキテクチャ

### 層構造

```
┌─────────────────────────────────────┐
│  Application Layer                  │
│  - Auth Screens, Components         │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│  Service Layer                      │
│  - BiometricAuth                    │
│  - SecureTokenStore                 │
│  - TokenManager                     │
└────────────────┬────────────────────┘
                 │
┌────────────────▼────────────────────┐
│  Storage Layer                      │
│  - expo-secure-store (Encrypted)    │
│  - KeyChain/Keystore (OS)           │
└─────────────────────────────────────┘
```

### クラス間の関係

```
TokenManager (from OAuth flow)
    │
    └─► SecureTokenStore
            │
            ├─► Biometric Challenge
            │   └─► BiometricAuth
            │
            └─► Token Rotation
                └─► History Tracking
```

## SecureTokenStore

### 概要

`SecureTokenStore` はトークンの暗号化保存、ローテーション追跡、有効期限管理を提供します。

### コア機能

#### 1. トークン保存・取得

```typescript
import { SecureTokenStore } from '@/services/auth';
import { AuthToken } from '@/core/domain/entities';

// トークンを保存
const authToken: AuthToken = {
  accessToken: 'eyJhbGciOiJSUzI1NiI...',
  refreshToken: 'refresh_token_xyz',
  expiresIn: 3600,
  tokenType: 'Bearer',
  scope: 'openid profile email',
  issuedAt: Math.floor(Date.now() / 1000),
};

await SecureTokenStore.storeToken(authToken);

// トークンを取得
const token = await SecureTokenStore.getToken();
if (token) {
  console.log('Access Token:', token.accessToken);
  console.log('Expires at:', new Date(token.expiresAt));
}
```

#### 2. トークン有効性確認

```typescript
// 有効期限をチェック（60秒以上の余裕が必要）
const isValid = await SecureTokenStore.isTokenValid();
if (!isValid) {
  // トークンをリフレッシュ
  await refreshAccessToken();
}

// 5分以内に期限切れになるかチェック
const expiringsoon = await SecureTokenStore.isTokenExpiringSoon(5);
if (expiringsoon) {
  // プロアクティブにリフレッシュ
  await refreshAccessToken();
}

// 残り時間を秒単位で取得
const remainingSeconds = await SecureTokenStore.getTokenRemainingTime();
console.log(`Token expires in ${remainingSeconds} seconds`);
```

#### 3. トークン削除

```typescript
// 現在のトークンを削除
await SecureTokenStore.deleteToken();

// すべてのセキュアデータをクリア（ログアウト時）
await SecureTokenStore.clearAllSecureData();
```

#### 4. ローテーション管理

```typescript
// ローテーション履歴を取得
const history = await SecureTokenStore.getTokenHistory();
history.forEach((record) => {
  console.log(`Token rotated at: ${new Date(record.timestamp)}`);
  console.log(`Token hash: ${record.tokenHash}`); // プライベートマスキング
});

// 古い履歴をクリア（7日以上前のみ保持）
await SecureTokenStore.clearOldTokenHistory(7);

// 最後のローテーション時刻を取得
const lastRotation = await SecureTokenStore.getLastRotationTime();
if (lastRotation) {
  console.log(`Last rotated: ${new Date(lastRotation)}`);
}

// 24時間以上経過していたらローテーションが必要
const needsRotation = await SecureTokenStore.needsRotation(24);
if (needsRotation) {
  await refreshAccessToken();
}
```

### セキュアストレージの詳細

#### キー構成

```typescript
// キープレフィックス
private static readonly SECURE_KEY_PREFIX = 'secure_auth:';

// 保存されるキー
CURRENT_TOKEN_KEY:   'secure_auth:current'   // 現在のトークン
TOKEN_HISTORY_KEY:   'secure_auth:history'   // ローテーション履歴
TOKEN_ROTATION_KEY:  'secure_auth:rotation'  // ローテーション追跡データ
```

#### SecureToken インターフェース

```typescript
interface SecureToken {
  accessToken: string;        // OAuth 2.1 access token
  refreshToken?: string;      // Refresh token
  expiresAt: number;          // Unix timestamp (ミリ秒)
  tokenType: string;          // Usually "Bearer"
  scope?: string;             // OAuth スコープ
  issuedAt: number;           //発行時刻 (ミリ秒)
}
```

#### ハッシング

トークン履歴ではプレーンテキストのアクセストークンを保存せず、最初の8文字と最後の8文字のみを保存します：

```typescript
// 保存例: "abc12345...xyz98765"
private static async hashToken(token: string): Promise<string> {
  const chars = token.substring(0, 8);
  const tail = token.substring(token.length - 8);
  return `${chars}...${tail}`;
}
```

### 実装パターン

#### パターン1: ログイン時のトークン保存

```typescript
async function handleLoginSuccess(authResponse: AuthCodeResponse) {
  // 1. トークンを取得
  const token = await exchangeCodeForToken(authResponse.code);

  // 2. セキュアストレージに保存
  await SecureTokenStore.storeToken(token);

  // 3. ローテーション条件をチェック
  const needsRotation = await SecureTokenStore.needsRotation(24);
  if (needsRotation) {
    // 定期的なローテーション実行
  }

  console.log('Token saved securely');
}
```

#### パターン2: API呼び出し前のトークン検証

```typescript
async function ensureValidToken(): Promise<string> {
  // 1. 現在のトークンを確認
  const token = await SecureTokenStore.getToken();
  if (!token) {
    throw new Error('No token available');
  }

  // 2. 有効期限をチェック
  const isValid = await SecureTokenStore.isTokenValid();
  if (isValid) {
    return token.accessToken;
  }

  // 3. 有効期限切れの場合はリフレッシュ
  const refreshedToken = await TokenManager.refreshToken();
  await SecureTokenStore.storeToken(refreshedToken);
  return refreshedToken.accessToken;
}

// API呼び出し
const accessToken = await ensureValidToken();
const response = await fetch('https://api.example.com/user', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

#### パターン3: 定期的なトークンローテーション

```typescript
// バックグラウンドタスクで24時間ごとに実行
async function rotateTokenIfNeeded() {
  const needsRotation = await SecureTokenStore.needsRotation(24);

  if (needsRotation) {
    try {
      const newToken = await TokenManager.refreshToken();
      await SecureTokenStore.storeToken(newToken);
      console.log('Token rotated successfully');
    } catch (error) {
      console.error('Token rotation failed:', error);
      // ログアウトを強制
      await handleLogout();
    }
  }
}
```

#### パターン4: ログアウト時の完全クリーンアップ

```typescript
async function handleLogout() {
  try {
    // 1. バックエンドにログアウトリクエスト
    await fetch('https://api.example.com/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
      },
    });
  } catch (error) {
    console.warn('Logout API failed, clearing local data:', error);
  }

  // 2. すべてのセキュアデータをクリア
  await SecureTokenStore.clearAllSecureData();

  // 3. UI状態をリセット
  navigate('LoginScreen');
}
```

## BiometricAuth

### 概要

`BiometricAuth` は Face ID、Touch ID、Fingerprint などの生体認証機能を提供します。

### コア機能

#### 1. 生体認証の利用可能性確認

```typescript
import { BiometricAuth, BiometricType } from '@/services/auth';

// ハードウェアと登録状態をチェック
const available = await BiometricAuth.isAvailable();
if (!available) {
  console.log('Biometric authentication not available');
}

// サポートされているタイプを取得
const supportedTypes = await BiometricAuth.getSupportedTypes();
console.log('Supported types:', supportedTypes);
// Output: [BiometricType.FACE, BiometricType.FINGERPRINT]

// Face ID が利用可能か確認
const faceIdAvailable = await BiometricAuth.isFaceIdAvailable();

// Fingerprint が利用可能か確認
const fingerprintAvailable = await BiometricAuth.isFingerprintAvailable();

// デバイスがセキュアか確認（画面ロック設定など）
const deviceSecure = await BiometricAuth.isDeviceSecure();
```

#### 2. 生体認証実行

```typescript
async function authenticateUser() {
  try {
    // 生体認証を実行
    const result = await BiometricAuth.authenticate();

    if (result.success) {
      console.log('Authentication successful');
      console.log('Type:', BiometricAuth.biometricTypeToString(result.type));
      // UI: ロック解除、トランザクション承認など

      return true;
    } else {
      console.log('Authentication failed:', result.error);
      // UI: エラーメッセージ表示、リトライオプション

      return false;
    }
  } catch (error) {
    console.error('Biometric error:', error);
    return false;
  }
}
```

### BiometricType 値

```typescript
enum BiometricType {
  FACE = 'face',           // Face ID (iOS) / Face Unlock (Android)
  FINGERPRINT = 'fingerprint', // Touch ID (iOS) / Fingerprint (Android)
  IRIS = 'iris',           // Iris recognition (Android only)
  UNKNOWN = 'unknown',     // Unknown or unmapped type
}
```

### BiometricAuthResult インターフェース

```typescript
interface BiometricAuthResult {
  success: boolean;        // 認証成功フラグ
  type?: BiometricType;   // 使用された生体認証タイプ
  error?: string;         // エラーメッセージ
}
```

### プラットフォーム別対応

| タイプ | iOS | Android | 備考 |
|--------|-----|---------|------|
| Face | Face ID | Face Unlock | iOS 13+ / Android 10+ |
| Fingerprint | Touch ID | Fingerprint | iOS 7+ / Android 6+ |
| Iris | ❌ | ❌ | Samsung Galaxy のみ |

### 実装パターン

#### パターン1: ログイン画面での生体認証

```typescript
async function BiometricLoginScreen() {
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    async function checkBiometric() {
      const available = await BiometricAuth.isAvailable();
      const types = await BiometricAuth.getSupportedTypes();
      setBiometricAvailable(available && types.length > 0);
    }
    checkBiometric();
  }, []);

  async function handleBiometricLogin() {
    const result = await BiometricAuth.authenticate();

    if (result.success) {
      // 生体認証成功 → トークン取得
      const token = await SecureTokenStore.getToken();
      if (token && (await SecureTokenStore.isTokenValid())) {
        // ホーム画面へ遷移
        navigate('HomeScreen');
      } else {
        // トークンを再取得（リフレッシュフロー）
        await handlePasswordLogin();
      }
    } else {
      // エラー表示
      Alert.alert('認証失敗', result.error || '生体認証に失敗しました');
    }
  }

  return (
    <View>
      {biometricAvailable && (
        <TouchableOpacity onPress={handleBiometricLogin}>
          <Text>生体認証でログイン</Text>
        </TouchableOpacity>
      )}
      {/* ... パスワードログイン ... */}
    </View>
  );
}
```

#### パターン2: トランザクション承認

```typescript
async function confirmTransaction(amount: number) {
  // 1. 生体認証が利用可能か確認
  const available = await BiometricAuth.isAvailable();
  if (!available) {
    // PIN コード入力にフォールバック
    return await requestPINCode();
  }

  // 2. 生体認証を実行
  const result = await BiometricAuth.authenticate();

  if (result.success) {
    // 3. トランザクション実行
    const token = await SecureTokenStore.getToken();
    const response = await api.post('/transactions', {
      amount,
      token: token?.accessToken,
    });

    return response;
  } else {
    throw new Error(result.error);
  }
}
```

#### パターン3: 設定画面での生体認証状態表示

```typescript
function BiometricSettingsScreen() {
  const [biometricInfo, setBiometricInfo] = useState({
    available: false,
    enabled: false,
    types: [] as BiometricType[],
  });

  useEffect(() => {
    async function loadBiometricInfo() {
      const available = await BiometricAuth.isAvailable();
      const types = await BiometricAuth.getSupportedTypes();

      setBiometricInfo({
        available,
        enabled: available, // ユーザー設定値
        types,
      });
    }
    loadBiometricInfo();
  }, []);

  return (
    <View>
      <Text>生体認証設定</Text>
      {biometricInfo.available ? (
        <>
          <Text>対応タイプ: {biometricInfo.types.map((t) => BiometricAuth.biometricTypeToString(t)).join(', ')}</Text>
          <Switch
            value={biometricInfo.enabled}
            onValueChange={async (enabled) => {
              // ユーザーの設定を保存
              await saveUserBiometricSetting(enabled);
            }}
          />
        </>
      ) : (
        <Text style={{ color: 'red' }}>お使いのデバイスでは生体認証は利用できません</Text>
      )}
    </View>
  );
}
```

## セキュリティベストプラクティス

### 1. トークン保存

```typescript
// ✅ 良い例: expo-secure-store を使用
await SecureTokenStore.storeToken(token);

// ❌ 悪い例: AsyncStorage に保存（平文）
await AsyncStorage.setItem('token', token.accessToken);
```

### 2. トークン有効期限管理

```typescript
// ✅ 良い例: API呼び出し前に確認
const isValid = await SecureTokenStore.isTokenValid();
if (!isValid) {
  const newToken = await refreshToken();
  await SecureTokenStore.storeToken(newToken);
}

// ❌ 悪い例: 期限切れトークンで API呼び出し
const token = await SecureTokenStore.getToken();
await api.get('/user', { headers: { Authorization: token.accessToken } });
```

### 3. 生体認証フォールバック

```typescript
// ✅ 良い例: フォールバック機構を実装
async function authenticate() {
  const biometricAvailable = await BiometricAuth.isAvailable();

  if (biometricAvailable) {
    const result = await BiometricAuth.authenticate();
    if (result.success) return true;
  }

  // フォールバック: パスワード入力
  return await promptPasswordEntry();
}

// ❌ 悪い例: 生体認証のみに依存
const result = await BiometricAuth.authenticate();
if (!result.success) throw new Error('Authentication failed');
```

### 4. ログアウト時の完全クリーンアップ

```typescript
// ✅ 良い例: すべてのセキュアデータをクリア
async function logout() {
  await SecureTokenStore.clearAllSecureData();
  // UI をリセット
}

// ❌ 悪い例: トークン削除のみ
await SecureTokenStore.deleteToken();
// 他のデータが残る可能性
```

### 5. エラーハンドリング

```typescript
// ✅ 良い例: 詳細なエラー情報をログに記録
try {
  await SecureTokenStore.storeToken(token);
} catch (error) {
  console.error('Token storage failed:', error);
  // ユーザーに通知、ログアウトを検討
}

// ❌ 悪い例: エラーを無視
try {
  await SecureTokenStore.storeToken(token);
} catch (error) {
  // エラー無視
}
```

## トラブルシューティング

### 問題1: "Biometric authentication is not available"

**原因**: デバイスが生体認証ハードウェアを持っていない、または登録されていない

**解決**:
```typescript
const available = await BiometricAuth.isAvailable();
if (!available) {
  // パスワード/PIN入力にフォールバック
  showPasswordLoginForm();
}
```

### 問題2: トークンがセキュアストレージに保存されない

**原因**: expo-secure-store がネイティブ実装を利用できていない

**解決**:
```bash
# Expo Go では利用不可。ビルドが必要
eas build --platform ios
eas build --platform android
```

### 問題3: 古いトークンが削除されない

**原因**: `clearAllSecureData()` がエラーで失敗

**解決**:
```typescript
try {
  await SecureTokenStore.clearAllSecureData();
} catch (error) {
  console.error('Clear failed, trying individual delete:', error);
  await SecureTokenStore.deleteToken();
}
```

### 問題4: 生体認証が反応しない（Android）

**原因**: Google Play Services が古い、またはインストールされていない

**解決**:
1. デバイスの Google Play ストアを更新
2. Google Play Services をアップデート
3. 他の認証方法にフォールバック

## テスト

### Unit Test (Vitest)

```bash
# BiometricAuth テスト
npm test -- BiometricAuth.test.ts

# SecureTokenStore テスト
npm test -- SecureTokenStore.test.ts

# すべての auth テスト
npm test -- src/services/auth
```

### Integration Test

生体認証とトークン管理の統合テスト：

```typescript
describe('Biometric + Token Integration', () => {
  it('should store token after biometric auth', async () => {
    // 1. 生体認証実行
    const bioResult = await BiometricAuth.authenticate();
    expect(bioResult.success).toBe(true);

    // 2. トークンを保存
    await SecureTokenStore.storeToken(mockToken);

    // 3. トークンを取得して検証
    const stored = await SecureTokenStore.getToken();
    expect(stored?.accessToken).toBe(mockToken.accessToken);
  });
});
```

## パフォーマンス考慮事項

### 1. トークン有効期限チェック

```typescript
// 頻繁に呼び出すので、キャッシュを検討
let cachedValidity: boolean | null = null;
let cacheTime = 0;

async function isTokenValidCached(): Promise<boolean> {
  const now = Date.now();
  if (cachedValidity !== null && now - cacheTime < 5000) {
    return cachedValidity;
  }

  cachedValidity = await SecureTokenStore.isTokenValid();
  cacheTime = now;
  return cachedValidity;
}
```

### 2. 生体認証チェック

```typescript
// ワンタイム確認でいい場合がほとんど
const types = await BiometricAuth.getSupportedTypes(); // 1回のみ
// 複数の画面で使う場合は useCallback でメモ化
```

## 関連リソース

- [expo-secure-store Documentation](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [expo-local-authentication Documentation](https://docs.expo.dev/versions/latest/sdk/local-authentication/)
- [OWASP Mobile Security Top 10](https://owasp.org/www-project-mobile-top-10/)
- [Apple Secure Coding Guide](https://developer.apple.com/security/)
- [Android Security & Privacy Best Practices](https://developer.android.com/privacy-and-security)

---

**作成日**: 2025-10-22
**タスク**: 2.3 Secure Store トークン管理 & 生体認証
**ステータス**: ✅ 完了
