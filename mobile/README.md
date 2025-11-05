# climb-you Mobile App

React Native（Expo）を使用したclimb-youのモバイルアプリケーション。

## 🚀 クイックスタート

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env
# .env ファイルを編集して実際の値を設定

# 開発サーバーの起動
npm start
```

詳細なセットアップ手順は [SETUP_GUIDE.md](./SETUP_GUIDE.md) を参照してください。

## 📱 サポートプラットフォーム

- iOS 13.0以上
- Android 6.0（API 23）以上

## 🏗️ 技術スタック

- **フレームワーク**: React Native + Expo
- **言語**: TypeScript
- **状態管理**: Redux Toolkit
- **ナビゲーション**: React Navigation
- **ネットワーク**: Axios
- **ローカルDB**: SQLite
- **テスト**: Jest + React Native Testing Library
- **Linting**: ESLint + Prettier

## 📚 ドキュメント

- [セットアップガイド](./SETUP_GUIDE.md)
- [環境変数設定](./ENV_SETUP.md)
- [プロジェクト構造](./PROJECT_STRUCTURE.md)
- [OAuth 2.1実装](./OAUTH2_IMPLEMENTATION.md)
- [認証UI](./AUTH_UI_GUIDE.md)
- [MCPクライアント](./MCP_CLIENT_GUIDE.md)
- [ネットワークエラーハンドリング](./NETWORK_ERROR_HANDLING_GUIDE.md)
- [データベース](./DATABASE_SETUP.md)
- [テスト](./TESTING.md)

## 🧪 テスト

```bash
# 全テストを実行
npm test

# ウォッチモード
npm run test:watch

# カバレッジレポート
npm run test:coverage
```

## 🔍 コード品質

```bash
# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check

# Type check
npm run type-check
```

## 📦 ビルド

```bash
# 開発ビルド
eas build --profile development --platform android
eas build --profile development --platform ios

# 本番ビルド
eas build --profile production --platform android
eas build --profile production --platform ios
```

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！詳細は [CONTRIBUTING.md](../docs/CONTRIBUTING.md) を参照してください。

## 📄 ライセンス

このプロジェクトのライセンス情報については、ルートディレクトリの LICENSE ファイルを参照してください。
