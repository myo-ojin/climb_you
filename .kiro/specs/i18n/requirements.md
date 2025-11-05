# 要件定義書：多言語対応（国際化）

## はじめに

本文書は、climb-youアプリケーションの多言語対応に関する要件を定義する。MVPでは日本語と英語をサポートし、将来的に他言語への拡張を容易にする設計とする。

## 用語集

- **I18n**：Internationalization（国際化）
- **L10n**：Localization（ローカライゼーション）
- **Locale**：ロケール（言語と地域の組み合わせ）
- **Translation_Key**：翻訳キー
- **Fallback_Language**：フォールバック言語（デフォルト言語）

## 要件

### 要件1：サポート言語

**ユーザーストーリー：** ユーザーとして、自分の言語でアプリを使いたい。

#### 受入基準

1. THE I18n_System SHALL 日本語（ja）をサポートする
2. THE I18n_System SHALL 英語（en）をサポートする
3. THE I18n_System SHALL デフォルト言語を英語とする
4. THE I18n_System SHALL ユーザーのデバイス言語を自動検出する
5. THE I18n_System SHALL 言語設定を手動で変更できるようにする

### 要件2：翻訳対象

**ユーザーストーリー：** ユーザーとして、全ての画面が翻訳されていてほしい。

#### 受入基準

1. THE I18n_System SHALL 以下を翻訳する：
   - UI要素（ボタン、ラベル、メニュー）
   - メッセージ（成功、エラー、通知）
   - 説明文
   - プレースホルダー
2. THE I18n_System SHALL ユーザー生成コンテンツ（目標、クエスト）は翻訳しない
3. THE I18n_System SHALL 日付・時刻をロケールに応じてフォーマットする
4. THE I18n_System SHALL 数値をロケールに応じてフォーマットする

### 要件3：翻訳ファイル管理

**ユーザーストーリー：** 開発者として、翻訳を管理しやすくしたい。

#### 受入基準

1. THE I18n_System SHALL JSON形式で翻訳ファイルを管理する
2. THE I18n_System SHALL 翻訳キーを階層構造で管理する
3. THE I18n_System SHALL 翻訳ファイルを言語ごとに分離する
4. THE I18n_System SHALL 翻訳の欠落を検出する機能を提供する

**翻訳ファイル例：**
```json
{
  "common": {
    "app_name": "climb-you",
    "ok": "OK",
    "cancel": "キャンセル"
  },
  "onboarding": {
    "welcome": "climb-youへようこそ",
    "goal_input": "目標を入力してください"
  },
  "quest": {
    "today_quests": "今日のクエスト",
    "complete": "完了",
    "skip": "見送り"
  }
}
```

### 要件4：動的コンテンツの翻訳

**ユーザーストーリー：** ユーザーとして、動的なメッセージも翻訳されてほしい。

#### 受入基準

1. THE I18n_System SHALL 変数を含むメッセージをサポートする
2. THE I18n_System SHALL 複数形をサポートする
3. THE I18n_System SHALL 日付・時刻の相対表現をサポートする

**例：**
```json
{
  "steps_earned": "{{steps}}歩獲得しました！",
  "days_streak": {
    "one": "{{count}}日連続",
    "other": "{{count}}日連続"
  },
  "time_ago": {
    "just_now": "たった今",
    "minutes_ago": "{{count}}分前",
    "hours_ago": "{{count}}時間前"
  }
}
```

### 要件5：文化的配慮

**ユーザーストーリー：** ユーザーとして、文化に配慮された表現を使ってほしい。

#### 受入基準

1. THE I18n_System SHALL 文化的に不適切な表現を避ける
2. THE I18n_System SHALL 日付フォーマットをロケールに合わせる（日本：2025/10/19、米国：10/19/2025）
3. THE I18n_System SHALL 時刻フォーマットをロケールに合わせる（日本：24時間制、米国：12時間制）
4. THE I18n_System SHALL 通貨表示をロケールに合わせる（将来の課金機能用）

### 要件6：RTL対応（将来）

**ユーザーストーリー：** 開発者として、将来的にRTL言語をサポートしたい。

#### 受入基準

1. THE I18n_System SHALL RTL（Right-to-Left）言語への拡張を考慮した設計とする
2. THE I18n_System SHALL レイアウトを論理的な方向（start/end）で指定する
3. THE I18n_System SHALL アイコンの向きを反転できるようにする

### 要件7：翻訳品質

**ユーザーストーリー：** ユーザーとして、自然な翻訳を読みたい。

#### 受入基準

1. THE I18n_System SHALL ネイティブスピーカーによる翻訳レビューを実施する
2. THE I18n_System SHALL 文脈に応じた適切な翻訳を使用する
3. THE I18n_System SHALL 専門用語を統一する
4. THE I18n_System SHALL 翻訳の一貫性を保つ

### 要件8：言語切り替え

**ユーザーストーリー：** ユーザーとして、言語を簡単に切り替えたい。

#### 受入基準

1. THE I18n_System SHALL 設定画面で言語を切り替えられるようにする
2. THE I18n_System SHALL 言語切り替え後に即座に反映する
3. THE I18n_System SHALL 選択した言語をローカルストレージに保存する
4. THE I18n_System SHALL アプリ再起動後も言語設定を保持する

### 要件9：翻訳の更新

**ユーザーストーリー：** 開発者として、翻訳を簡単に更新したい。

#### 受入基準

1. THE I18n_System SHALL 翻訳ファイルの更新をアプリ再起動なしで反映できるようにする（開発環境）
2. THE I18n_System SHALL 翻訳の欠落を警告する
3. THE I18n_System SHALL 未翻訳のキーにはフォールバック言語を使用する
4. THE I18n_System SHALL 翻訳管理ツール（Crowdin、Lokalise等）との統合を検討する
