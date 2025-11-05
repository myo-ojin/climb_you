# climb-you ドキュメント

climb-youの技術ドキュメント集です。

## 📚 ドキュメント一覧

### 概要・設計

- **[システム全体概要](OVERVIEW.md)** - アーキテクチャ、ワークフロー、データモデル、技術スタック
  - プロダクト概要
  - システムアーキテクチャ
  - 全体ワークフロー（Mermaid図付き）
  - 主要機能の説明
  - データモデル（ER図）
  - 技術スタック

- **[アーキテクチャIssue: リポジトリパターン](ARCHITECTURE_ISSUE_REPOSITORY_PATTERN.md)** - リポジトリ配置に関する設計判断
  - 現状の問題点
  - 提案される解決策（Option A vs B）
  - 影響分析
  - 推奨事項

- **[アーキテクチャIssue: モバイルデータベーススキーマ](ARCHITECTURE_ISSUE_MOBILE_DATABASE.md)** - React Native SQLiteスキーマ定義
  - 現状の問題点（未記載テーブル）
  - 必要なスキーマ定義
  - データ型マッピング
  - 実装ノート

- **[実装計画: タスク4.2-4.4完全実装](IMPLEMENTATION_PLAN_TASKS_4_2_4_4.md)** - Clean Architecture準拠の完全実装
  - 実装フェーズ（Phase 1-4）
  - ファイル構造
  - 実装チェックリスト
  - 成功基準

### 既知の問題

- **[既知の問題一覧](KNOWN_ISSUES.md)** - テストとモジュールに関する既知の問題
  - TEST-001: テストフレームワークの不一致（Vitest vs Jest）
  - TEST-002: 空のモジュールエクスポート
  - 推定工数: 合計20〜25分

### 開発

- **[開発ガイド](DEVELOPMENT.md)** - 環境セットアップ、開発ワークフロー、コーディング規約
  - 環境セットアップ手順
  - ブランチ戦略
  - コーディング規約
  - テストの書き方
  - デバッグ方法
  - トラブルシューティング

- **[コントリビューションガイド](CONTRIBUTING.md)** - コントリビューション方法
  - 開発プロセス
  - コーディング規約
  - レビュープロセス

### デプロイ・運用

- **[デプロイメントガイド](DEPLOYMENT.md)** - デプロイ手順、インフラ構成、モニタリング
  - 環境構成
  - CI/CDパイプライン
  - デプロイ手順
  - ロールバック方法
  - モニタリング設定
  - バックアップ・リストア

## 🎯 詳細仕様

詳細な機能仕様は [.kiro/specs/](../.kiro/specs/) を参照してください。

### 機能別仕様書

- **[オンボーディング](../.kiro/specs/onboarding/)** - 目標設定、マイルストーン生成
  - [要件定義](../.kiro/specs/onboarding/requirements.md)
  - [設計書](../.kiro/specs/onboarding/design.md)
  - [タスクリスト](../.kiro/specs/onboarding/tasks.md)

- **[日次クエスト生成](../.kiro/specs/quest-generation/)** - 自動生成、学習機能
  - [要件定義](../.kiro/specs/quest-generation/requirements.md)
  - [設計書](../.kiro/specs/quest-generation/design.md)
  - [タスクリスト](../.kiro/specs/quest-generation/tasks.md)

- **[クエスト達成ログ](../.kiro/specs/quest-logging/)** - 歩数システム、ストリーク
  - [要件定義](../.kiro/specs/quest-logging/requirements.md)
  - [設計書](../.kiro/specs/quest-logging/design.md)
  - [タスクリスト](../.kiro/specs/quest-logging/tasks.md)

- **[マイルストーン達成管理](../.kiro/specs/milestone-management/)** - 合目達成、未達成サポート
  - [要件定義](../.kiro/specs/milestone-management/requirements.md)
  - [設計書](../.kiro/specs/milestone-management/design.md)
  - [タスクリスト](../.kiro/specs/milestone-management/tasks.md)

### デザイン

- **[UIデザインシステム](../.kiro/specs/ui-design/design-system.md)** - カラー、タイポグラフィ、コンポーネント

## 🚀 クイックリンク

### 開発を始める
1. [開発ガイド - 環境セットアップ](DEVELOPMENT.md#環境セットアップ)
2. [コントリビューションガイド](CONTRIBUTING.md)

### 機能を理解する
1. [システム全体概要](OVERVIEW.md)
2. [各機能の要件定義](../.kiro/specs/)

### デプロイする
1. [デプロイメントガイド](DEPLOYMENT.md)

## 📝 ドキュメント更新

ドキュメントの更新は歓迎します！

1. ドキュメントを編集
2. Pull Requestを作成
3. レビュー後にマージ

## 🤝 サポート

質問や問題がある場合：

- **Discord**: [climb-you Community](https://discord.gg/climb-you)
- **Email**: dev@climb-you.app
- **GitHub Issues**: [Issues](https://github.com/your-org/climb-you/issues)

---

**climb-you** - for your next step. 🏔️
