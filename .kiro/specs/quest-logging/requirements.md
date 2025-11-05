# 要件定義書：クエスト達成ログ機能

## はじめに

本文書は、climb-youアプリケーションのクエスト達成ログ機能に関する要件を定義する。クエスト達成ログ機能は、ユーザーが日次クエストを完了、見送り、または阻害された際に、その結果と証跡を記録し、ストリークの更新、登頂歩数の付与、日次サマリの生成を行う。記録されたログは、次回のクエスト生成や学習機能に活用される。登頂歩数は難易度に応じて変動し、山登りのメタファーでユーザーの進捗を表現する。

## 用語集

- **Quest_Logging_System**：クエストの達成状況を記録するシステムコンポーネント
- **User**：climb-youアプリケーションを使用する個人
- **Quest_Status**：クエストの状態（完了/見送り/阻害/進行中）
- **Completion**：クエストを完了した状態
- **Skip**：ユーザーが意図的にクエストを見送った状態
- **Obstruction**：外的要因によりクエストが阻害された状態
- **Evidence**：クエスト完了の証跡（スクリーンショット、メモ、成果物など）
- **Actual_Time**：クエスト実行に実際にかかった時間
- **Streak**：連続達成日数
- **Climbing_Steps**：登頂歩数（クエスト完了で獲得する歩数）
- **Daily_Summary**：1日のクエスト達成状況のサマリ
- **Completion_Rate**：クエストの完了率
- **Freeze_Day**：休息日（ストリークが途切れない特別な日）
- **MCP_Server**：Model Context Protocolサーバー（バックエンドAPIとの通信を担当）

## 要件

### 要件1：クエスト完了の記録

**ユーザーストーリー：** ユーザーとして、クエストを完了したら、その証跡と所要時間を記録したい。そうすることで、達成感を得られ、進捗が可視化される。

#### 受入基準

1. WHEN User がクエストを完了する、THEN THE Quest_Logging_System SHALL クエスト完了画面を表示する

2. THE Quest_Logging_System SHALL Completion_Criteriaが満たされているかを確認する質問を表示する

3. THE Quest_Logging_System SHALL Actual_Timeの入力を促す

4. THE Quest_Logging_System SHALL Actual_Timeの選択肢を提供する：「推定通り」「推定より短い」「推定より長い」「正確に入力」

5. IF User が「正確に入力」を選択する、THEN THE Quest_Logging_System SHALL 自由記入フィールドを表示する

6. THE Quest_Logging_System SHALL Evidenceのアップロードまたは入力を促す

7. IF クエストのevidence_typeが「screenshot」、THEN THE Quest_Logging_System SHALL 画像アップロード機能を提供する

8. IF クエストのevidence_typeが「note」、THEN THE Quest_Logging_System SHALL テキスト入力フィールドを提供する

9. IF クエストのevidence_typeが「artifact」、THEN THE Quest_Logging_System SHALL ファイルアップロード機能を提供する

10. THE Quest_Logging_System SHALL 任意で一言メモの入力を受け付ける

11. WHEN User が完了情報を送信する、THE Quest_Logging_System SHALL Quest_Statusを「completed」に更新し、MCP_Serverに送信する

12. THE Quest_Logging_System SHALL 完了記録プロセスを60秒以内に完了可能な設計とする

### 要件2：クエスト見送りの記録

**ユーザーストーリー：** ユーザーとして、クエストを見送る場合は、その理由を記録したい。そうすることで、次回のクエスト生成に活かされる。

#### 受入基準

1. WHEN User がクエストを見送る、THEN THE Quest_Logging_System SHALL 見送り理由の選択画面を表示する

2. THE Quest_Logging_System SHALL 見送り理由の選択肢を提供する：「時間がなかった」「難しすぎた」「モチベーションが低い」「体調不良」「その他」

3. IF User が「その他」を選択する、THEN THE Quest_Logging_System SHALL 自由記入フィールドを表示する

4. THE Quest_Logging_System SHALL 任意で詳細メモの入力を受け付ける

5. WHEN User が見送り理由を送信する、THE Quest_Logging_System SHALL Quest_Statusを「skipped」に更新し、MCP_Serverに送信する

6. THE Quest_Logging_System SHALL 見送り記録をクエスト生成の学習データとして保存する

7. THE Quest_Logging_System SHALL 見送り記録プロセスを30秒以内に完了可能な設計とする

### 要件3：クエスト阻害の記録

**ユーザーストーリー：** ユーザーとして、外的要因でクエストができなかった場合は、その阻害要因を記録したい。そうすることで、同じ問題を避けられる。

#### 受入基準

1. WHEN User がクエストの阻害を報告する、THEN THE Quest_Logging_System SHALL 阻害要因の選択画面を表示する

2. THE Quest_Logging_System SHALL 阻害要因の選択肢を提供する：「急な予定変更」「環境の問題」「必要なリソースがない」「技術的な問題」「その他」

3. IF User が「その他」を選択する、THEN THE Quest_Logging_System SHALL 自由記入フィールドを表示する

4. THE Quest_Logging_System SHALL 阻害要因の詳細説明の入力を受け付ける

5. THE Quest_Logging_System SHALL 「次回どう対処するか」の入力を促す

6. WHEN User が阻害情報を送信する、THE Quest_Logging_System SHALL Quest_Statusを「obstructed」に更新し、MCP_Serverに送信する

7. THE Quest_Logging_System SHALL 阻害要因をWOOP手法の障害データとして保存し、将来のクエスト生成に活用する

8. THE Quest_Logging_System SHALL 阻害記録プロセスを60秒以内に完了可能な設計とする

### 要件4：ストリークの更新

**ユーザーストーリー：** ユーザーとして、連続達成日数（ストリーク）を記録してほしい。そうすることで、継続のモチベーションが高まる。

#### 受入基準

1. WHEN User が1日のクエストを全て完了する、THEN THE Quest_Logging_System SHALL Streakを1日増加させる

2. WHEN User が1日のクエストを1つ以上見送りまたは阻害する、THEN THE Quest_Logging_System SHALL Streakをリセットしない（部分達成を許容）

3. WHEN User が1日のクエストを全て見送りまたは阻害する、THEN THE Quest_Logging_System SHALL Streakをリセットする

4. THE Quest_Logging_System SHALL Streakの現在値をデータベースに保存する

5. THE Quest_Logging_System SHALL Streakの最高記録を保存する

6. WHEN Streakが更新される、THE Quest_Logging_System SHALL 更新後のStreakをUserに表示する

7. IF Streakが7日、30日、100日などのマイルストンに達する、THEN THE Quest_Logging_System SHALL 特別な達成メッセージを表示する

### 要件5：休息日（Freeze Day）の管理

**ユーザーストーリー：** ユーザーとして、週に1回は休息日を使いたい。そうすることで、無理なく継続できる。

#### 受入基準

1. THE Quest_Logging_System SHALL Userに週1回の休息日（Freeze_Day）を付与する

2. WHEN User が休息日を使用する、THEN THE Quest_Logging_System SHALL その日のクエストをスキップしてもStreakを維持する

3. THE Quest_Logging_System SHALL 休息日の使用回数を週ごとにリセットする

4. THE Quest_Logging_System SHALL 休息日の残り回数をUserに表示する

5. WHEN User が休息日を使用する、THE Quest_Logging_System SHALL 「休息日を使用しました。ストリークは維持されます」というメッセージを表示する

6. THE Quest_Logging_System SHALL 休息日の使用履歴を記録する

7. IF User が週に1回以上休息日を使用しようとする、THEN THE Quest_Logging_System SHALL 「今週の休息日は使用済みです」というメッセージを表示する

### 要件6：登頂歩数の付与

**ユーザーストーリー：** ユーザーとして、クエストを完了したら山を登った歩数を獲得したい。そうすることで、日々コツコツ進んでいる実感と達成感が得られる。

#### 受入基準

1. WHEN User がクエストを完了する、THE Quest_Logging_System SHALL クエストの難易度に応じてClimbing_Stepsを付与する

2. IF クエストの難易度が「easy」、THEN THE Quest_Logging_System SHALL 50歩を付与する

3. IF クエストの難易度が「medium」、THEN THE Quest_Logging_System SHALL 100歩を付与する

4. IF クエストの難易度が「challenging」、THEN THE Quest_Logging_System SHALL 150歩を付与する

5. IF クエストのタイプが「validation」、THEN THE Quest_Logging_System SHALL 30歩を付与する

6. IF User が1日のクエストを全て完了する、THEN THE Quest_Logging_System SHALL コンプリートボーナス（+50歩）を付与する

7. THE Quest_Logging_System SHALL 累計Climbing_Stepsをデータベースに保存する

8. THE Quest_Logging_System SHALL 付与されたClimbing_Stepsを山登りのメタファーで表示する（「+100歩登りました！」）

9. THE Quest_Logging_System SHALL 各合目までの必要歩数を表示する（例：「3合目まであと250歩」）

10. THE Quest_Logging_System SHALL 累計Climbing_Stepsに上限を設けず、ユーザーの成長を無制限に記録する

### 要件7：日次サマリの生成

**ユーザーストーリー：** ユーザーとして、1日の終わりに達成状況のサマリを見たい。そうすることで、振り返りと達成感が得られる。

#### 受入基準

1. WHEN User が1日の全てのクエストを処理する、THEN THE Quest_Logging_System SHALL Daily_Summaryを生成する

2. THE Quest_Logging_System SHALL Daily_Summaryに以下の情報を含める：完了したクエスト数、見送ったクエスト数、阻害されたクエスト数、獲得Climbing_Steps、現在のStreak、達成率

3. THE Quest_Logging_System SHALL 達成率を計算する（完了数 / 全体数 × 100）

4. THE Quest_Logging_System SHALL Daily_Summaryを視覚的に分かりやすく表示する（グラフやアイコンを使用）

5. IF 達成率が100%、THEN THE Quest_Logging_System SHALL 「完璧な1日でした！」などの特別なメッセージを表示する

6. IF 達成率が0%、THEN THE Quest_Logging_System SHALL 「明日は新しい1日です」などの励ましのメッセージを表示する

7. THE Quest_Logging_System SHALL Daily_Summaryに次の合目までの進捗を表示する

8. THE Quest_Logging_System SHALL Daily_Summaryをデータベースに保存する

9. THE Quest_Logging_System SHALL 過去のDaily_Summaryを閲覧できる機能を提供する

### 要件8：進捗の可視化

**ユーザーストーリー：** ユーザーとして、山登りの進捗を視覚的に確認したい。そうすることで、目標までの距離が分かる。

#### 受入基準

1. WHEN User がクエストを完了する、THE Quest_Logging_System SHALL 現在の合目への貢献度を計算する

2. THE Quest_Logging_System SHALL 合目ごとの進捗率を表示する（例：「3合目 75%」）

3. THE Quest_Logging_System SHALL 山のビジュアルに進捗を反映する

4. WHEN User が合目を達成する、THE Quest_Logging_System SHALL 「3合目に到達しました！」などの達成メッセージを表示する

5. THE Quest_Logging_System SHALL 次の合目までに必要なクエスト数または日数を表示する

6. THE Quest_Logging_System SHALL 全体の進捗（10合目までの進捗率）を表示する

### 要件9：データの永続化

**ユーザーストーリー：** ユーザーとして、記録したログが保存されることを確認したい。そうすることで、後で振り返りや分析ができる。

#### 受入基準

1. WHEN Quest_Logging_System がログデータをMCP_Serverに送信する、THE Quest_Logging_System SHALL OAuth 2.1とPKCEによる認証を使用する

2. THE Quest_Logging_System SHALL 送信データにUser ID、Quest ID、Quest_Status、Actual_Time、Evidence、理由、メモを含める

3. WHEN MCP_Server がデータ保存に成功する、THEN THE Quest_Logging_System SHALL 成功メッセージを表示する

4. IF MCP_Server がエラーを返す、THEN THE Quest_Logging_System SHALL エラー内容をUserに分かりやすく説明し、再試行オプションを提供する

5. THE Quest_Logging_System SHALL 通信エラー時にWidget_Stateに一時的にデータを保存し、接続回復後に自動再送信する

6. THE Quest_Logging_System SHALL ログデータを180日間保持する

7. THE Quest_Logging_System SHALL 180日を超えたログデータを自動的に削除する

### 要件10：履歴の閲覧

**ユーザーストーリー：** ユーザーとして、過去のクエスト履歴を閲覧したい。そうすることで、自分の成長を確認できる。

#### 受入基準

1. THE Quest_Logging_System SHALL 過去のクエストログを日付順に表示する機能を提供する

2. THE Quest_Logging_System SHALL 各ログに日付、クエストタイトル、ステータス、所要時間、証跡を表示する

3. THE Quest_Logging_System SHALL ログをフィルタリングする機能を提供する（完了のみ/見送りのみ/阻害のみ）

4. THE Quest_Logging_System SHALL ログを検索する機能を提供する（キーワード検索）

5. THE Quest_Logging_System SHALL 週次・月次の統計を表示する機能を提供する（達成率、平均所要時間、獲得Climbing_Stepsなど）

6. THE Quest_Logging_System SHALL 証跡（画像、メモ）を閲覧できる機能を提供する

### 要件11：ユーザーエクスペリエンス

**ユーザーストーリー：** ユーザーとして、スムーズで直感的なログ記録体験をしたい。そうすることで、毎日ストレスなく記録できる。

#### 受入基準

1. THE Quest_Logging_System SHALL Apps_SDKのコンポーネントを使用して会話型UIを実装する

2. THE Quest_Logging_System SHALL クエスト完了時に「おめでとうございます！」などのポジティブなメッセージを表示する

3. THE Quest_Logging_System SHALL 見送り時に「明日は頑張りましょう」などの励ましのメッセージを表示する

4. THE Quest_Logging_System SHALL 阻害時に「次回は対策を立てましょう」などのサポートメッセージを表示する

5. THE Quest_Logging_System SHALL ログ記録プロセスを最小限のステップで完了できる設計とする

6. THE Quest_Logging_System SHALL 各ステップで進捗状況を表示する

7. THE Quest_Logging_System SHALL 記録完了時にアニメーションやサウンドで達成感を演出する（オプション）
