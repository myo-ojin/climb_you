# climb-you MCP Server

Model Context Protocol サーバー実装

## 構造

```
mcp-server/
├── src/
│   ├── tools/          # MCPツール定義
│   ├── auth/           # 認証処理
│   ├── schemas/        # JSON Schema定義
│   └── server.ts       # MCPサーバー
└── package.json
```

## 開発

```bash
npm install
npm run dev
```

## ツール一覧

- `goal.analyze` - 目標のSMART分析
- `goal.create` - 目標作成
- `quest.generate` - クエスト生成
- `quest.complete` - クエスト完了記録
- `milestone.achieve` - マイルストーン達成
