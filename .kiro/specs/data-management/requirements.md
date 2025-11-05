# 要件定義書：データ管理機能

## はじめに

本文書は、climb-youアプリケーションのデータ管理機能に関する要件を定義する。データ管理機能は、ユーザーデータのエクスポート、削除、プライバシー管理、アクセスログ、コンプライアンス対応を提供し、GDPR、CCPA、個人情報保護法などの国際的なデータ保護規制に準拠する。ユーザーの権利を尊重し、透明性の高いデータ管理を実現する。

## 用語集

- **Data_Management_System**：データ管理を行うシステムコンポーネント
- **User**：climb-youアプリケーションを使用する個人
- **Personal_Data**：ユーザーに関連する全ての個人データ
- **Data_Export**：ユーザーデータのエクスポート（機械可読形式）
- **Data_Deletion**：ユーザーデータの完全削除
- **Data_Portability**：データポータビリティ（他サービスへの移行可能性）
- **GDPR**：EU一般データ保護規則
- **CCPA**：カリフォルニア州消費者プライバシー法
- **APPI**：日本の個人情報保護法
- **Right_to_Access**：アクセス権（自分のデータを閲覧する権利）
- **Right_to_Rectification**：訂正権（データの修正を求める権利）
- **Right_to_Erasure**：削除権（忘れられる権利）
- **Right_to_Portability**：データポータビリティの権利
- **Right_to_Object**：異議申立権（データ処理への異議）
- **Anonymized_Data**：匿名化データ（個人を特定できないデータ）
- **Retention_Period**：データ保持期間
- **Grace_Period**：猶予期間（削除前の復元可能期間）
- **Audit_Log**：監査ログ（データアクセスの記録）
- **MCP_Server**：Model Context Protocolサーバー（バックエンドAPIとの通信を担当）
- **SQLite**：ローカルデータベース（expo-sqlite、構造化データの保存）
- **AsyncStorage**：キー・バリュー型ストレージ（設定データの保存）
- **Data_Sync**：データ同期（ローカルとサーバー間）
- **Conflict_Resolution**：競合解決（同期時のデータ競合処理、サーバー優先）
- **Offline_Mode**：オフラインモード（ネットワーク接続なしでの動作）
- **Background_Sync**：バックグラウンド同期（expo-background-fetch使用）
- **NetInfo**：ネットワーク状態検知（@react-native-community/netinfo）
- **Sync_Queue**：同期待ちキュー（オフライン時の操作を保存）

## 要件

### 要件1：データエクスポート（Right to Access & Portability）

**ユーザーストーリー：** ユーザーとして、自分の全データを機械可読形式でエクスポートしたい。そうすることで、データの内容を確認でき、他サービスへの移行も可能になる。

#### 受入基準

1. THE Data_Management_System SHALL 設定画面に「データをエクスポート」ボタンを提供する

2. WHEN User が「データをエクスポート」を選択する、THE Data_Management_System SHALL エクスポート範囲の選択画面を表示する

3. THE Data_Management_System SHALL 以下のエクスポート範囲オプションを提供する：「全データ」「目標とマイルストーンのみ」「クエスト履歴のみ」「プロファイル情報のみ」

4. THE Data_Management_System SHALL エクスポート形式の選択を提供する：「JSON」「CSV」

5. WHEN User がエクスポートを実行する、THE Data_Management_System SHALL エクスポートリクエストをキューに追加する

6. THE Data_Management_System SHALL エクスポート処理を24時間以内に完了する

7. THE Data_Management_System SHALL エクスポートデータに以下を含める：
   - ユーザーアカウント情報（匿名ID、作成日時、同意タイムスタンプ）
   - 長期目標（タイトル、KPI、期間、WOOP要素）
   - 10合目のマイルストーン（各合目の詳細、達成状況、証跡）
   - ユーザープロファイル（7つの質問への回答）
   - クエスト履歴（全クエストの詳細、生成日時、調整内容）
   - 達成ログ（完了/見送り/阻害の記録、証跡、所要時間）
   - 登頂進捗（累計歩数、現在の合目、進捗率）
   - ストリーク記録（現在値、最高記録、履歴）
   - 成功・失敗パターン（学習データ）
   - ランキング履歴（過去の順位、獲得バッジ）
   - 通知設定と履歴
   - データアクセスログ

8. THE Data_Management_System SHALL エクスポートファイルを暗号化する（AES-256）

9. THE Data_Management_System SHALL エクスポートファイルのダウンロードリンクを生成する

10. THE Data_Management_System SHALL ダウンロードリンクをメールで送信する

11. THE Data_Management_System SHALL ダウンロードリンクの有効期限を7日間とする

12. THE Data_Management_System SHALL ダウンロード後、ファイルを30日間保持し、その後自動削除する

13. THE Data_Management_System SHALL エクスポート履歴を記録する（リクエスト日時、完了日時、ダウンロード日時）

### 要件2：アカウント削除

**ユーザーストーリー：** ユーザーとして、アカウントを削除したい。

#### 受入基準

1. THE Data_Management_System SHALL アカウント削除機能を提供する
2. THE Data_Management_System SHALL 削除前に確認ダイアログを表示する
3. THE Data_Management_System SHALL 削除理由を質問する（オプション）
4. WHEN User がアカウント削除を確定する、THE Data_Management_System SHALL 30日間の猶予期間を設ける
5. THE Data_Management_System SHALL 猶予期間中はデータを保持し、復元可能にする
6. THE Data_Management_System SHALL 猶予期間後に全データを完全削除する

### 要件3：データ削除の範囲

**ユーザーストーリー：** ユーザーとして、削除されるデータの範囲を知りたい。

#### 受入基準

1. THE Data_Management_System SHALL 以下のデータを削除する：
   - ユーザーアカウント
   - 目標とマイルストーン
   - クエスト履歴
   - 達成ログ
   - プロファイル情報
   - 証跡ファイル
2. THE Data_Management_System SHALL 匿名化された統計データは保持する
3. THE Data_Management_System SHALL 削除完了後に確認メールを送信する

### 要件4：プライバシー設定

**ユーザーストーリー：** ユーザーとして、プライバシー設定を管理したい。

#### 受入基準

1. THE Data_Management_System SHALL プライバシー設定画面を提供する
2. THE Data_Management_System SHALL 以下の設定を提供する：
   - ランキング参加のオン/オフ
   - データ分析への同意
   - マーケティング通知の受信
3. THE Data_Management_System SHALL 設定変更を即座に反映する
4. THE Data_Management_System SHALL プライバシーポリシーへのリンクを提供する

### 要件5：データアクセスログ

**ユーザーストーリー：** ユーザーとして、自分のデータへのアクセス履歴を見たい。

#### 受入基準

1. THE Data_Management_System SHALL データアクセスログを記録する
2. THE Data_Management_System SHALL ログに日時、アクセス種類、IPアドレスを含める
3. THE Data_Management_System SHALL 過去90日間のログを表示する
4. THE Data_Management_System SHALL 不審なアクセスを検知し、通知する

### 要件6：コンプライアンス

**ユーザーストーリー：** ユーザーとして、自分のデータが適切に管理されていることを確認したい。

#### 受入基準

1. THE Data_Management_System SHALL GDPR、CCPA等の規制に準拠する
2. THE Data_Management_System SHALL データ保持期間を明示する
3. THE Data_Management_System SHALL データ処理の目的を明示する
4. THE Data_Management_System SHALL 同意の撤回を可能にする

### 要件7：ローカルデータ管理

**ユーザーストーリー：** ユーザーとして、オフラインでもアプリを使いたい。そうすることで、ネットワークがない場所でも継続できる。

#### 受入基準

1. THE Data_Management_System SHALL SQLite（expo-sqlite）を使用してローカルデータを管理する
2. THE Data_Management_System SHALL 以下のデータをローカルに保存する：
   - 目標とマイルストーン
   - クエスト（今日と過去7日分）
   - 達成ログ（過去30日分）
   - ユーザープロファイル
   - 進捗データ（累計歩数、ストリーク）
3. THE Data_Management_System SHALL AsyncStorageを使用して設定データを保存する：
   - 通知設定
   - 言語設定
   - テーマ設定
   - 最終同期日時
4. THE Data_Management_System SHALL ローカルデータの暗号化を実装する（expo-secure-store）
5. THE Data_Management_System SHALL ローカルデータの整合性チェックを実装する
6. THE Data_Management_System SHALL データベーススキーマのマイグレーション機能を実装する

### 要件8：オフライン対応

**ユーザーストーリー：** ユーザーとして、オフライン時にも基本機能を使いたい。

#### 受入基準

1. THE Data_Management_System SHALL @react-native-community/netinfoでネットワーク状態を検知する
2. THE Data_Management_System SHALL オフライン時に以下の機能を提供する：
   - 既存クエストの閲覧
   - クエスト完了の記録（後で同期）
   - 進捗の確認
   - 過去のログ閲覧
3. THE Data_Management_System SHALL オフライン時の操作をSync_Queueに保存する
4. THE Data_Management_System SHALL ネットワーク復旧時に自動同期する
5. THE Data_Management_System SHALL 同期状況をUIで表示する（同期中、同期完了、同期エラー）
6. THE Data_Management_System SHALL オフラインモードのインジケーターを表示する

### 要件9：データ同期

**ユーザーストーリー：** ユーザーとして、複数デバイスでデータを同期したい。

#### 受入基準

1. THE Data_Management_System SHALL MCP_Serverとの同期を実装する
2. THE Data_Management_System SHALL 以下のタイミングで同期を実行する：
   - アプリ起動時
   - アプリがフォアグラウンドに戻った時
   - データ変更後（5秒のデバウンス）
   - バックグラウンド同期（15分ごと、expo-background-fetch使用）
3. THE Data_Management_System SHALL 同期エラー時のリトライ機能を実装する（最大3回、指数バックオフ）
4. THE Data_Management_System SHALL 手動同期オプションを提供する（Pull-to-Refresh）
5. THE Data_Management_System SHALL 同期中のローディング表示を実装する
6. THE Data_Management_System SHALL 最終同期日時をAsyncStorageに保存し、UIで表示する
7. THE Data_Management_System SHALL 同期の成功/失敗をログに記録する

### 要件10：競合解決

**ユーザーストーリー：** ユーザーとして、データ競合が自動的に解決されてほしい。

#### 受入基準

1. THE Data_Management_System SHALL データ競合を検出する（updated_atタイムスタンプ比較）
2. THE Data_Management_System SHALL サーバー優先のConflict_Resolutionを実装する
3. THE Data_Management_System SHALL 競合解決のログをSQLiteに記録する
4. THE Data_Management_System SHALL 重要な競合はユーザーに通知する
5. THE Data_Management_System SHALL 競合したローカルデータをバックアップとして保存する（7日間）

### 要件11：バックグラウンド同期

**ユーザーストーリー：** ユーザーとして、アプリを開いていなくてもデータが同期されてほしい。

#### 受入基準

1. THE Data_Management_System SHALL expo-background-fetchを使用してBackground_Syncを実装する
2. THE Data_Management_System SHALL バックグラウンド同期を15分ごとに実行する
3. THE Data_Management_System SHALL バックグラウンド同期の成功/失敗をAsyncStorageに記録する
4. THE Data_Management_System SHALL 低電力モード時はバックグラウンド同期を制限する
5. THE Data_Management_System SHALL バックグラウンド同期のタスクを登録する（registerTaskAsync）
6. THE Data_Management_System SHALL バックグラウンド同期の最小間隔を設定する（minimumInterval）

### 要件12：データ整合性

**ユーザーストーリー：** ユーザーとして、データの整合性が保たれてほしい。

#### 受入基準

1. THE Data_Management_System SHALL ローカルデータの整合性チェックを実装する
2. THE Data_Management_System SHALL 破損したデータを検出し、修復する
3. THE Data_Management_System SHALL 整合性エラーをSQLiteログテーブルに記録する
4. THE Data_Management_System SHALL 修復不可能な場合はサーバーから再取得する
5. THE Data_Management_System SHALL データベーストランザクションを使用してデータの一貫性を保証する
6. THE Data_Management_System SHALL 定期的な整合性チェックを実装する（週1回）

### 要件13：ストレージ管理

**ユーザーストーリー：** ユーザーとして、アプリのストレージ使用量を管理したい。

#### 受入基準

1. THE Data_Management_System SHALL expo-file-systemを使用してストレージ使用量を計算する
2. THE Data_Management_System SHALL 以下の内訳を表示する：
   - ローカルデータベース（SQLite）
   - 証跡ファイル（画像）
   - キャッシュ（画像キャッシュ）
   - 設定データ（AsyncStorage）
3. THE Data_Management_System SHALL キャッシュクリア機能を提供する
4. THE Data_Management_System SHALL 古い証跡ファイルの削除機能を提供する（180日以上前）
5. THE Data_Management_System SHALL ストレージ使用量が500MBを超えた場合に警告する
6. THE Data_Management_System SHALL ストレージ使用量を設定画面で確認可能にする
7. THE Data_Management_System SHALL データベースの最適化機能を提供する（VACUUM）
