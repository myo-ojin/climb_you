# climb-you Backend

Node.js + Express によるバックエンドAPI実装

## 構造

```
backend/
├── src/
│   ├── controllers/    # コントローラー
│   ├── services/       # ビジネスロジック
│   ├── models/         # データモデル
│   ├── routes/         # ルート定義
│   ├── middleware/     # ミドルウェア
│   ├── utils/          # ユーティリティ
│   └── server.ts       # サーバーエントリーポイント
├── tests/              # テスト
└── package.json
```

## 開発

```bash
npm install
npm run dev
```

## テスト

```bash
npm test
```
