# climb-you

> 長期目標を日次クエストに分解し、自然と登頂＝達成へ導く"山登り"UX

![climb-you](docs/assets/hero-image.png)

## 🏔️ コンセプト

climb-youは、長期目標を「山登り」に見立て、日々のクエストをこなしながら10合目（目標達成）を目指す目標達成支援アプリです。

- **10合目システム** - 長期目標を10段階のマイルストーンに分解
- **歩数システム** - クエスト完了で歩数を獲得し、山を登る
- **自動クエスト生成** - 毎日AM4:00に最適なクエストを自動生成
- **学習機能** - 過去の成功・失敗パターンから学習
- **適応的サポート** - 未達成時の柔軟な対応とサポート

## 📚 ドキュメント

- [システム全体概要](docs/OVERVIEW.md) - アーキテクチャ、ワークフロー、技術スタック
- [開発ガイド](docs/DEVELOPMENT.md) - セットアップ、開発フロー、テスト
- [デプロイメントガイド](docs/DEPLOYMENT.md) - デプロイ、モニタリング、障害対応
- [コントリビューションガイド](docs/CONTRIBUTING.md) - コントリビューション方法
- [仕様書](.kiro/specs/) - 各機能の詳細仕様
- [UIデザインシステム](.kiro/specs/ui-design/design-system.md) - カラー、タイポグラフィ、コンポーネント

## 🚀 クイックスタート

### 前提条件

- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/your-org/climb-you.git
cd climb-you

# 依存関係をインストール
npm install

# 環境変数を設定
cp .env.example .env

# データベースをセットアップ
npm run db:migrate

# 開発サーバーを起動
npm run dev
```

## 📁 プロジェクト構造

```
climb-you/
├── docs/                    # ドキュメント
├── .kiro/specs/            # 仕様書
│   ├── onboarding/         # オンボーディング機能
│   ├── quest-generation/   # 日次クエスト生成機能
│   ├── quest-logging/      # クエスト達成ログ機能
│   ├── milestone-management/ # マイルストーン達成管理機能
│   └── ui-design/          # UIデザインシステム
├── frontend/               # フロントエンド (Apps SDK)
├── backend/                # バックエンド API
├── mcp-server/            # MCPサーバー
├── database/              # データベース
└── README.md
```

## 🛠️ 技術スタック

- **フロントエンド**: ChatGPT Apps SDK (TypeScript)
- **バックエンド**: Node.js / Express
- **データベース**: PostgreSQL + Redis
- **LLM**: OpenAI GPT-4
- **認証**: OAuth 2.1 + PKCE
- **スケジューラー**: Node-cron

## 🎨 デザイン

### カラーパレット

- `#3C507D` - Mountain Blue (メインカラー)
- `#112250` - Night Sky (背景)
- `#E0C58F` - Moonlight Gold (アクセント)
- `#F5F0E9` - Cloud White (テキスト)
- `#D0CBC2` - Mist Gray (セカンダリ)

詳細は [UIデザインシステム](.kiro/specs/ui-design/design-system.md) を参照してください。

## 📝 開発ガイド

### ブランチ戦略

- `main` - 本番環境
- `develop` - 開発環境
- `feature/*` - 機能開発
- `fix/*` - バグ修正

### コミットメッセージ

```
feat: 新機能
fix: バグ修正
docs: ドキュメント
style: フォーマット
refactor: リファクタリング
test: テスト
chore: その他
```

### テスト

```bash
# 全テストを実行
npm test

# 特定のテストを実行
npm test -- quest-generation

# カバレッジを確認
npm run test:coverage
```

## 🔒 セキュリティ

- OAuth 2.1 + PKCE認証
- データベース暗号化
- HTTPS/TLS 1.3
- 入力検証（SQLインジェクション、XSS対策）
- 監査ログ

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

コントリビューションを歓迎します！詳細は [CONTRIBUTING.md](docs/CONTRIBUTING.md) を参照してください。

## 📧 お問い合わせ

- Email: support@climb-you.app
- Twitter: [@climb_you](https://twitter.com/climb_you)
- Discord: [climb-you Community](https://discord.gg/climb-you)

---

**climb-you** - for your next step. 🏔️
