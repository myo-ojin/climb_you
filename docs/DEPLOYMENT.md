# デプロイメントガイド

## 環境

### 開発環境 (Development)
- **用途**: ローカル開発
- **URL**: http://localhost:3000
- **データベース**: ローカルPostgreSQL

### ステージング環境 (Staging)
- **用途**: テスト・検証
- **URL**: https://staging.climb-you.app
- **データベース**: ステージング用PostgreSQL

### 本番環境 (Production)
- **用途**: 本番サービス
- **URL**: https://climb-you.app
- **データベース**: 本番用PostgreSQL（レプリケーション構成）

## デプロイフロー

```
開発 → テスト → ステージング → 本番
  ↓      ↓         ↓           ↓
 Git   CI/CD   手動承認    自動デプロイ
```

## CI/CD パイプライン

### GitHub Actions

`.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches:
      - main
      - develop

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run lint

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Staging
        run: |
          # デプロイスクリプト実行
          ./scripts/deploy-staging.sh

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Production
        run: |
          # デプロイスクリプト実行
          ./scripts/deploy-production.sh
```

## インフラ構成

### AWS構成例

```
┌─────────────────────────────────────────┐
│   CloudFront (CDN)                      │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Application Load Balancer             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   ECS Fargate (Apps SDK + Backend)      │
│   - Auto Scaling                        │
│   - Health Check                        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   RDS PostgreSQL (Multi-AZ)             │
│   - Read Replica                        │
│   - Automated Backup                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   ElastiCache Redis                     │
└─────────────────────────────────────────┘
```

### Google Cloud構成例

```
┌─────────────────────────────────────────┐
│   Cloud CDN                             │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Cloud Load Balancing                  │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Cloud Run (Apps SDK + Backend)        │
│   - Auto Scaling                        │
│   - Health Check                        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Cloud SQL PostgreSQL                  │
│   - High Availability                   │
│   - Automated Backup                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│   Memorystore Redis                     │
└─────────────────────────────────────────┘
```

## デプロイ手順

### 1. ビルド

```bash
# フロントエンド
cd frontend
npm run build

# バックエンド
cd backend
npm run build

# MCPサーバー
cd mcp-server
npm run build
```

### 2. Dockerイメージ作成

**Dockerfile (Backend)**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

**ビルド & プッシュ**
```bash
# イメージをビルド
docker build -t climb-you-backend:latest .

# レジストリにプッシュ
docker tag climb-you-backend:latest your-registry/climb-you-backend:latest
docker push your-registry/climb-you-backend:latest
```

### 3. データベースマイグレーション

```bash
# ステージング
npm run db:migrate -- --env=staging

# 本番（慎重に！）
npm run db:migrate -- --env=production
```

### 4. デプロイ実行

**AWS ECS**
```bash
# タスク定義を更新
aws ecs register-task-definition --cli-input-json file://task-definition.json

# サービスを更新
aws ecs update-service \
  --cluster climb-you-cluster \
  --service climb-you-service \
  --task-definition climb-you-task:latest
```

**Google Cloud Run**
```bash
# デプロイ
gcloud run deploy climb-you \
  --image gcr.io/your-project/climb-you-backend:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated
```

### 5. ヘルスチェック

```bash
# ヘルスチェックエンドポイント
curl https://climb-you.app/health

# 期待されるレスポンス
{
  "status": "ok",
  "version": "0.1.0",
  "timestamp": "2025-10-19T12:00:00Z"
}
```

## ロールバック

### 手動ロールバック

```bash
# 前のバージョンにロールバック
aws ecs update-service \
  --cluster climb-you-cluster \
  --service climb-you-service \
  --task-definition climb-you-task:previous
```

### 自動ロールバック

- ヘルスチェック失敗時に自動ロールバック
- エラー率が閾値を超えた場合に自動ロールバック

## モニタリング

### メトリクス

**アプリケーション**
- リクエスト数
- レスポンスタイム
- エラー率
- アクティブユーザー数

**インフラ**
- CPU使用率
- メモリ使用率
- ディスク使用率
- ネットワークトラフィック

**ビジネス**
- クエスト完了率
- ストリーク継続率
- 合目達成率
- DAU/MAU

### アラート設定

```yaml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    duration: 5m
    action: notify_slack

  - name: High Response Time
    condition: response_time > 1s
    duration: 5m
    action: notify_slack

  - name: Database Connection Error
    condition: db_connection_error
    duration: 1m
    action: notify_pagerduty
```

## バックアップ

### データベース

**自動バックアップ**
- 毎日午前3時に自動バックアップ
- 30日間保持

**手動バックアップ**
```bash
# バックアップ作成
pg_dump -h localhost -U user climb_you > backup.sql

# リストア
psql -h localhost -U user climb_you < backup.sql
```

### ファイル（証跡画像など）

**S3バックアップ**
```bash
# バックアップ
aws s3 sync s3://climb-you-uploads s3://climb-you-backups/$(date +%Y%m%d)

# リストア
aws s3 sync s3://climb-you-backups/20251019 s3://climb-you-uploads
```

## スケーリング

### 水平スケーリング

**Auto Scaling設定**
```yaml
scaling:
  min_instances: 2
  max_instances: 10
  target_cpu_utilization: 70%
  target_memory_utilization: 80%
```

### 垂直スケーリング

**リソース調整**
- CPU: 2 vCPU → 4 vCPU
- メモリ: 4GB → 8GB

## セキュリティ

### SSL/TLS証明書

```bash
# Let's Encryptで証明書取得
certbot certonly --webroot -w /var/www/html -d climb-you.app
```

### ファイアウォール

```bash
# 必要なポートのみ開放
- 80 (HTTP)
- 443 (HTTPS)
- 5432 (PostgreSQL - 内部のみ)
- 6379 (Redis - 内部のみ)
```

### シークレット管理

**AWS Secrets Manager**
```bash
# シークレット作成
aws secretsmanager create-secret \
  --name climb-you/production/db-password \
  --secret-string "your-password"
```

**Google Secret Manager**
```bash
# シークレット作成
gcloud secrets create db-password \
  --data-file=- <<< "your-password"
```

## トラブルシューティング

### デプロイ失敗

1. ログを確認
2. ヘルスチェックを確認
3. 前のバージョンにロールバック

### パフォーマンス低下

1. メトリクスを確認
2. スロークエリを特定
3. キャッシュを確認
4. スケーリングを検討

### データベース接続エラー

1. 接続数を確認
2. コネクションプールを調整
3. Read Replicaを追加

## チェックリスト

### デプロイ前

- [ ] テストが全て通過
- [ ] リントエラーがない
- [ ] マイグレーションスクリプトを確認
- [ ] 環境変数を確認
- [ ] バックアップを取得

### デプロイ後

- [ ] ヘルスチェックが成功
- [ ] ログにエラーがない
- [ ] メトリクスが正常
- [ ] 主要機能が動作
- [ ] ロールバック手順を確認

## 参考リンク

- [システム全体概要](OVERVIEW.md)
- [開発ガイド](DEVELOPMENT.md)
- [AWS Documentation](https://docs.aws.amazon.com/)
- [Google Cloud Documentation](https://cloud.google.com/docs)
