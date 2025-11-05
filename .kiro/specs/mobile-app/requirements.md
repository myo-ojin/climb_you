# 要件定義書：モバイルアプリ版（React Native）

## はじめに

本文書は、climb-youのReact Nativeモバイルアプリケーションに関する要件を定義する。モバイルアプリ版は、ChatGPT Apps SDK版と同等の機能を提供しつつ、iOS/Androidの両プラットフォームに対応し、ネイティブ機能（プッシュ通知、ウィジェット、ヘルスデータ連携など）を活用した最適化されたモバイル体験を実現する。Windows環境での開発を前提とし、Expo + React Nativeを使用する。

## 用語集

- **Mobile_App**：React Nativeモバイルアプリケーション（iOS/Android対応）
- **React_Native**：クロスプラットフォームモバイルアプリ開発フレームワーク
- **Expo**：React Native開発プラットフォーム
- **TypeScript**：型安全なJavaScriptスーパーセット
- **Push_Notification**：Firebase Cloud Messaging（FCM）を使用したプッシュ通知
- **Local_Notification**：ローカル通知（アプリ内で生成される通知）
- **Widget**：ホーム画面ウィジェット（iOS/Android）
- **Health_Integration**：ヘルスデータ連携（iOS: HealthKit、Android: Google Fit）
- **App_Store**：Apple App Store
- **Play_Store**：Google Play Store
- **EAS**：Expo Application Services（ビルド・デプロイサービス）
- **SQLite**：ローカルデータベース
- **AsyncStorage**：キー・バリュー型ストレージ
- **Keychain**：安全な認証情報保存（iOS: Keychain、Android: Keystore）
- **Deep_Link**：ディープリンク機能
- **Accessibility**：アクセシビリティ機能
- **i18n**：国際化（Internationalization）
- **User**：climb-youアプリケーションを使用する個人
- **MCP_Server**：Model Context Protocolサーバー（バックエンドAPIとの通信を担当）

## 要件

### 要件1：コア機能の実装

**ユーザーストーリー：** ユーザーとして、モバイルアプリでChatGPT Apps SDK版と同等の機能を使いたい。そうすることで、どのプラットフォームでも一貫した体験が得られる。

#### 受入基準

1. THE Mobile_App SHALL ChatGPT Apps SDK版の全機能を実装する
2. THE Mobile_App SHALL 以下のコア機能を含める：
   - オンボーディング（SMART + WOOP、10合目マイルストーン生成、プロファイリング）
   - 日次クエスト生成（自動生成、学習機能、調整機能）
   - クエスト達成ログ（歩数システム、ストリーク、休息日）
   - マイルストーン達成管理（合目達成確認、未達成サポート、停滞検知）
   - ランキング（週次、同レベル帯、匿名化）
   - 通知（プッシュ通知、ローカル通知）
   - データ管理（エクスポート、削除、プライバシー管理）
3. THE Mobile_App SHALL React_Nativeを主要フレームワークとして使用する
4. THE Mobile_App SHALL TypeScriptで実装する
5. THE Mobile_App SHALL iOS 13.0以上をサポートする
6. THE Mobile_App SHALL Android 6.0（API Level 23）以上をサポートする
7. THE Mobile_App SHALL iPhone（全サイズ）とiPadをサポートする
8. THE Mobile_App SHALL Androidスマートフォンとタブレットをサポートする
9. THE Mobile_App SHALL ダークモードとライトモードをサポートする
10. THE Mobile_App SHALL 動的なテキストサイズ調整をサポートする（アクセシビリティ）
11. THE Mobile_App SHALL スクリーンリーダーをサポートする（iOS: VoiceOver、Android: TalkBack）
12. THE Mobile_App SHALL App_StoreとPlay_Storeの審査ガイドラインに準拠する

### 要件2：認証とセキュリティ

**ユーザーストーリー：** ユーザーとして、安全かつ簡単にログインしたい。そうすることで、個人データが保護される。

#### 受入基準

1. THE Mobile_App SHALL Sign in with Appleをサポートする（iOS）
2. THE Mobile_App SHALL Google Sign-Inをサポートする（Android）
3. THE Mobile_App SHALL OAuth 2.1 + PKCEをサポートする
4. THE Mobile_App SHALL 生体認証をサポートする（iOS: Face ID/Touch ID、Android: Fingerprint/Face Unlock）
5. THE Mobile_App SHALL 認証情報をKeychainに安全に保存する
6. THE Mobile_App SHALL Certificate Pinningを実装する
7. THE Mobile_App SHALL HTTPSを強制する
8. THE Mobile_App SHALL アプリのバックグラウンド時にスクリーンショットを防ぐ
9. THE Mobile_App SHALL デバッグ情報の本番環境での無効化を実装する
10. THE Mobile_App SHALL セキュリティ監査を定期的に実施する
11. THE Mobile_App SHALL OWASP Mobile Securityの推奨事項に準拠する

### 要件3：データ同期とオフライン対応

**ユーザーストーリー：** ユーザーとして、オフラインでもアプリを使いたい。そうすることで、ネットワークがない場所でも継続できる。

#### 受入基準

1. THE Mobile_App SHALL SQLiteを使用してローカルデータを管理する
2. THE Mobile_App SHALL AsyncStorageを使用して設定データを保存する
3. THE Mobile_App SHALL MCP_Serverとの同期を実装する
4. THE Mobile_App SHALL オフライン時に以下の機能を提供する：
   - 既存クエストの閲覧
   - クエスト完了の記録（後で同期）
   - 進捗の確認
   - 過去のログ閲覧
5. THE Mobile_App SHALL ネットワーク復旧時の自動同期を実装する
6. THE Mobile_App SHALL データ競合の解決ロジックを実装する（サーバー優先）
7. THE Mobile_App SHALL 同期状況をUIで表示する
8. THE Mobile_App SHALL バックグラウンド同期を実装する
9. THE Mobile_App SHALL 同期エラー時のリトライ機能を実装する
10. THE Mobile_App SHALL データ整合性チェック機能を実装する
11. THE Mobile_App SHALL 手動同期オプションを提供する

### 要件4：プッシュ通知とローカル通知

**ユーザーストーリー：** ユーザーとして、適切なタイミングで通知を受け取りたい。そうすることで、クエストを忘れずに継続できる。

#### 受入基準

1. THE Mobile_App SHALL Firebase Cloud Messaging（FCM）を使用してPush_Notificationを実装する
2. THE Mobile_App SHALL 初回起動時に通知許可を求める
3. THE Mobile_App SHALL 以下のPush_Notificationを送信する：
   - 日次クエスト生成完了（AM 4:00頃）
   - 合目達成祝福（即座）
   - 週次ランキング結果（月曜日AM 9:00）
   - 停滞アラート（30日間同じ合目）
4. THE Mobile_App SHALL 以下のLocal_Notificationを送信する：
   - クエストリマインダー（ユーザー設定時刻）
   - ストリーク継続リマインダー（23:00）
   - 休息日使用可能通知（週の途中）
5. THE Mobile_App SHALL Rich Notifications（画像付き通知）をサポートする
6. THE Mobile_App SHALL Actionable Notifications（通知からの直接アクション）を実装する：
   - 「クエストを確認」
   - 「完了をマーク」
   - 「後で通知」
7. THE Mobile_App SHALL 通知設定画面を提供する
8. THE Mobile_App SHALL 以下の通知設定をカスタマイズ可能にする：
   - 通知の種類別ON/OFF
   - 通知時刻の設定
   - 通知音の選択
   - バッジ表示のON/OFF
9. THE Mobile_App SHALL 通知履歴を記録し、設定画面で確認可能にする
10. THE Mobile_App SHALL 通知からのディープリンクを実装する
11. THE Mobile_App SHALL 通知バッジを更新する

### 要件5：ホーム画面ウィジェット

**ユーザーストーリー：** ユーザーとして、ホーム画面で進捗を確認したい。そうすることで、アプリを開かずに状況を把握できる。

#### 受入基準

1. THE Mobile_App SHALL ホーム画面Widgetを実装する（iOS/Android）
2. THE Mobile_App SHALL 以下のWidgetサイズをサポートする：
   - Small（2x2）
   - Medium（4x2）
   - Large（4x4）
3. THE Mobile_App SHALL Small Widgetに以下を表示する：
   - 現在の合目
   - 今日の進捗（歩数）
   - 現在のストリーク
4. THE Mobile_App SHALL Medium Widgetに以下を表示する：
   - 現在の合目と進捗率
   - 今日のクエスト概要（3つ）
   - 完了状況
5. THE Mobile_App SHALL Large Widgetに以下を表示する：
   - 10合目の山のビジュアル
   - 今日のクエスト詳細
   - 週次ランキング順位
6. THE Mobile_App SHALL Widgetのタップでアプリの適切な画面を開く
7. THE Mobile_App SHALL Widgetを15分ごとに更新する
8. THE Mobile_App SHALL Widget設定画面を提供する（表示内容のカスタマイズ）
9. THE Mobile_App SHALL Widgetにダークモード対応を実装する
10. THE Mobile_App SHALL Widgetのアクセシビリティ対応を実装する

### 要件6：ヘルスデータ連携

**ユーザーストーリー：** ユーザーとして、ヘルスデータと連携したい。そうすることで、健康データと目標達成を関連付けられる。

#### 受入基準

1. THE Mobile_App SHALL ヘルスデータ連携を実装する（iOS: HealthKit、Android: Google Fit）
2. THE Mobile_App SHALL 以下のHealthデータの読み取り権限を要求する：
   - 歩数
   - アクティブエネルギー
   - エクササイズ時間
3. THE Mobile_App SHALL ヘルスデータの歩数をclimb-youの歩数システムと連携する（オプション）
4. THE Mobile_App SHALL Healthデータに基づくクエスト提案を実装する
5. THE Mobile_App SHALL Healthデータのプライバシー設定を尊重する
6. THE Mobile_App SHALL ヘルスデータ連携のON/OFF設定を提供する

### 要件7：パフォーマンスと最適化

**ユーザーストーリー：** ユーザーとして、快適にアプリを使いたい。そうすることで、ストレスなく目標達成に集中できる。

#### 受入基準

1. THE Mobile_App SHALL アプリ起動時間を3秒以内にする
2. THE Mobile_App SHALL 画面遷移のレスポンス時間を0.5秒以内にする
3. THE Mobile_App SHALL メモリ使用量を150MB以下に抑える
4. THE Mobile_App SHALL バッテリー消費を最小化する
5. THE Mobile_App SHALL 画像の遅延読み込みを実装する
6. THE Mobile_App SHALL キャッシュ機能を実装する（APIレスポンス、画像）
7. THE Mobile_App SHALL パフォーマンス測定を実施する（Flipper、React Native Performance）
8. THE Mobile_App SHALL メモリリークの検出と修正を実施する
9. THE Mobile_App SHALL 低電力モード時の動作を最適化する
10. THE Mobile_App SHALL ネットワーク使用量を最小化する
11. THE Mobile_App SHALL 画面遷移を滑らかにする（60fps）
12. THE Mobile_App SHALL Hermes JavaScriptエンジンを使用する

### 要件8：アクセシビリティ

**ユーザーストーリー：** 障害を持つUserとして、アプリを使いたい。そうすることで、誰でも目標達成に取り組める。

#### 受入基準

1. THE Mobile_App SHALL スクリーンリーダーを完全サポートする（iOS: VoiceOver、Android: TalkBack）
2. THE Mobile_App SHALL 全てのUI要素に適切なアクセシビリティラベルを設定する
3. THE Mobile_App SHALL 動的なテキストサイズ調整をサポートする
4. THE Mobile_App SHALL ハイコントラストモードをサポートする
5. THE Mobile_App SHALL 色覚異常への配慮を実装する（色だけに依存しない情報伝達）
6. THE Mobile_App SHALL タッチターゲットサイズを44x44pt以上にする
7. THE Mobile_App SHALL キーボードナビゲーションをサポートする
8. THE Mobile_App SHALL アニメーション削減設定を尊重する
9. THE Mobile_App SHALL アクセシビリティ監査を定期的に実施する
10. THE Mobile_App SHALL WCAG 2.1 AAレベルに準拠する

### 要件9：多言語・多地域対応

**ユーザーストーリー：** 海外Userとして、自分の言語でアプリを使いたい。そうすることで、理解しやすく使いやすい。

#### 受入基準

1. THE Mobile_App SHALL react-i18nextを使用して国際化を実装する
2. THE Mobile_App SHALL 以下の言語をサポートする：
   - 日本語（ja）
   - 英語（en）
3. THE Mobile_App SHALL 以下の地域をサポートする：
   - 日本（JP）
   - アメリカ（US）
   - その他英語圏
4. THE Mobile_App SHALL 右から左（RTL）レイアウトの準備を実装する（将来のアラビア語対応）
5. THE Mobile_App SHALL 地域に応じた日付・時刻フォーマットを使用する
6. THE Mobile_App SHALL 地域に応じた数値フォーマットを使用する
7. THE Mobile_App SHALL 翻訳可能な文字列を外部化する
8. THE Mobile_App SHALL 文字列の長さ変動に対応したレイアウトを実装する
9. THE Mobile_App SHALL 地域固有の機能（祝日など）を考慮する
10. THE Mobile_App SHALL 翻訳品質の管理プロセスを確立する
11. THE Mobile_App SHALL アプリ内で言語切り替えを可能にする

### 要件10：ストア対応とリリース管理

**ユーザーストーリー：** Userとして、App_StoreとPlay_Storeから安全にアプリをダウンロードしたい。そうすることで、信頼できるソースからアプリを入手できる。

#### 受入基準

1. THE Mobile_App SHALL App_StoreとPlay_Storeの審査ガイドラインに完全準拠する
2. THE Mobile_App SHALL 以下のメタデータを含める：
   - アプリ名、説明文（日本語・英語）
   - スクリーンショット（iPhone・iPad・Android）
   - アプリアイコン（全サイズ）
   - プライバシーポリシーURL
   - 利用規約URL
3. THE Mobile_App SHALL EAS（Expo Application Services）を使用してビルドする
4. THE Mobile_App SHALL TestFlight（iOS）とInternal Testing（Android）でベータテストを実施する
5. THE Mobile_App SHALL 段階的リリース（Phased Release）を使用する
6. THE Mobile_App SHALL ストアでの評価とレビューへの対応プロセスを確立する
7. THE Mobile_App SHALL アプリ内購入（将来の有料機能用）の準備を実装する
8. THE Mobile_App SHALL App Store最適化（ASO）を実施する
9. THE Mobile_App SHALL リリースノートの管理プロセスを確立する
10. THE Mobile_App SHALL 緊急時のアプリ更新プロセスを確立する
11. THE Mobile_App SHALL プライバシーラベルを正確に記載する
12. THE Mobile_App SHALL Over-The-Air（OTA）アップデートをサポートする（Expo Updates）

### 要件11：テストとQA

**ユーザーストーリー：** 開発者として、品質の高いアプリをリリースしたい。そうすることで、Userに安定した体験を提供できる。

#### 受入基準

1. THE Mobile_App SHALL 単体テスト（Unit Test）を実装する（カバレッジ80%以上）
2. THE Mobile_App SHALL コンポーネントテストを実装する（React Native Testing Library）
3. THE Mobile_App SHALL E2Eテストを実装する（Detox）
4. THE Mobile_App SHALL パフォーマンステストを実装する
5. THE Mobile_App SHALL 自動テストをCI/CDパイプラインに統合する
6. THE Mobile_App SHALL デバイステストを実施する（iOS・Androidの主要機種）
7. THE Mobile_App SHALL OSバージョンテストを実施する（iOS 13.0〜最新、Android 6.0〜最新）
8. THE Mobile_App SHALL ネットワーク状況テストを実施する（オフライン、低速回線）
9. THE Mobile_App SHALL メモリ不足状況でのテストを実施する
10. THE Mobile_App SHALL バッテリー低下状況でのテストを実施する
11. THE Mobile_App SHALL クラッシュレポートの収集と分析を実装する（Firebase Crashlytics）
12. THE Mobile_App SHALL ベータテスターからのフィードバック収集プロセスを確立する

### 要件12：開発環境とツール

**ユーザーストーリー：** 開発者として、Windows環境で効率的に開発したい。そうすることで、生産性を高められる。

#### 受入基準

1. THE Mobile_App SHALL Windows環境で開発可能にする
2. THE Mobile_App SHALL VS Codeを推奨IDEとする
3. THE Mobile_App SHALL Expoを使用してクロスプラットフォーム開発を実現する
4. THE Mobile_App SHALL Expo Goアプリで開発中のプレビューを可能にする
5. THE Mobile_App SHALL Android Studioでのエミュレータ実行をサポートする
6. THE Mobile_App SHALL ESLintとPrettierでコード品質を維持する
7. THE Mobile_App SHALL TypeScriptの厳格モードを使用する
8. THE Mobile_App SHALL Git Hooksで自動テストとリントを実行する
9. THE Mobile_App SHALL GitHub Actionsでの自動ビルドとテストを実装する
10. THE Mobile_App SHALL Flipperでのデバッグをサポートする
11. THE Mobile_App SHALL React Native Debuggerでのデバッグをサポートする
12. THE Mobile_App SHALL Sentryでのエラートラッキングを実装する

