# 要件定義書：通知機能

## はじめに

本文書は、climb-youアプリケーションの通知機能に関する要件を定義する。通知機能は、クエスト生成、達成、リマインダーなどのタイミングでユーザーに情報を伝え、エンゲージメントを高める。

## 用語集

- **Notification_System**：通知を管理するシステムコンポーネント
- **Push_Notification**：プッシュ通知（Firebase Cloud Messaging経由、iOS/Android対応）
- **Local_Notification**：ローカル通知（アプリ内で生成される通知、expo-notifications使用）
- **In_App_Notification**：アプリ内通知
- **Rich_Notification**：画像付き通知（iOS/Android対応）
- **Actionable_Notification**：通知からの直接アクション（iOS/Android対応）
- **Notification_Type**：通知の種類（クエスト生成、達成、リマインダーなど）
- **Notification_Settings**：ユーザーの通知設定
- **FCM**：Firebase Cloud Messaging（iOS/Android統一プッシュ通知サービス）
- **Expo_Notifications**：Expoの通知ライブラリ（ローカル通知、通知ハンドリング）
- **Deep_Link**：ディープリンク（通知からの画面遷移）
- **Notification_Channel**：通知チャンネル（Android 8.0+、通知の分類）

## 要件

### 要件1：クエスト生成通知

**ユーザーストーリー：** ユーザーとして、今日のクエストが生成されたら通知してほしい。

#### 受入基準

1. WHEN 日次クエストが生成される、THE Notification_System SHALL Firebase Cloud Messaging（FCM）を使用してPush_Notificationを送信する
2. THE Notification_System SHALL 通知に「今日のクエストが準備できました」というメッセージを含める
3. THE Notification_System SHALL 通知をAM4:00頃に送信する
4. THE Notification_System SHALL Rich_Notificationとして山のビジュアルを含める（iOS/Android）
5. THE Notification_System SHALL Actionable_Notificationとして「クエストを確認」アクションを含める（iOS/Android）
6. THE Notification_System SHALL 通知タップ時にReact Navigationでホーム画面に遷移する（Deep_Link）
7. THE Notification_System SHALL 通知チャンネルを設定する（Android: "quest_updates"）

### 要件2：達成通知

**ユーザーストーリー：** ユーザーとして、合目達成やストリーク更新を通知してほしい。

#### 受入基準

1. WHEN User が合目を達成する、THE Notification_System SHALL 祝福通知を送信する
2. WHEN User のストリークが7日、30日、100日に達する、THE Notification_System SHALL 特別通知を送信する
3. THE Notification_System SHALL 通知に達成内容を含める

### 要件3：リマインダー通知

**ユーザーストーリー：** ユーザーとして、クエストを忘れないようリマインダーがほしい。

#### 受入基準

1. THE Notification_System SHALL expo-notificationsを使用してLocal_Notificationでリマインダーを送信する
2. THE Notification_System SHALL ユーザーが設定した時間にリマインダーを送信する
3. THE Notification_System SHALL デフォルトのリマインダー時間を夜8時とする
4. IF User が当日のクエストを完了していない、THEN THE Notification_System SHALL リマインダーを送信する
5. THE Notification_System SHALL ストリーク継続リマインダーを23:00に送信する
6. THE Notification_System SHALL 休息日使用可能通知を週の途中に送信する
7. THE Notification_System SHALL Actionable_Notificationとして「完了をマーク」「後で通知」アクションを含める（iOS/Android）
8. THE Notification_System SHALL 通知チャンネルを設定する（Android: "reminders"）
9. THE Notification_System SHALL 通知のスケジューリングにexpo-notificationsのscheduleNotificationAsyncを使用する

### 要件4：ランキング通知

**ユーザーストーリー：** ユーザーとして、週次ランキング結果を通知してほしい。

#### 受入基準

1. WHEN 週次ランキングが確定する、THE Notification_System SHALL 結果通知を送信する
2. THE Notification_System SHALL 通知に順位と獲得歩数を含める
3. IF User が上位3位に入る、THEN THE Notification_System SHALL 特別な祝福通知を送信する

### 要件5：通知設定

**ユーザーストーリー：** ユーザーとして、通知をカスタマイズしたい。

#### 受入基準

1. THE Notification_System SHALL 通知のオン/オフを設定できる機能を提供する
2. THE Notification_System SHALL 通知タイプごとにオン/オフを設定できるようにする：
   - クエスト生成通知
   - 合目達成通知
   - ストリーク通知
   - ランキング通知
   - リマインダー通知
3. THE Notification_System SHALL リマインダー時間を変更できるようにする
4. THE Notification_System SHALL 通知音を選択できるようにする（iOS/Android）
5. THE Notification_System SHALL バッジ表示のON/OFFを設定できるようにする（iOS/Android）
6. THE Notification_System SHALL 通知設定をAsyncStorageに保存する
7. THE Notification_System SHALL 通知履歴を記録し、設定画面で確認可能にする
8. THE Notification_System SHALL 通知チャンネルの重要度を設定できるようにする（Android）

### 要件6：通知の配信

**ユーザーストーリー：** ユーザーとして、確実に通知を受け取りたい。

#### 受入基準

1. THE Notification_System SHALL Firebase Cloud Messaging（FCM）、expo-notifications、In_App_Notificationをサポートする
2. THE Notification_System SHALL 通知配信の失敗を検知し、リトライする
3. THE Notification_System SHALL 通知履歴をSQLiteに保存する（30日間）
4. THE Notification_System SHALL 通知をタップした際にReact Navigationで適切な画面に遷移する（Deep_Link）
5. THE Notification_System SHALL バッジ数を更新する（iOS/Android）
6. THE Notification_System SHALL expo-notificationsのsetNotificationHandlerで通知を動的に処理する
7. THE Notification_System SHALL フォアグラウンド通知の表示設定を実装する
8. THE Notification_System SHALL バックグラウンド通知のハンドリングを実装する

### 要件7：プラットフォーム固有の通知機能

**ユーザーストーリー：** ユーザーとして、各プラットフォームの通知機能を活用したい。

#### 受入基準

1. THE Notification_System SHALL Firebase Cloud Messaging（FCM）を使用してPush_Notificationを実装する（iOS/Android統一）
2. THE Notification_System SHALL 初回起動時に通知許可を求める（iOS/Android）
3. THE Notification_System SHALL Rich_Notificationをサポートする（iOS/Android）
4. THE Notification_System SHALL Actionable_Notificationをサポートする（iOS/Android）
5. THE Notification_System SHALL 通知からのDeep_Linkを実装する（iOS/Android）
6. THE Notification_System SHALL 通知グループ化をサポートする（iOS 12+、Android 7.0+）
7. THE Notification_System SHALL 通知チャンネルを実装する（Android 8.0+）
8. THE Notification_System SHALL 通知の重要度レベルを設定する（Android）
9. THE Notification_System SHALL デバイストークンの管理を実装する（FCM）
10. THE Notification_System SHALL トークンリフレッシュのハンドリングを実装する

### 要件8：停滞アラート通知

**ユーザーストーリー：** ユーザーとして、停滞している場合にアラートがほしい。

#### 受入基準

1. WHEN User が30日間同じ合目にいる、THE Notification_System SHALL 停滞アラートを送信する
2. THE Notification_System SHALL アラートに原因探索の提案を含める
3. THE Notification_System SHALL アラートから目標再設定画面に遷移できるようにする
