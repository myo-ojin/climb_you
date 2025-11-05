# climb-you Database

PostgreSQL データベーススキーマとマイグレーション

## 構造

```
database/
├── migrations/         # マイグレーションファイル
├── seeds/             # シードデータ
└── schema.sql         # スキーマ定義
```

## マイグレーション

```bash
# マイグレーション実行
npm run db:migrate

# ロールバック
npm run db:rollback

# シードデータ投入
npm run db:seed
```

## テーブル一覧

- `users` - ユーザー
- `goals` - 長期目標
- `milestones` - マイルストーン
- `user_profiles` - ユーザープロファイル
- `quest_bundles` - クエストバンドル
- `quests` - クエスト
- `quest_logs` - クエストログ
- `climbing_progress` - 登頂進捗
- `streaks` - ストリーク
- `success_patterns` - 成功パターン
- `failure_patterns` - 失敗パターン
