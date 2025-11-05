/**
 * NotificationActionHandler
 * 通知アクションのハンドリング
 *
 * Actionable Notificationsのアクションボタンが押されたときの処理を管理します。
 */

import * as Notifications from 'expo-notifications';
import { NotificationActionIdentifier } from './types';
import { LocalNotificationManager } from './LocalNotificationManager';

/**
 * アクションハンドラーコールバック
 */
export type ActionHandlerCallback = (
  actionIdentifier: string,
  notification: Notifications.Notification
) => void | Promise<void>;

/**
 * NotificationActionHandler
 */
export class NotificationActionHandler {
  private static instance: NotificationActionHandler | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private actionHandlers: Map<string, ActionHandlerCallback> = new Map();

  private constructor() {}

  /**
   * インスタンス取得（シングルトン）
   */
  public static getInstance(): NotificationActionHandler {
    if (!NotificationActionHandler.instance) {
      NotificationActionHandler.instance = new NotificationActionHandler();
    }
    return NotificationActionHandler.instance;
  }

  /**
   * 初期化
   */
  public async initialize(): Promise<void> {
    // デフォルトのアクションハンドラーを登録
    this.registerDefaultHandlers();

    // 通知応答リスナーを設定
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse.bind(this)
    );

    console.log('NotificationActionHandler initialized');
  }

  /**
   * アクションハンドラーを登録
   */
  public registerActionHandler(
    actionIdentifier: string,
    handler: ActionHandlerCallback
  ): void {
    this.actionHandlers.set(actionIdentifier, handler);
    console.log(`Action handler registered: ${actionIdentifier}`);
  }

  /**
   * アクションハンドラーを削除
   */
  public unregisterActionHandler(actionIdentifier: string): void {
    this.actionHandlers.delete(actionIdentifier);
    console.log(`Action handler unregistered: ${actionIdentifier}`);
  }

  /**
   * 通知応答を処理
   */
  private async handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): Promise<void> {
    try {
      const actionIdentifier = response.actionIdentifier;
      const notification = response.notification;

      console.log('Notification response received:', {
        actionIdentifier,
        notificationId: notification.request.identifier,
      });

      // アクションがある場合、対応するハンドラーを実行
      if (actionIdentifier) {
        const handler = this.actionHandlers.get(actionIdentifier);
        if (handler) {
          await handler(actionIdentifier, notification);
        } else {
          console.warn(`No handler found for action: ${actionIdentifier}`);
        }
      }

      // アクションがない場合（通知をタップした場合）、デフォルトハンドラーを実行
      if (!actionIdentifier) {
        const defaultHandler = this.actionHandlers.get('default');
        if (defaultHandler) {
          await defaultHandler('default', notification);
        }
      }
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  }

  /**
   * デフォルトのアクションハンドラーを登録
   */
  private registerDefaultHandlers(): void {
    // デフォルトハンドラー（通知タップ時）
    this.registerActionHandler('default', async (actionIdentifier, notification) => {
      console.log('Default notification tap handler:', notification.request.identifier);
      // ナビゲーション処理はApp.tsxで実装
    });

    // 完了をマーク
    this.registerActionHandler(
      NotificationActionIdentifier.MARK_COMPLETE,
      async (actionIdentifier, notification) => {
        console.log('Mark complete action:', notification.request.identifier);
        // クエスト完了処理を実行
        // 実際のロジックは外部から登録されたハンドラーで実装
      }
    );

    // スヌーズ（後で通知）
    this.registerActionHandler(
      NotificationActionIdentifier.SNOOZE,
      async (actionIdentifier, notification) => {
        console.log('Snooze action:', notification.request.identifier);
        // 1時間後に再通知
        const now = new Date();
        now.setHours(now.getHours() + 1);

        await Notifications.scheduleNotificationAsync({
          content: notification.request.content,
          trigger: { date: now },
        });

        console.log('Notification snoozed for 1 hour');
      }
    );

    // クエストを表示
    this.registerActionHandler(
      NotificationActionIdentifier.VIEW_QUEST,
      async (actionIdentifier, notification) => {
        console.log('View quest action:', notification.request.identifier);
        // ナビゲーション処理はApp.tsxで実装
      }
    );

    // 進捗を表示
    this.registerActionHandler(
      NotificationActionIdentifier.VIEW_PROGRESS,
      async (actionIdentifier, notification) => {
        console.log('View progress action:', notification.request.identifier);
        // ナビゲーション処理はApp.tsxで実装
      }
    );

    // 目標を調整
    this.registerActionHandler(
      NotificationActionIdentifier.ADJUST_GOAL,
      async (actionIdentifier, notification) => {
        console.log('Adjust goal action:', notification.request.identifier);
        // ナビゲーション処理はApp.tsxで実装
      }
    );

    // 閉じる
    this.registerActionHandler(
      NotificationActionIdentifier.DISMISS,
      async (actionIdentifier, notification) => {
        console.log('Dismiss action:', notification.request.identifier);
        // 何もしない（通知を閉じるだけ）
      }
    );
  }

  /**
   * クリーンアップ
   */
  public cleanup(): void {
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
    this.actionHandlers.clear();
    console.log('NotificationActionHandler cleaned up');
  }
}

/**
 * デフォルトエクスポート
 */
export default NotificationActionHandler.getInstance();
