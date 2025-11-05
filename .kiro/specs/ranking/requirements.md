# 要件定義書：ランキング機能

## はじめに

本文書は、climb-youアプリケーションのランキング機能に関する要件を定義する。ランキング機能は、週次で同レベル帯のユーザー同士を比較し、健全な競争とモチベーション向上を促進する。グローバル順位は非表示とし、匿名化と休息日制度により、不健全な競争を避ける設計とする。

## 用語集

- **Ranking_System**：ランキングを管理するシステムコンポーネント
- **User**：climb-youアプリケーションを使用する個人
- **Level_Band**：ユーザーのレベル帯（累計歩数に基づく）
- **Weekly_Ranking**：週次のランキング（月曜日0:00〜日曜日23:59）
- **Leaderboard**：同レベル帯のユーザーランキング表
- **Rank_Score**：ランキングスコア（週次獲得歩数 + 達成率ボーナス）
- **Anonymous_Display**：匿名表示（ユーザー名の代わりに「登山者A」など）
- **Cohort**：同レベル帯のユーザーグループ
- **Freeze_Day_Adjustment**：休息日を考慮したスコア調整
- **MCP_Server**：Model Context Protocolサーバー（バックエンドAPIとの通信を担当）

## 要件

### 要件1：レベル帯の分類

**ユーザーストーリー：** ユーザーとして、自分と同じレベルのユーザーと比較したい。そうすることで、公平な競争ができる。

#### 受入基準

1. THE Ranking_System SHALL 累計歩数に基づいてUserをLevel_Bandに分類する

2. THE Ranking_System SHALL 以下のLevel_Bandを定義する：
   - 初心者（0〜1,000歩）
   - 駆け出し（1,001〜5,000歩）
   - 中級者（5,001〜15,000歩）
   - 上級者（15,001〜30,000歩）
   - エキスパート（30,001〜50,000歩）
   - マスター（50,001歩以上）

3. WHEN User の累計歩数が更新される、THE Ranking_System SHALL Level_Bandを再計算する

4. WHEN User がLevel_Bandを上がる、THE Ranking_System SHALL 「レベルアップ！」通知を表示する

5. THE Ranking_System SHALL Level_Band情報をデータベースに保存する

### 要件2：週次ランキングの生成

**ユーザーストーリー：** ユーザーとして、週ごとのランキングを見たい。そうすることで、短期的な目標とモチベーションが得られる。

#### 受入基準

1. THE Ranking_System SHALL 毎週月曜日0:00に新しいWeekly_Rankingを開始する

2. THE Ranking_System SHALL 週次獲得歩数と達成率に基づいてRank_Scoreを計算する

3. THE Ranking_System SHALL Rank_Scoreの計算式を以下とする：
   - Rank_Score = 週次獲得歩数 × (1 + 達成率ボーナス)
   - 達成率ボーナス = (完了クエスト数 / 全クエスト数) × 0.2

4. THE Ranking_System SHALL 休息日を使用した日はスコア計算から除外する

5. WHEN 日曜日23:59になる、THE Ranking_System SHALL Weekly_Rankingを確定し、スナップショットを保存する

6. THE Ranking_System SHALL 確定したランキングを180日間保持する

### 要件3：同レベル帯ランキングの表示

**ユーザーストーリー：** ユーザーとして、同じレベル帯のランキングを見たい。そうすることで、自分の位置を把握できる。

#### 受入基準

1. WHEN User がランキング画面を開く、THE Ranking_System SHALL 自分のLevel_BandのLeaderboardを表示する

2. THE Ranking_System SHALL Leaderboardに上位20名を表示する

3. THE Ranking_System SHALL 各ユーザーの表示情報に以下を含める：
   - 順位
   - 匿名表示名（「登山者A」「登山者B」など）
   - 週次獲得歩数
   - 達成率

4. THE Ranking_System SHALL 自分の順位を強調表示する

5. IF User が上位20名に入っていない、THEN THE Ranking_System SHALL 自分の順位を別途表示する（例：「あなたは45位です」）

6. THE Ranking_System SHALL グローバル順位を表示しない

### 要件4：匿名化とプライバシー

**ユーザーストーリー：** ユーザーとして、ランキングで匿名表示されたい。そうすることで、プライバシーが守られる。

#### 受入基準

1. THE Ranking_System SHALL ランキング表示で実名を使用しない

2. THE Ranking_System SHALL 匿名表示名を自動生成する（「登山者A」「登山者B」など）

3. THE Ranking_System SHALL 匿名表示名を週ごとにランダム化する

4. THE Ranking_System SHALL ユーザーが自分の順位のみを識別できるようにする

5. THE Ranking_System SHALL 他のユーザーの詳細情報（目標、クエスト内容など）を表示しない

6. THE Ranking_System SHALL ランキング参加をオプトイン方式とする

7. WHEN User がランキング参加を拒否する、THE Ranking_System SHALL そのUserをランキングから除外する

### 要件5：健全性の配慮

**ユーザーストーリー：** ユーザーとして、健全な競争環境で参加したい。そうすることで、ストレスなく楽しめる。

#### 受入基準

1. THE Ranking_System SHALL 休息日を使用したユーザーにペナルティを課さない

2. THE Ranking_System SHALL 極端に高いスコアを異常値として検出する

3. IF 異常値を検出する、THEN THE Ranking_System SHALL そのスコアをランキングから除外し、調査する

4. THE Ranking_System SHALL ランキング画面に「健全な競争を心がけましょう」などのメッセージを表示する

5. THE Ranking_System SHALL 1位のユーザーに過度なプレッシャーを与えないメッセージを表示する

6. THE Ranking_System SHALL 下位のユーザーに励ましのメッセージを表示する

### 要件6：報酬とバッジ

**ユーザーストーリー：** ユーザーとして、ランキング上位に入ったら報酬がほしい。そうすることで、達成感が得られる。

#### 受入基準

1. WHEN User が週次ランキングで1位になる、THE Ranking_System SHALL 「週間チャンピオン」バッジを付与する

2. WHEN User が週次ランキングで上位3位に入る、THE Ranking_System SHALL 「トップ3」バッジを付与する

3. WHEN User が週次ランキングで上位10位に入る、THE Ranking_System SHALL 「トップ10」バッジを付与する

4. THE Ranking_System SHALL バッジをユーザープロフィールに表示する

5. THE Ranking_System SHALL 獲得したバッジの履歴を保存する

6. THE Ranking_System SHALL バッジ獲得時に祝福メッセージを表示する

### 要件7：過去のランキング閲覧

**ユーザーストーリー：** ユーザーとして、過去のランキングを見たい。そうすることで、自分の成長を確認できる。

#### 受入基準

1. THE Ranking_System SHALL 過去のWeekly_Rankingを閲覧できる機能を提供する

2. THE Ranking_System SHALL 過去4週間のランキングを表示する

3. THE Ranking_System SHALL 各週のランキングに自分の順位と獲得歩数を表示する

4. THE Ranking_System SHALL 週ごとの順位変動をグラフで表示する

5. THE Ranking_System SHALL 自己ベスト順位を表示する

### 要件8：ランキング通知

**ユーザーストーリー：** ユーザーとして、ランキング結果を通知してほしい。そうすることで、結果を見逃さない。

#### 受入基準

1. WHEN 週次ランキングが確定する、THE Ranking_System SHALL 結果通知を送信する

2. THE Ranking_System SHALL 通知に自分の順位と獲得歩数を含める

3. IF User が上位3位に入る、THEN THE Ranking_System SHALL 特別な祝福通知を送信する

4. THE Ranking_System SHALL 通知設定をユーザーがカスタマイズできるようにする

5. THE Ranking_System SHALL 通知をオフにするオプションを提供する

### 要件9：データの永続化

**ユーザーストーリー：** ユーザーとして、ランキングデータが保存されることを確認したい。そうすることで、履歴を振り返れる。

#### 受入基準

1. WHEN Ranking_System がデータをMCP_Serverに送信する、THE Ranking_System SHALL OAuth 2.1とPKCEによる認証を使用する

2. THE Ranking_System SHALL 送信データにUser ID、Level_Band、Rank_Score、順位を含める

3. WHEN MCP_Server がデータ保存に成功する、THEN THE Ranking_System SHALL 成功メッセージを表示する

4. IF MCP_Server がエラーを返す、THEN THE Ranking_System SHALL エラー内容をUserに分かりやすく説明し、再試行オプションを提供する

5. THE Ranking_System SHALL ランキングスナップショットを180日間保持する

6. THE Ranking_System SHALL 180日を超えたスナップショットを自動的に削除する

### 要件10：ユーザーエクスペリエンス

**ユーザーストーリー：** ユーザーとして、楽しくランキングを見たい。そうすることで、モチベーションが上がる。

#### 受入基準

1. THE Ranking_System SHALL Apps_SDKのコンポーネントを使用してランキングUIを実装する

2. THE Ranking_System SHALL ランキング表示にアニメーションを使用する

3. THE Ranking_System SHALL 自分の順位上昇時に祝福アニメーションを表示する

4. THE Ranking_System SHALL 順位下降時も前向きなメッセージを表示する（「次週は頑張りましょう！」）

5. THE Ranking_System SHALL ランキング画面の読み込みを3秒以内に完了する

6. THE Ranking_System SHALL レベル帯ごとに異なる色やアイコンを使用する

7. THE Ranking_System SHALL ランキング画面に「これは同レベル帯のランキングです」という説明を表示する
