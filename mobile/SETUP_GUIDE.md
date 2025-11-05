# climb-you Mobile App セットアップガイド

## 📋 前提条件

- Node.js 18以上
- npm または yarn
- Expo CLI
- Android Studio（Android開発用）
- Xcode（iOS開発用、macOSのみ）

## 🚀 セットアップ手順

### 1. 依存関係のインストール

```bash
cd mobile
npm install
```

### 2. 環境変数の設定

`.env.example` をコピーして `.env` ファイルを作成し、実際の値を設定してください。

```bash
cp .env.example .env
```

詳細は [ENV_SETUP.md](./ENV_SETUP.md) を参照してください。

### 3. 開発サーバーの起動

```bash
# Expo開発サーバーを起動
npm start

# または特定のプラットフォームで起動
npm run android  # Android
npm run ios      # iOS（macOSのみ）
npm run web      # Web
```

## 🧪 テスト

```bash
# 全テストを実行
npm test

# ウォッチモードでテスト
npm run test:watch

# カバレッジレポート生成
npm run test:coverage
```

## 🔍 コード品質チェック

### Linting

```bash
# ESLintでコードをチェック
npm run lint

# 自動修正
npm run lint:fix
```

### Formatting

```bash
# Prettierでフォーマットをチェック
npm run format:check

# 自動フォーマット
npm run format
```

### 型チェック

```bash
# TypeScriptの型チェック
npm run type-check
```

## 📁 プロジェクト構造

```
mobile/
├── src/
│   ├── app/              # アプリケーションエントリーポイント
│   ├── assets/           # 画像、フォント等の静的ファイル
│   ├── config/           # 設定ファイル（環境変数等）
│   ├── core/             # コアロジック
│   │   ├── data/         # データ層（Repository実装）
│   │   ├── domain/       # ドメイン層（Entity、UseCase）
│   │   └── network/      # ネットワーク層（API、MCP）
│   ├── features/         # 機能別モジュール
│   │   ├── auth/         # 認証機能
│   │   ├── onboarding/   # オンボーディング
│   │   ├── quest/        # クエスト機能
│   │   └── ...
│   ├── navigation/       # ナビゲーション設定
│   ├── services/         # サービス層（Auth、Analytics等）
│   ├── shared/           # 共通コンポーネント・ユーティリティ
│   └── store/            # グローバル状態管理（Redux）
├── .env                  # 環境変数（Git管理外）
├── .env.example          # 環境変数テンプレート
├── .eslintrc.js          # ESLint設定
├── .prettierrc           # Prettier設定
├── jest.config.js        # Jest設定
├── tsconfig.json         # TypeScript設定
└── package.json          # 依存関係
```

## 🏗️ アーキテクチャ

本プロジェクトは **Clean Architecture** と **Feature-Based Structure** を採用しています。

### レイヤー構造

1. **Presentation Layer** (`src/features/*/screens`, `src/shared/components`)
   - UI コンポーネント
   - React Native コンポーネント

2. **Application Layer** (`src/features/*/hooks`, `src/store`)
   - ビジネスロジック
   - 状態管理（Redux）

3. **Domain Layer** (`src/core/domain`)
   - エンティティ
   - ユースケース
   - リポジトリインターフェース

4. **Data Layer** (`src/core/data`)
   - リポジトリ実装
   - データソース（Local、Remote）

5. **Infrastructure Layer** (`src/core/network`, `src/services`)
   - API クライアント
   - 外部サービス連携

## 🔐 認証

本アプリは以下の認証方法をサポートしています：

- OAuth 2.1 + PKCE
- Sign in with Apple（iOS）
- Sign in with Google
- 生体認証（Face ID / Touch ID / Fingerprint）

詳細は以下のドキュメントを参照：
- [OAUTH2_IMPLEMENTATION.md](./OAUTH2_IMPLEMENTATION.md)
- [AUTH_UI_GUIDE.md](./AUTH_UI_GUIDE.md)
- [SECURE_TOKEN_MANAGEMENT.md](./SECURE_TOKEN_MANAGEMENT.md)

## 🌐 ネットワーク

### MCP（Model Context Protocol）

本アプリはMCPサーバーと通信して、以下の機能を提供します：

- 目標分析（SMART + WOOP）
- マイルストーン生成
- クエスト生成
- ユーザープロファイル管理

詳細は [MCP_CLIENT_GUIDE.md](./MCP_CLIENT_GUIDE.md) を参照。

### エラーハンドリング

包括的なネットワークエラーハンドリングを実装しています：

- リトライロジック（エクスポーネンシャルバックオフ）
- オフライン検知
- トークン自動リフレッシュ

詳細は [NETWORK_ERROR_HANDLING_GUIDE.md](./NETWORK_ERROR_HANDLING_GUIDE.md) を参照。

## 💾 データ管理

### ローカルストレージ

- **SQLite**: 構造化データ（Goal、Quest、QuestLog等）
- **AsyncStorage**: 設定、キャッシュ
- **SecureStore**: 認証トークン

詳細は [DATABASE_SETUP.md](./DATABASE_SETUP.md) を参照。

## 🧩 状態管理

Redux Toolkit を使用したグローバル状態管理：

```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login, selectIsAuthenticated } from '@/store/slices/authSlice';

function MyComponent() {
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  
  // ...
}
```

## 📱 開発のヒント

### デバッグ

```bash
# React Native Debuggerを使用
# Chrome DevToolsでデバッグ
# Flipperでネットワーク・データベースを確認
```

### ホットリロード

Expo開発サーバーは自動的にホットリロードを有効にします。

### エミュレータ/シミュレータ

```bash
# Androidエミュレータ
npm run android

# iOSシミュレータ（macOSのみ）
npm run ios
```

## 🚨 トラブルシューティング

### キャッシュクリア

```bash
# Expoキャッシュをクリア
npm start -- --clear

# node_modulesを再インストール
rm -rf node_modules
npm install
```

### ビルドエラー

```bash
# TypeScriptエラーをチェック
npm run type-check

# ESLintエラーをチェック
npm run lint
```

## 📚 参考資料

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## 🤝 コントリビューション

プロジェクトへの貢献方法については、ルートディレクトリの [CONTRIBUTING.md](../docs/CONTRIBUTING.md) を参照してください。

## 📄 ライセンス

このプロジェクトのライセンス情報については、ルートディレクトリの LICENSE ファイルを参照してください。
