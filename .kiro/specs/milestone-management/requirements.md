# 要件定義書：マイルストーン達成管理機能

## はじめに

本文書は、climb-youアプリケーションのマイルストーン達成管理機能に関する要件を定義する。マイルストーン達成管理機能は、ユーザーが各合目（1〜10合目）に到達した際に、実質的な目標達成を確認し、未達成の場合は適切なサポートとワークフローを提供する。歩数による進捗とマイルストーンの実質的な達成の両方を管理することで、ユーザーの確実な成長を支援する。

## 用語集

- **Milestone_Management_System**：マイルストーンの達成状況を管理するシステムコンポーネント
- **User**：climb-youアプリケーションを使用する個人
- **Station**：マイルストンの各段階（1合目〜10合目）
- **Climbing_Steps**：登頂歩数（クエスト完了で獲得）
- **Required_Steps**：各合目到達に必要な累計歩数
- **Milestone_Criteria**：各合目の達成条件（具体的な目標）
- **Achievement_Status**：マイルストーンの達成状態（未到達/到達済み/達成済み）
- **Progress_Rate**：マイルストーン内の進捗率（0〜100%）
- **Evidence**：マイルストーン達成の証跡
- **Adjustment**：目標の調整（達成条件の緩和または変更）
- **Redesign**：マイルストーンの再設計
- **Stagnation**：同じ合目に長期間滞在している状態
- **MCP_Server**：Model Context Protocolサーバー（バックエンドAPIとの通信を担当）

## 要件

### 要件1：合目到達の検知

**ユーザーストーリー：** ユーザーとして、必要な歩数に到達したら、合目達成の確認をしてほしい。そうすることで、実質的な進捗を確認できる。

#### 受入基準

1. WHEN User の累計Climbing_StepsがStationのRequired_Stepsに到達する、THEN THE Milestone_Management_System SHALL 合目到達通知を表示する

2. THE Milestone_Management_System SHALL 到達した合目の番号とタイトルを表示する（例：「3合目『リスニング基礎』に到達しました！」）

3. THE Milestone_Management_System SHALL 合目のMilestone_Criteriaを表示する

4. THE Milestone_Management_System SHALL 「この目標を達成しましたか？」という確認質問を表示する

5. THE Milestone_Management_System SHALL 「はい」「いいえ」の選択肢を提供する

6. THE Milestone_Management_System SHALL 合目到達の検知を即座に行う（クエスト完了時）

### 要件2：達成確認（はいの場合）

**ユーザーストーリー：** ユーザーとして、目標を達成した場合は、それを記録して次の合目に進みたい。そうすることで、達成感と次のステップが明確になる。

#### 受入基準

1. WHEN User が「はい」を選択する、THEN THE Milestone_Management_System SHALL 証跡の提出を促す（オプション）

2. THE Milestone_Management_System SHALL 証跡タイプに応じた入力方法を提供する（画像/メモ/ファイル）

3. WHEN User が証跡を提出する、THE Milestone_Management_System SHALL Achievement_Statusを「達成済み」に更新する

4. THE Milestone_Management_System SHALL 合目達成のお祝いメッセージを表示する（「おめでとうございます！3合目を達成しました！」）

5. THE Milestone_Management_System SHALL 達成した合目に特別なバッジまたはマークを付与する

6. THE Milestone_Management_System SHALL 次の合目の情報を表示する（タイトル、達成条件、必要歩数）

7. THE Milestone_Management_System SHALL 達成データをMCP_Serverに送信し、データベースに保存する

8. THE Milestone_Management_System SHALL 全体の進捗率を更新する（例：「30%完了」）

### 要件3：未達成確認（いいえの場合）

**ユーザーストーリー：** ユーザーとして、目標を達成していない場合は、理由を記録してサポートを受けたい。そうすることで、適切な対応ができる。

#### 受入基準

1. WHEN User が「いいえ」を選択する、THEN THE Milestone_Management_System SHALL 未達成理由の選択画面を表示する

2. THE Milestone_Management_System SHALL 未達成理由の選択肢を提供する：「時間が足りなかった」「難しすぎた」「モチベーション低下」「その他（自由記入）」

3. WHEN User が理由を選択する、THE Milestone_Management_System SHALL 現在の進捗率の入力を促す

4. THE Milestone_Management_System SHALL 進捗率の入力方法を提供する（スライダーまたは数値入力：0〜100%）

5. WHEN User が進捗率を入力する、THE Milestone_Management_System SHALL 3つの選択肢を提示する

6. THE Milestone_Management_System SHALL 選択肢A「このまま続ける（推奨）」を表示する

7. THE Milestone_Management_System SHALL 選択肢B「目標を調整する」を表示する

8. THE Milestone_Management_System SHALL 選択肢C「マイルストーンを再設計する」を表示する

9. THE Milestone_Management_System SHALL 各選択肢の説明と推奨度を表示する

10. THE Milestone_Management_System SHALL 未達成データを学習データとして保存する

### 要件4：選択肢A - このまま続ける

**ユーザーストーリー：** ユーザーとして、目標を変えずに続けたい。そうすることで、焦らず自分のペースで進められる。

#### 受入基準

1. WHEN User が「このまま続ける」を選択する、THEN THE Milestone_Management_System SHALL 現在の合目を維持する

2. THE Milestone_Management_System SHALL 励ましのメッセージを表示する（「焦らず、このペースで進めましょう」）

3. THE Milestone_Management_System SHALL 残りのタスクを明示する（例：「あと20問で達成です」）

4. THE Milestone_Management_System SHALL 次回のクエスト生成時に、残りタスクを優先的に生成するようフラグを設定する

5. THE Milestone_Management_System SHALL 累計歩数をそのまま保持する

6. THE Milestone_Management_System SHALL 進捗率をデータベースに保存する

7. THE Milestone_Management_System SHALL 選択内容をMCP_Serverに送信する

### 要件5：選択肢B - 目標を調整する

**ユーザーストーリー：** ユーザーとして、目標が高すぎる場合は、現実的に調整したい。そうすることで、達成可能な目標に修正できる。

#### 受入基準

1. WHEN User が「目標を調整する」を選択する、THEN THE Milestone_Management_System SHALL 現在の進捗率に基づいて調整案を生成する

2. THE Milestone_Management_System SHALL 調整案を表示する（例：「50問 → 30問に変更」）

3. THE Milestone_Management_System SHALL 調整の理由を説明する（「現在の進捗率60%を考慮しました」）

4. THE Milestone_Management_System SHALL 調整案の承認を求める

5. WHEN User が調整案を承認する、THE Milestone_Management_System SHALL Milestone_Criteriaを更新する

6. THE Milestone_Management_System SHALL その場で合目を達成済みにする

7. THE Milestone_Management_System SHALL 達成メッセージを表示する（「目標を調整しました。3合目達成です！」）

8. THE Milestone_Management_System SHALL 次の合目に進む

9. THE Milestone_Management_System SHALL 調整内容をデータベースに保存する

10. IF User が調整案を拒否する、THEN THE Milestone_Management_System SHALL カスタム調整の入力を受け付ける

### 要件6：選択肢C - マイルストーンを再設計する

**ユーザーストーリー：** ユーザーとして、マイルストーン全体を見直したい。そうすることで、より達成しやすいステップに分解できる。

#### 受入基準

1. WHEN User が「マイルストーンを再設計する」を選択する、THEN THE Milestone_Management_System SHALL 再設計の理由を確認する

2. THE Milestone_Management_System SHALL 現在の合目以降のマイルストーンを再生成する提案を表示する

3. THE Milestone_Management_System SHALL 再設計オプションを提示する：「より細かいステップに分解」「難易度を下げる」「期間を延長する」

4. WHEN User が再設計オプションを選択する、THE Milestone_Management_System SHALL LLMを使用して新しいマイルストーンを生成する

5. THE Milestone_Management_System SHALL 生成されたマイルストーンをUserに提示する

6. THE Milestone_Management_System SHALL 変更前と変更後の比較を表示する

7. WHEN User が新しいマイルストーンを承認する、THE Milestone_Management_System SHALL データベースを更新する

8. THE Milestone_Management_System SHALL 現在の歩数と進捗を新しいマイルストーンに引き継ぐ

9. THE Milestone_Management_System SHALL 再設計完了メッセージを表示する

10. THE Milestone_Management_System SHALL 再設計の履歴を記録する

### 要件7：停滞の検知とサポート

**ユーザーストーリー：** ユーザーとして、同じ合目に長期間いる場合は、サポートを受けたい。そうすることで、行き詰まりを解消できる。

#### 受入基準

1. THE Milestone_Management_System SHALL 各合目の滞在日数を記録する

2. WHEN User が同じ合目に30日以上滞在する、THEN THE Milestone_Management_System SHALL 停滞アラートを表示する

3. THE Milestone_Management_System SHALL 停滞の原因を探る質問を表示する（「何が一番の障害ですか？」）

4. THE Milestone_Management_System SHALL 原因の選択肢を提供する：「時間不足」「難易度が高い」「モチベーション低下」「方法が分からない」「その他」

5. WHEN User が原因を選択する、THE Milestone_Management_System SHALL 3つの提案を表示する

6. THE Milestone_Management_System SHALL 提案1「目標の再設定」を表示する（より現実的な目標に変更）

7. THE Milestone_Management_System SHALL 提案2「マイルストーンの細分化」を表示する（小さなステップに分解）

8. THE Milestone_Management_System SHALL 提案3「休息期間」を表示する（一時的に目標を保留）

9. WHEN User が提案を選択する、THE Milestone_Management_System SHALL 選択に応じた処理を実行する

10. THE Milestone_Management_System SHALL 停滞データを分析し、将来のマイルストーン生成に活用する

### 要件8：複数回の未達成への対応

**ユーザーストーリー：** ユーザーとして、何度も未達成が続く場合は、根本的な見直しをしたい。そうすることで、適切な目標設定ができる。

#### 受入基準

1. THE Milestone_Management_System SHALL 同じ合目での未達成回数を記録する

2. WHEN User が同じ合目で3回連続「いいえ」と回答する、THEN THE Milestone_Management_System SHALL 特別なサポート画面を表示する

3. THE Milestone_Management_System SHALL 「この合目で苦戦しているようです。一緒に原因を探りましょう」というメッセージを表示する

4. THE Milestone_Management_System SHALL 振り返りセッションを開始する

5. THE Milestone_Management_System SHALL 以下の質問を順番に表示する：「何が一番の障害ですか？」「目標は現実的ですか？」「サポートが必要なことはありますか？」

6. WHEN User が質問に回答する、THE Milestone_Management_System SHALL 回答を分析する

7. THE Milestone_Management_System SHALL 分析結果に基づいて最適な対応を提案する

8. THE Milestone_Management_System SHALL 提案の実行をサポートする（目標再設定、マイルストーン細分化、休息期間など）

9. THE Milestone_Management_System SHALL 振り返りセッションの内容を記録する

10. THE Milestone_Management_System SHALL 次回のクエスト生成時に振り返り内容を反映する

### 要件9：進捗の可視化

**ユーザーストーリー：** ユーザーとして、各合目の進捗を視覚的に確認したい。そうすることで、現在地と次のステップが明確になる。

#### 受入基準

1. THE Milestone_Management_System SHALL 10合目全体の進捗を山のビジュアルで表示する

2. THE Milestone_Management_System SHALL 達成済みの合目を特別な色またはマークで表示する

3. THE Milestone_Management_System SHALL 現在取り組んでいる合目を強調表示する

4. THE Milestone_Management_System SHALL 各合目の進捗率を表示する（例：「3合目 60%」）

5. THE Milestone_Management_System SHALL 累計歩数と次の合目までの必要歩数を表示する

6. THE Milestone_Management_System SHALL 推定到達日を表示する（現在のペースで計算）

7. THE Milestone_Management_System SHALL 各合目をタップすると詳細情報を表示する

8. THE Milestone_Management_System SHALL 詳細情報に達成条件、進捗率、証跡、達成日を含める

### 要件10：データの永続化

**ユーザーストーリー：** ユーザーとして、マイルストーンの達成状況が保存されることを確認したい。そうすることで、長期的な進捗を追跡できる。

#### 受入基準

1. WHEN Milestone_Management_System がデータをMCP_Serverに送信する、THE Milestone_Management_System SHALL OAuth 2.1とPKCEによる認証を使用する

2. THE Milestone_Management_System SHALL 送信データにUser ID、Station番号、Achievement_Status、Progress_Rate、Evidence、達成日時を含める

3. WHEN MCP_Server がデータ保存に成功する、THEN THE Milestone_Management_System SHALL 成功メッセージを表示する

4. IF MCP_Server がエラーを返す、THEN THE Milestone_Management_System SHALL エラー内容をUserに分かりやすく説明し、再試行オプションを提供する

5. THE Milestone_Management_System SHALL 通信エラー時にWidget_Stateに一時的にデータを保存し、接続回復後に自動再送信する

6. THE Milestone_Management_System SHALL マイルストーンデータを無期限に保持する（目標達成まで）

7. THE Milestone_Management_System SHALL 調整履歴と再設計履歴を記録する

### 要件11：ユーザーエクスペリエンス

**ユーザーストーリー：** ユーザーとして、スムーズで励ましのあるマイルストーン管理体験をしたい。そうすることで、モチベーションを維持できる。

#### 受入基準

1. THE Milestone_Management_System SHALL Apps_SDKのコンポーネントを使用して会話型UIを実装する

2. THE Milestone_Management_System SHALL 合目到達時に祝福のアニメーションを表示する

3. THE Milestone_Management_System SHALL 未達成時も前向きで励ましのメッセージを表示する

4. THE Milestone_Management_System SHALL 停滞時もサポート的で非難しないトーンを使用する

5. THE Milestone_Management_System SHALL 各ステップで進捗状況を表示する

6. THE Milestone_Management_System SHALL 確認プロセスを90秒以内に完了可能な設計とする

7. THE Milestone_Management_System SHALL ユーザーの選択を尊重し、強制しない設計とする
