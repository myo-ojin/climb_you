# 要件定義書：オンボーディング機能

## はじめに

本文書は、climb-youアプリケーションのオンボーディング機能に関する要件を定義する。オンボーディング機能は、新規ユーザーが長期目標を設定し、それを10段階のマイルストン（10合目システム）に分解し、1日のコミットタイムとユーザープロファイルを設定するプロセスを支援する。目標は5分以内に完了可能な会話型インターフェースを通じて設定される。

## 用語集

- **Onboarding_System**：ユーザーの初期設定を支援するシステムコンポーネント
- **User**：climb-youアプリケーションを使用する個人
- **Long_Term_Goal**：ユーザーが達成したい長期的な目標（SMART基準に準拠）
- **SMART基準**：Specific（具体的）、Measurable（測定可能）、Achievable（達成可能）、Relevant（関連性）、Time-bound（期限付き）の頭文字
- **WOOP手法**：Wish（願望）、Outcome（結果）、Obstacle（障害）、Plan（計画）の頭文字。目標達成の障害を事前に想定し対策を立てる手法
- **Milestone**：長期目標を達成するための中間地点（10段階の「合目」として表現）
- **Station**：マイルストンの各段階を表す単位（1合目〜10合目）
- **Daily_Commit_Time**：ユーザーが目標達成のために1日にコミットできる時間
- **User_Profile**：ユーザーのライフスタイル、作業環境、好み、スキルレベルなどの情報
- **KPI**：Key Performance Indicator（主要業績評価指標）
- **Apps_SDK**：ChatGPT内でアプリケーションを実行するための開発キット
- **MCP_Server**：Model Context Protocolサーバー（バックエンドAPIとの通信を担当）
- **Widget_State**：セッション間で保持される軽量なUI状態データ

## 要件

### 要件1：長期目標の設定（SMART + WOOP）

**ユーザーストーリー：** ユーザーとして、長期的な目標を自由に入力し、システムに分析してもらいたい。そうすることで、明確で達成可能な目標を設定できる。

#### 受入基準

1. WHEN User がオンボーディングを開始する、THEN THE Onboarding_System SHALL 長期目標の自由入力を促すメッセージを表示する

2. WHEN User が目標を送信する、THE Onboarding_System SHALL 入力内容をSMART基準（具体性、測定可能性、達成可能性、関連性、期限）に基づいて分析する

3. IF User が入力した目標がSMART基準の1つ以上を満たしていない、THEN THE Onboarding_System SHALL 不足している要素を明示し、改善を促す追加質問を提示する

4. WHEN User がSMART基準を満たす目標を完成させる、THE Onboarding_System SHALL WOOP手法に基づいて以下を質問する：「この目標を達成したら、どんな良いことがありますか？（Outcome）」

5. WHEN User が期待する結果を入力する、THE Onboarding_System SHALL 「目標達成を妨げる可能性のある障害は何ですか？（Obstacle）」を質問する

6. WHEN User が障害を入力する、THE Onboarding_System SHALL 「その障害に直面したら、どう対処しますか？（Plan）」を質問する

7. WHEN User が対処計画を入力する、THE Onboarding_System SHALL 目標タイトル、KPI、期待する結果、予想される障害、対処計画を確定し、期間選択ステップに進む

8. THE Onboarding_System SHALL 目標設定プロセスを300秒以内に完了可能な設計とする

### 要件2：期間の設定

**ユーザーストーリー：** ユーザーとして、目標達成までの期間を選択または入力したい。そうすることで、現実的なペースで進められる。

#### 受入基準

1. WHEN 目標のSMART分析が完了する、THEN THE Onboarding_System SHALL 期間選択画面を表示する

2. THE Onboarding_System SHALL 以下の選択肢を提供する：「1ヶ月以内」「3ヶ月以内」「6ヶ月以内」「1年以内」「その他（自由記入）」

3. IF User が「その他」を選択する、THEN THE Onboarding_System SHALL 自由記入フィールドを表示し、期間の入力を受け付ける

4. WHEN User が期間を選択または入力する、THE Onboarding_System SHALL 期間をLong_Term_Goalに関連付ける

5. THE Onboarding_System SHALL 期間設定完了後、Daily_Commit_Time設定ステップに進む

### 要件3：1日のコミットタイムとユーザープロファイルの設定

**ユーザーストーリー：** ユーザーとして、目標に対して1日にどれくらい時間を使えるかと、自分のライフスタイルや好みを設定したい。そうすることで、自分に合った現実的なクエストが生成される。

#### 受入基準

1. WHEN 期間設定が完了する、THEN THE Onboarding_System SHALL Daily_Commit_Timeの設定画面を表示する

2. THE Onboarding_System SHALL Daily_Commit_Timeの選択肢を提供する：「15分」「30分」「1時間」「2時間」「その他（自由記入）」

3. WHEN User がDaily_Commit_Timeを設定する、THE Onboarding_System SHALL User_Profileの質問を開始する

4. THE Onboarding_System SHALL 7つのプロファイリング質問を4択＋自由記入形式で提示する

5. THE Onboarding_System SHALL 質問1「あなたの平日の生活パターンは？」を提示し、選択肢「会社員（9-18時）」「学生」「フリーランス」「その他」を提供する

6. THE Onboarding_System SHALL 質問2「いつが一番集中できますか？」を提示し、選択肢「朝（6-9時）」「昼（12-15時）」「夜（18-21時）」「深夜（21時以降）」を提供する

7. THE Onboarding_System SHALL 質問3「主にどこで作業しますか？」を提示し、選択肢「自宅」「オフィス」「カフェ・外出先」「移動中」を提供する

8. THE Onboarding_System SHALL 質問4「どんなペースが続けやすいですか？」を提示し、選択肢「毎日少しずつ」「週末にまとめて」「気分次第で柔軟に」「その他」を提供する

9. THE Onboarding_System SHALL 質問5「過去に目標が続かなかった理由は？」を提示し、選択肢「時間がなくなった」「モチベーション低下」「難しすぎた」「忘れてしまった」を提供する

10. THE Onboarding_System SHALL 質問6「この目標に関する現在の経験は？」を提示し、選択肢「全くの初心者」「少し経験あり」「ある程度できる」「経験豊富」を提供する

11. THE Onboarding_System SHALL 質問7「どんな難易度のタスクが好きですか？」を提示し、選択肢「確実にできる簡単なこと」「少し頑張れば達成できること」「チャレンジングで成長を感じること」「その他」を提供する

12. THE Onboarding_System SHALL 各質問で「その他」が選択された場合、自由記入フィールドを表示する

13. WHEN User が全てのプロファイリング質問に回答する、THE Onboarding_System SHALL Daily_Commit_TimeとUser_Profileを保存し、マイルストン生成ステップに進む

### 要件4：10合目マイルストンの自動生成

**ユーザーストーリー：** ユーザーとして、長期目標を山登りの10合目として視覚化してほしい。そうすることで、進捗が分かりやすく、達成感を得られる。

#### 受入基準

1. WHEN User_Profile設定が完了する、THEN THE Onboarding_System SHALL Long_Term_Goal、期間、Daily_Commit_Time、User_Profileを考慮して10段階のMilestone（1合目〜10合目）に自動分解する

2. THE Onboarding_System SHALL 各Stationに到達目標、推奨期間、達成条件を含める

3. THE Onboarding_System SHALL 10合目を最終目標（Long_Term_Goalの完全達成）として設定する

4. WHEN Milestoneの自動生成が完了する、THE Onboarding_System SHALL 生成された10合目のMilestoneを山のビジュアルとともにUserに提示する

5. IF User がMilestoneの修正を要求する、THEN THE Onboarding_System SHALL 対話形式で各Stationの内容、期間、達成条件を調整する

6. WHEN User がMilestoneを承認する、THE Onboarding_System SHALL 全てのデータをMCP_Serverに送信し、オンボーディングを完了する

### 要件5：データの永続化

**ユーザーストーリー：** ユーザーとして、設定した目標とマイルストンが保存されることを確認したい。そうすることで、安心してアプリを使い続けられる。

#### 受入基準

1. WHEN Onboarding_System がデータをMCP_Serverに送信する、THE Onboarding_System SHALL OAuth 2.1とPKCEによる認証を使用する

2. THE Onboarding_System SHALL 送信データに User の匿名ID、Long_Term_Goal（SMART要素とWOOP要素を含む）、期間、Daily_Commit_Time、User_Profile、10段階のMilestoneを含める

3. WHEN MCP_Server がデータ保存に成功する、THEN THE Onboarding_System SHALL 成功メッセージとともに次のステップ（日次クエスト生成）への導線を表示する

4. IF MCP_Server がエラーを返す、THEN THE Onboarding_System SHALL エラー内容をUserに分かりやすく説明し、再試行オプションを提供する

5. THE Onboarding_System SHALL 通信エラー時にWidget_Stateに一時的にデータを保存し、接続回復後に自動再送信する

### 要件6：プライバシーと同意

**ユーザーストーリー：** ユーザーとして、自分のデータがどのように使われるかを理解し、同意した上で使いたい。そうすることで、安心してアプリを利用できる。

#### 受入基準

1. WHEN User が初めてOnboarding_Systemを起動する、THE Onboarding_System SHALL データ収集と利用目的を明示した同意画面を表示する

2. THE Onboarding_System SHALL 同意画面に「収集するデータの種類」「利用目的」「保存期間」「削除方法」を含める

3. THE Onboarding_System SHALL User が同意を拒否した場合、オンボーディングを中止し、アプリの利用を制限する

4. WHEN User が同意する、THE Onboarding_System SHALL 同意のタイムスタンプをMCP_Serverに記録する

5. THE Onboarding_System SHALL オンボーディング完了後もプライバシーポリシーへのアクセス手段を提供する

### 要件7：ユーザーエクスペリエンス

**ユーザーストーリー：** ユーザーとして、スムーズで直感的なオンボーディング体験をしたい。そうすることで、アプリの使い方をすぐに理解できる。

#### 受入基準

1. THE Onboarding_System SHALL Apps_SDKのコンポーネントを使用して会話型UIを実装する

2. THE Onboarding_System SHALL 各ステップで進捗状況を表示する

3. THE Onboarding_System SHALL 前のステップに戻る機能を提供する

4. THE Onboarding_System SHALL 入力内容を自動保存し、中断後も再開可能にする

5. WHEN オンボーディングが完了する、THE Onboarding_System SHALL 完了画面に「山登りの準備が整いました」などの達成感を与えるメッセージを表示する
