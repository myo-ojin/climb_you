# 環境変数セットアップガイド

## 概要

climb-you モバイルアプリは、認証やAPI接続のために環境変数を使用します。このガイドでは、環境変数の設定方法を説明します。

## セットアップ手順

### 1. .env ファイルの作成

プロジェクトルートに `.env` ファイルが既に作成されています。実際の値を設定してください。

```bash
# .env ファイルは既に存在します
mobile/.env
```

### 2. 必須環境変数の設定

以下の環境変数は**必須**です：

```bash
# OAuth 2.1 設定
EXPO_OAUTH_CLIENT_ID=your_oauth_client_id
EXPO_OAUTH_AUTHORIZE_URL=https://your-auth-server.com/oauth/authorize
EXPO_OAUTH_TOKEN_URL=https://your-auth-server.com/oauth/token

# バックエンドAPI
EXPO_AUTH_API_URL=https://your-api.com
```

### 3. オプション環境変数

以下は機能に応じて設定してください：

#### Apple Sign-In（iOS）
```bash
EXPO_APPLE_TEAM_ID=your_apple_team_id
EXPO_APPLE_KEY_ID=your_apple_key_id
```

#### Google Sign-In
```bash
EXPO_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
EXPO_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id.apps.googleusercontent.com
EXPO_GOOGLE_IOS_CLIENT_ID=your_ios_client_id.apps.googleusercontent.com
```

#### Firebase（プッシュ通知）
```bash
EXPO_FIREBASE_API_KEY=your_firebase_api_key
EXPO_FIREBASE_PROJECT_ID=your_firebase_project_id
EXPO_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_FIREBASE_APP_ID=your_firebase_app_id
```

## 開発環境での使用

### ローカル開発

開発環境では、`.env` ファイルに以下のように設定できます：

```bash
EXPO_OAUTH_CLIENT_ID=climb-you-mobile-dev
EXPO_AUTH_API_URL=http://localhost:3000
EXPO_MCP_API_URL=http://localhost:3000/mcp
EXPO_APP_ENV=development
EXPO_DEBUG_MODE=true
```

### 環境変数の読み込み

アプリケーション内では、`src/config/env.ts` を通じて環境変数にアクセスします：

```typescript
import { ENV } from '@/config/env';

// 使用例
const apiUrl = ENV.AUTH_API_URL;
const clientId = ENV.OAUTH_CLIENT_ID;
```

## 環境変数の検証

アプリ起動時に、必須環境変数が設定されているか自動的にチェックされます。

開発モード（`__DEV__`）では、不足している環境変数がコンソールに警告として表示されます：

```
⚠️ Missing required environment variables: OAUTH_CLIENT_ID, AUTH_API_URL
Please check your .env file
```

## セキュリティ

### 重要な注意事項

1. **`.env` ファイルは Git にコミットしないでください**
   - `.gitignore` に既に追加されています
   - 機密情報が含まれるため、公開リポジトリにプッシュしないでください

2. **`.env.example` を参考にしてください**
   - `.env.example` には実際の値を含めず、プレースホルダーのみを記載
   - チームメンバーは `.env.example` をコピーして `.env` を作成

3. **本番環境では別の方法で管理**
   - EAS Secrets を使用（Expo Application Services）
   - CI/CD パイプラインで環境変数を注入

## トラブルシューティング

### 環境変数が読み込まれない

1. `.env` ファイルがプロジェクトルート（`mobile/`）に存在するか確認
2. アプリを再起動（`expo start` を再実行）
3. キャッシュをクリア：`expo start -c`

### 型エラーが発生する

`src/config/env.ts` で型定義を確認してください。新しい環境変数を追加した場合は、`ENV` オブジェクトに追加する必要があります。

## 参考資料

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [EAS Secrets](https://docs.expo.dev/build-reference/variables/)
