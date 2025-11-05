# 通知サービス使用ガイド

climb-youアプリの通知サービスの使用方法を説明します。

## 概要

通知サービスは以下の機能を提供します：

- **プッシュ通知**: Firebase Cloud Messaging（FCM）を使用したリモート通知
- **ローカル通知**: デバイス内で生成される通知
- **Rich Notifications**: 画像付き通知（iOS/Android対応）
- **Actionable Notifications**: 通知からの直接アクション（iOS/Android対応）
- **通知カテゴリ管理**: 通知の分類とアクションの定義
- **通知アクションハンドリング**: アクションボタン押下時の処理

---

## 基本的な使い方

### 1. 初期化

```typescript
import { NotificationService } from '@/services/notification';

// アプリ起動時に初期化
const notificationService = NotificationService.getInstance();
await notificationService.initialize();
```

初期化時に以下が自動的に実行されます：
- 通知設定の読み込み
- プッシュトークンの取得
- Android通知チャンネルの設定
- 通知カテゴリの登録（Actionable Notifications用）
- アクションハンドラーの初期化

---

### 2. 通知許可のリクエスト

```typescript
const status = await notificationService.requestPermissions();

if (status === NotificationPermissionStatus.GRANTED) {
  console.log('通知許可が付与されました');
} else {
  console.log('通知許可が拒否されました');
}
```

---

### 3. 基本的な通知の送信

```typescript
import { NotificationType } from '@/services/notification';

// シンプルな通知
const notificationId = await notificationService.sendLocalNotification({
  type: NotificationType.DAILY_QUEST_GENERATED,
  notificationId: `quest_${Date.now()}`,
  title: '今日のクエストが準備できました',
  body: 'クエストを確認して、目標達成に向けて進みましょう！',
});
```

---

## Rich Notifications（画像付き通知）

### 使い方

```typescript
// Rich Notificationを送信
const notificationId = await notificationService.sendRichNotification({
  type: NotificationType.MILESTONE_ACHIEVED,
  notificationId: `milestone_${Date.now()}`,
  title: '🎉 合目達成おめでとうございます！',
  body: '第5合目に到達しました。素晴らしい進歩です！',
  imageUrl: 'https://example.com/mountain-celebration.jpg', // 画像URL
});
```

### 対応画像形式

- **iOS**: JPEG, PNG, GIF
- **Android**: JPEG, PNG

### 注意点

- 画像URLは公開アクセス可能である必要があります
- 画像サイズは1MB以下を推奨
- ネットワーク接続が必要です

---

## Actionable Notifications（アクション付き通知）

### 使い方

```typescript
import { NotificationCategoryIdentifier } from '@/services/notification';

// Actionable Notificationを送信
const notificationId = await notificationService.sendActionableNotification({
  type: NotificationType.REMINDER,
  notificationId: `reminder_${Date.now()}`,
  title: 'クエストリマインダー',
  body: '今日のクエストを完了しましょう！',
  categoryIdentifier: NotificationCategoryIdentifier.QUEST_REMINDER,
  // ↑ このカテゴリには「完了をマーク」「後で通知」アクションが含まれます
});
```

### 利用可能なカテゴリとアクション

| カテゴリ | アクション |
|---------|----------|
| `QUEST_REMINDER` | 「完了をマーク」「後で通知」 |
| `QUEST_COMPLETE` | 「クエストを表示」 |
| `MILESTONE_ACHIEVED` | 「進捗を表示」 |
| `RANKING_UPDATE` | 「ランキングを表示」 |
| `STAGNATION_ALERT` | 「目標を調整」「閉じる」 |

---

## Rich + Actionable Notifications（画像 + アクション付き）

### 使い方

```typescript
// 画像とアクションの両方を含む通知
const notificationId = await notificationService.sendRichActionableNotification({
  type: NotificationType.MILESTONE_ACHIEVED,
  notificationId: `milestone_${Date.now()}`,
  title: '🎉 合目達成おめでとうございます！',
  body: '第5合目に到達しました。素晴らしい進歩です！',
  imageUrl: 'https://example.com/mountain-celebration.jpg',
  categoryIdentifier: NotificationCategoryIdentifier.MILESTONE_ACHIEVED,
  // ↑ 「進捗を表示」アクションが表示されます
});
```

---

## スケジュール通知

### 使い方

```typescript
// 1時間後に通知
const triggerDate = new Date();
triggerDate.setHours(triggerDate.getHours() + 1);

const notificationId = await notificationService.scheduleNotification({
  type: NotificationType.REMINDER,
  notificationId: `reminder_${Date.now()}`,
  title: 'クエストリマインダー',
  body: 'クエストを完了する時間です！',
  trigger: triggerDate,
});
```

### 繰り返し通知

```typescript
// 毎日20:00に通知
const triggerDate = new Date();
triggerDate.setHours(20, 0, 0, 0);

const notificationId = await notificationService.scheduleNotification({
  type: NotificationType.REMINDER,
  notificationId: `daily_reminder_${Date.now()}`,
  title: 'クエストリマインダー',
  body: '今日のクエストを完了しましょう！',
  trigger: triggerDate,
  repeat: {
    hours: 24, // 24時間ごとに繰り返し
  },
});
```

---

## カスタムアクションハンドラーの登録

### 使い方

```typescript
import { NotificationActionIdentifier } from '@/services/notification';

// アプリ起動時にカスタムハンドラーを登録
notificationService.registerActionHandler(
  NotificationActionIdentifier.MARK_COMPLETE,
  async (actionIdentifier, notification) => {
    console.log('完了をマークアクションが押されました');

    // クエストIDを取得
    const questId = notification.request.content.data.questId;

    // クエスト完了処理を実行
    await questService.completeQuest(questId);

    // 画面遷移（React Navigationを使用）
    navigation.navigate('QuestDetail', { questId });
  }
);
```

### デフォルトハンドラー（通知タップ時）

```typescript
// 通知をタップした時のハンドラー
notificationService.registerActionHandler(
  'default',
  async (actionIdentifier, notification) => {
    console.log('通知がタップされました');

    // 通知タイプに応じて画面遷移
    const notificationType = notification.request.content.data.type;

    switch (notificationType) {
      case NotificationType.DAILY_QUEST_GENERATED:
        navigation.navigate('Home');
        break;
      case NotificationType.MILESTONE_ACHIEVED:
        navigation.navigate('Progress');
        break;
      // ...
    }
  }
);
```

---

## ローカル通知マネージャー（リマインダー）

### 使い方

```typescript
import { LocalNotificationManager } from '@/services/notification';
import { notificationHistoryRepository } from '@/core/infrastructure/repositories';

const localNotificationManager = LocalNotificationManager.getInstance(
  notificationService,
  notificationHistoryRepository
);

// 初期化
await localNotificationManager.initialize(userId);

// クエストリマインダーをスケジュール（デフォルト20:00）
await localNotificationManager.scheduleQuestReminder(userId);

// ストリーク継続リマインダーをスケジュール（23:00）
await localNotificationManager.scheduleStreakReminder(userId);

// 休息日使用可能通知をスケジュール（水曜日 09:00）
await localNotificationManager.scheduleFreezeDayReminder(userId);
```

---

## 通知設定の管理

### 設定の取得

```typescript
const settings = await notificationService.getSettings();
console.log(settings);
// {
//   enabled: true,
//   dailyQuestEnabled: true,
//   dailyQuestTime: '0400',
//   milestoneEnabled: true,
//   rankingEnabled: true,
//   stagnationEnabled: true,
//   reminderEnabled: true,
//   soundEnabled: true,
//   vibrationEnabled: true,
// }
```

### 設定の更新

```typescript
await notificationService.updateSettings({
  reminderEnabled: false, // リマインダーを無効化
  dailyQuestTime: '2100', // クエスト通知時刻を21:00に変更
});
```

---

## 通知のキャンセル

### 特定の通知をキャンセル

```typescript
await notificationService.cancelNotification(notificationId);
```

### 全ての通知をキャンセル

```typescript
await notificationService.cancelAllNotifications();
```

---

## バッジ管理

### バッジ数の設定

```typescript
// バッジ数を3に設定
await notificationService.setBadgeCount(3);
```

### バッジ数の取得

```typescript
const count = await notificationService.getBadgeCount();
console.log(`現在のバッジ数: ${count}`);
```

---

## 実用例

### 例1: クエスト生成完了通知（Rich + Actionable）

```typescript
// バックエンドから新しいクエストが生成された時
const questBundle = await questService.generateDailyQuests(userId);

// Rich + Actionable Notificationを送信
await notificationService.sendRichActionableNotification({
  type: NotificationType.DAILY_QUEST_GENERATED,
  notificationId: `quest_${questBundle.id}`,
  title: '🌄 今日のクエストが準備できました',
  body: '3つのクエストがあなたを待っています。さあ、登山を続けましょう！',
  imageUrl: 'https://example.com/daily-quest-image.jpg',
  categoryIdentifier: NotificationCategoryIdentifier.QUEST_COMPLETE,
  data: {
    questBundleId: questBundle.id,
  },
});
```

### 例2: マイルストーン達成祝福通知

```typescript
// ユーザーが合目を達成した時
const milestone = await milestoneService.achieveMilestone(userId, milestoneId);

// Rich Notificationを送信
await notificationService.sendRichNotification({
  type: NotificationType.MILESTONE_ACHIEVED,
  notificationId: `milestone_${milestone.id}`,
  title: `🎉 第${milestone.station}合目達成おめでとうございます！`,
  body: `素晴らしい進歩です！${milestone.description}`,
  imageUrl: `https://example.com/milestone-${milestone.station}.jpg`,
  categoryIdentifier: NotificationCategoryIdentifier.MILESTONE_ACHIEVED,
  data: {
    milestoneId: milestone.id,
    station: milestone.station,
  },
});
```

### 例3: 停滞アラート通知

```typescript
// 30日間同じ合目にいるユーザーに通知
await notificationService.sendActionableNotification({
  type: NotificationType.STAGNATION_ALERT,
  notificationId: `stagnation_${userId}_${Date.now()}`,
  title: '⚠️ 停滞が検出されました',
  body: '30日間同じ合目にいます。目標を調整してみませんか？',
  categoryIdentifier: NotificationCategoryIdentifier.STAGNATION_ALERT,
  data: {
    userId,
    currentStation: user.currentStation,
    daysSinceLastProgress: 30,
  },
});
```

---

## トラブルシューティング

### 通知が表示されない

1. **通知許可を確認**
   ```typescript
   const status = await notificationService.getPermissionStatus();
   if (status !== NotificationPermissionStatus.GRANTED) {
     await notificationService.requestPermissions();
   }
   ```

2. **通知設定を確認**
   ```typescript
   const settings = await notificationService.getSettings();
   if (!settings.enabled) {
     await notificationService.updateSettings({ enabled: true });
   }
   ```

3. **デバイス設定を確認**
   - iOS: 設定 > climb-you > 通知
   - Android: 設定 > アプリ > climb-you > 通知

### アクションが動作しない

1. **カテゴリが登録されているか確認**
   ```typescript
   const categories = await notificationService.getCategoryManager().getAllCategories();
   console.log('登録済みカテゴリ:', categories);
   ```

2. **アクションハンドラーが登録されているか確認**
   - アプリ起動時に`initialize()`が呼ばれているか確認
   - カスタムハンドラーを登録している場合は、登録が正常に完了しているか確認

---

## API リファレンス

詳細なAPIドキュメントは各ファイルのコメントを参照してください：

- `NotificationService.ts` - メインの通知サービス
- `NotificationCategoryManager.ts` - カテゴリ管理
- `NotificationActionHandler.ts` - アクションハンドリング
- `LocalNotificationManager.ts` - ローカル通知管理
- `types.ts` - 型定義

---

## 参考リンク

- [Expo Notifications ドキュメント](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [iOS通知のベストプラクティス](https://developer.apple.com/design/human-interface-guidelines/notifications)
- [Android通知のベストプラクティス](https://developer.android.com/design/patterns/notifications)
