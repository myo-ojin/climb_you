# 要件定義書：日次クエスト生成機能

## はじめに

本文書は、climb-youアプリケーションの日次クエスト生成機能に関する要件を定義する。日次クエスト生成機能は、ユーザーの長期目標、現在のマイルストン、ユーザープロファイル、過去のクエスト履歴、および学習した成功パターンに基づいて、毎日午前4時に自動的に実行可能な3つのクエスト（小・中・検証）を生成する。ユーザーは必要に応じて「いつもと違う日」機能で調整できる。

## 用語集

- **Quest_Generation_System**：日次クエストを生成するシステムコンポーネント
- **User**：climb-youアプリケーションを使用する個人
- **Daily_Quest**：ユーザーが1日に実行する具体的なタスク
- **Quest_Bundle**：1日分の3つのクエスト（小・中・検証）のセット
- **Small_Quest**：短時間（15〜30分）で完了できる小さなタスク
- **Medium_Quest**：中程度の時間（30〜60分）を要するタスク
- **Validation_Quest**：学習や進捗を確認するための検証タスク
- **Available_Time**：ユーザーが当日クエストに使える可処分時間（通常はUser_ProfileのDaily_Commit_Timeを使用）
- **Energy_Level**：ユーザーの当日のエネルギーレベル（元気/普通/疲れている）
- **Environment**：ユーザーが作業する環境（自宅/オフィス/移動中など）
- **Previous_Log**：前日のクエスト達成ログ
- **Quest_History**：過去のクエスト履歴と達成データ
- **Success_Pattern**：ユーザーの成功しやすいクエストのパターン
- **Failure_Pattern**：ユーザーが失敗しやすいクエストのパターン
- **User_Timezone**：ユーザーのタイムゾーン
- **Completion_Criteria**：クエストの完了条件
- **Evidence**：クエスト完了の証跡（スクリーンショット、メモなど）
- **Current_Station**：ユーザーが現在取り組んでいるマイルストンの合目
- **MCP_Server**：Model Context Protocolサーバー（バックエンドAPIとの通信を担当）

## 要件

### 要件1：自動クエスト生成とスケジューリング

**ユーザーストーリー：** ユーザーとして、毎日自動的にクエストが生成されてほしい。そうすることで、毎朝何をすべきか考える負担がなくなる。

#### 受入基準

1. THE Quest_Generation_System SHALL Userのタイムゾーンで毎日午前4時にQuest_Bundleを自動生成する

2. WHEN 自動生成時刻になる、THE Quest_Generation_System SHALL User_Profile、Daily_Commit_Time、Current_Station、Previous_Log、過去のクエスト成功パターンを考慮してQuest_Bundleを生成する

3. THE Quest_Generation_System SHALL 生成されたQuest_BundleをMCP_Serverに保存する

4. WHEN User がアプリを開く、THE Quest_Generation_System SHALL その日に生成されたQuest_Bundleを表示する

5. THE Quest_Generation_System SHALL Quest_Bundle表示画面に「いつもと違う日」ボタンを提供する

6. WHEN User が「いつもと違う日」ボタンを押す、THEN THE Quest_Generation_System SHALL 当日の状況調整画面を表示する

7. THE Quest_Generation_System SHALL 調整画面でAvailable_Time、Energy_Level、Environmentの変更を受け付ける

8. WHEN User が調整内容を送信する、THE Quest_Generation_System SHALL 調整内容を考慮してQuest_Bundleを再生成する

9. THE Quest_Generation_System SHALL 調整内容を学習データとして保存し、将来のクエスト生成に活用する

### 要件2：3本束クエストの自動生成

**ユーザーストーリー：** ユーザーとして、今日の状況に合った3つのクエスト（小・中・検証）を自動生成してほしい。そうすることで、何をすべきか迷わず行動できる。

#### 受入基準

1. WHEN User が当日の状況入力を完了する、THEN THE Quest_Generation_System SHALL Long_Term_Goal、Current_Station、User_Profile、Available_Time、Energy_Level、Environment、Previous_Logを考慮してQuest_Bundleを生成する

2. THE Quest_Generation_System SHALL Quest_Bundleに1つのSmall_Quest、1つのMedium_Quest、1つのValidation_Questを含める

3. THE Quest_Generation_System SHALL Small_Questの推定所要時間を15分から30分の範囲で設定する

4. THE Quest_Generation_System SHALL Medium_Questの推定所要時間を30分から60分の範囲で設定する

5. THE Quest_Generation_System SHALL Validation_Questの推定所要時間を10分から20分の範囲で設定する

6. THE Quest_Generation_System SHALL 3つのクエストの合計所要時間がAvailable_Time以内に収まるように調整する

7. IF Energy_Levelが「疲れている」、THEN THE Quest_Generation_System SHALL より簡単で負担の少ないクエストを生成する

8. THE Quest_Generation_System SHALL 各クエストに明確なCompletion_Criteriaを含める

9. THE Quest_Generation_System SHALL 各クエストに必要なEvidenceの種類を指定する（スクリーンショット/メモ/成果物など）

10. WHEN Quest_Bundle生成が完了する、THE Quest_Generation_System SHALL 生成されたクエストをUserに提示する

### 要件3：クエストの詳細表示

**ユーザーストーリー：** ユーザーとして、生成されたクエストの詳細を確認したい。そうすることで、何をどのように実行すればよいか理解できる。

#### 受入基準

1. WHEN Quest_BundleがUserに提示される、THE Quest_Generation_System SHALL 各クエストのタイトル、説明、推定所要時間、Completion_Criteria、必要なEvidenceを表示する

2. THE Quest_Generation_System SHALL 各クエストの難易度レベルを表示する（簡単/普通/チャレンジング）

3. THE Quest_Generation_System SHALL 各クエストがどのMilestoneに貢献するかを表示する（例：「3合目への進捗」）

4. THE Quest_Generation_System SHALL クエストの実行順序の推奨を表示する

5. THE Quest_Generation_System SHALL 各クエストに対して「詳細を見る」機能を提供する

### 要件4：クエストの再生成

**ユーザーストーリー：** ユーザーとして、生成されたクエストが合わない場合は再生成してほしい。そうすることで、自分に合ったクエストを見つけられる。

#### 受入基準

1. WHEN Quest_BundleがUserに提示される、THE Quest_Generation_System SHALL 「再生成」オプションを提供する

2. WHEN User が「再生成」を選択する、THE Quest_Generation_System SHALL 再生成の理由を質問する

3. THE Quest_Generation_System SHALL 再生成理由の選択肢を提供する：「難しすぎる」「簡単すぎる」「時間が合わない」「内容が合わない」「その他」

4. WHEN User が理由を選択する、THE Quest_Generation_System SHALL その理由を考慮して新しいQuest_Bundleを生成する

5. THE Quest_Generation_System SHALL 再生成を1日に最大3回まで許可する

6. IF User が3回再生成した、THEN THE Quest_Generation_System SHALL 「カスタマイズ」オプションを提案する

### 要件5：個別クエストの調整

**ユーザーストーリー：** ユーザーとして、特定のクエストだけを変更したい。そうすることで、全体を再生成せずに微調整できる。

#### 受入基準

1. WHEN Quest_BundleがUserに提示される、THE Quest_Generation_System SHALL 各クエストに「変更」オプションを提供する

2. WHEN User が特定のクエストの「変更」を選択する、THE Quest_Generation_System SHALL そのクエストのみを再生成する

3. THE Quest_Generation_System SHALL 他の2つのクエストはそのまま保持する

4. THE Quest_Generation_System SHALL 変更後も3つのクエストの合計所要時間がAvailable_Time以内に収まるように調整する

5. THE Quest_Generation_System SHALL 個別クエストの変更を各クエストにつき2回まで許可する

### 要件6：クエストの保留と繰越

**ユーザーストーリー：** ユーザーとして、今日できないクエストを保留して次回に繰り越したい。そうすることで、無理なく続けられる。

#### 受入基準

1. WHEN Quest_BundleがUserに提示される、THE Quest_Generation_System SHALL 各クエストに「保留」オプションを提供する

2. WHEN User がクエストを「保留」する、THE Quest_Generation_System SHALL 保留理由を質問する

3. THE Quest_Generation_System SHALL 保留理由の選択肢を提供する：「時間がない」「体調不良」「予定変更」「その他」

4. WHEN User が保留理由を選択する、THE Quest_Generation_System SHALL そのクエストを保留リストに追加する

5. THE Quest_Generation_System SHALL 保留されたクエストを次回のクエスト生成時に優先的に提案する

6. THE Quest_Generation_System SHALL 保留クエストの有効期限を7日間とする

7. IF 保留クエストが7日間実行されない、THEN THE Quest_Generation_System SHALL そのクエストを自動的に削除し、Userに通知する

### 要件7：クエストログの学習と活用

**ユーザーストーリー：** ユーザーとして、過去の達成状況から学習して、成功しやすいクエストを生成してほしい。そうすることで、継続的に成長できる。

#### 受入基準

1. WHEN Quest_Generation_System がQuest_Bundleを生成する、THE Quest_Generation_System SHALL Previous_Logと過去のクエスト履歴を取得する

2. THE Quest_Generation_System SHALL 過去30日間のクエスト達成データを分析する

3. THE Quest_Generation_System SHALL 以下の成功パターンを特定する：成功率の高いクエストタイプ、成功率の高い時間帯、成功率の高い難易度レベル、成功率の高いクエストの長さ

4. THE Quest_Generation_System SHALL 以下の失敗パターンを特定する：見送りが多いクエストタイプ、阻害要因の傾向、失敗しやすい曜日や時間帯

5. IF Previous_Logに未完了のクエストがある、THEN THE Quest_Generation_System SHALL その理由（見送り/阻害）を分析する

6. IF 前日のクエストが「難しすぎた」理由で見送られた、THEN THE Quest_Generation_System SHALL 当日のクエストの難易度を下げる

7. IF 前日のクエストが「時間不足」で見送られた、THEN THE Quest_Generation_System SHALL 当日のクエストの所要時間を短縮する

8. IF 前日のクエストが全て完了した、THEN THE Quest_Generation_System SHALL 当日のクエストの難易度を少し上げる

9. THE Quest_Generation_System SHALL 過去7日間の達成率を考慮してクエストの難易度を調整する

10. THE Quest_Generation_System SHALL Userの好みの傾向（例：実践型vs理論型、短時間集中vs長時間作業）を学習し、クエスト生成に反映する

11. THE Quest_Generation_System SHALL 学習データを定期的に更新し、Userの成長や変化に適応する

### 要件8：クエストの承認と開始

**ユーザーストーリー：** ユーザーとして、生成されたクエストを承認して開始したい。そうすることで、今日のタスクが確定する。

#### 受入基準

1. WHEN User がQuest_Bundleに満足する、THE Quest_Generation_System SHALL 「今日のクエストを開始」ボタンを表示する

2. WHEN User が「今日のクエストを開始」を選択する、THE Quest_Generation_System SHALL Quest_BundleをMCP_Serverに送信し、データベースに保存する

3. THE Quest_Generation_System SHALL 保存されたQuest_Bundleに一意のIDとタイムスタンプを付与する

4. WHEN Quest_Bundle保存が成功する、THE Quest_Generation_System SHALL クエスト実行画面に遷移する

5. THE Quest_Generation_System SHALL クエスト実行画面に3つのクエストをチェックリスト形式で表示する

### 要件9：データの永続化

**ユーザーストーリー：** ユーザーとして、生成されたクエストが保存されることを確認したい。そうすることで、後で確認や記録ができる。

#### 受入基準

1. WHEN Quest_Generation_System がデータをMCP_Serverに送信する、THE Quest_Generation_System SHALL OAuth 2.1とPKCEによる認証を使用する

2. THE Quest_Generation_System SHALL 送信データにUser ID、Quest_Bundle、生成日時、Available_Time、Energy_Level、Environmentを含める

3. WHEN MCP_Server がデータ保存に成功する、THEN THE Quest_Generation_System SHALL 成功メッセージを表示する

4. IF MCP_Server がエラーを返す、THEN THE Quest_Generation_System SHALL エラー内容をUserに分かりやすく説明し、再試行オプションを提供する

5. THE Quest_Generation_System SHALL 通信エラー時にWidget_Stateに一時的にデータを保存し、接続回復後に自動再送信する

### 要件10：ユーザーエクスペリエンス

**ユーザーストーリー：** ユーザーとして、スムーズで直感的なクエスト生成体験をしたい。そうすることで、毎日ストレスなく使える。

#### 受入基準

1. THE Quest_Generation_System SHALL Apps_SDKのコンポーネントを使用して会話型UIを実装する

2. THE Quest_Generation_System SHALL 自動生成プロセスを60秒以内に完了する

3. THE Quest_Generation_System SHALL 「いつもと違う日」による調整プロセスを90秒以内に完了可能な設計とする

3. THE Quest_Generation_System SHALL 生成中のローディング状態を表示する（「あなたに合ったクエストを生成中...」）

4. THE Quest_Generation_System SHALL 各クエストをカード形式で視覚的に分かりやすく表示する

5. THE Quest_Generation_System SHALL クエストの種類（小・中・検証）を色やアイコンで区別する

6. WHEN クエスト生成が完了する、THE Quest_Generation_System SHALL 「今日の山登りを始めましょう！」などのモチベーションを高めるメッセージを表示する
