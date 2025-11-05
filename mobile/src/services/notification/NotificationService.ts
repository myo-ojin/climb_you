/**
 * Notification Service
 * 通知サービスの実装
 *
 * expo-notificationsを使用してプッシュ通知とローカル通知を管理します
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import {
  NotificationData,
  ScheduledNotificationData,
  NotificationPermissionStatus,
  NotificationSettings,
  PushToken,
  NotificationResponse,
  NotificationPriority,
} from './types';
import { NotificationCategoryManager } from './NotificationCategoryManager';
import { NotificationActionHandler } from './NotificationActionHandler';

// AsyncStorageキー
const STORAGE_KEY_SETTINGS = '@notification_settings';
const STORAGE_KEY_PUSH_TOKEN = '@push_token';

// デフォルト通知設定
const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  dailyQuestEnabled: true,
  dailyQuestTime: '0400', // 04:00
  milestoneEnabled: true,
  rankingEnabled: true,
  stagnationEnabled: true,
  reminderEnabled: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

/**
 * 通知ハンドラーの設定
 * アプリがフォアグラウンドにいる時の通知表示方法を設定
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * NotificationService クラス
 */
export class NotificationService {
  private static instance: NotificationService | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private settings: NotificationSettings = DEFAULT_SETTINGS;
  private pushToken: PushToken | null = null;
  private categoryManager: NotificationCategoryManager;
  private actionHandler: NotificationActionHandler;

  /**
   * プライベートコンストラクタ（シングルトン）
   */
  private constructor() {
    this.categoryManager = NotificationCategoryManager.getInstance();
    this.actionHandler = NotificationActionHandler.getInstance();
  }

  /**
   * インスタンス取得（シングルトン）
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * 初期化
   */
  public async initialize(): Promise<void> {
    // 設定を読み込む
    await this.loadSettings();

    // プッシュトークンを読み込む
    await this.loadPushToken();

    // 通知チャンネルの設定（Android）
    if (Platform.OS === 'android') {
      await this.setupAndroidChannels();
    }

    // 通知カテゴリの初期化（Actionable Notifications）
    await this.categoryManager.initialize();

    // 通知アクションハンドラーの初期化
    await this.actionHandler.initialize();

    console.log('NotificationService initialized with Categories and Actions');
  }

  /**
   * 通知許可をリクエスト
   */
  public async requestPermissions(): Promise<NotificationPermissionStatus> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // プッシュトークンを取得
    if (finalStatus === 'granted') {
      await this.registerForPushNotifications();
    }

    return this.mapPermissionStatus(finalStatus);
  }

  /**
   * 通知許可ステータスを取得
   */
  public async getPermissionStatus(): Promise<NotificationPermissionStatus> {
    const { status } = await Notifications.getPermissionsAsync();
    return this.mapPermissionStatus(status);
  }

  /**
   * プッシュトークンを取得
   */
  public async getPushToken(): Promise<PushToken | null> {
    if (this.pushToken) {
      return this.pushToken;
    }

    await this.registerForPushNotifications();
    return this.pushToken;
  }

  /**
   * ローカル通知を送信
   */
  public async sendLocalNotification(
    data: NotificationData
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: data.title,
        body: data.body,
        subtitle: data.subtitle,
        data: {
          ...data.data,
          type: data.type,
          notificationId: data.notificationId,
        },
        sound: data.sound !== false,
        badge: data.badge,
        categoryIdentifier: data.categoryIdentifier,
        ...(data.imageUrl && {
          attachments: [
            {
              url: data.imageUrl,
            },
          ],
        }),
      },
      trigger: null, // 即座に表示
    });

    return notificationId;
  }

  /**
   * スケジュール通知を設定
   */
  public async scheduleNotification(
    data: ScheduledNotificationData
  ): Promise<string> {
    const trigger = this.createTrigger(data);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: data.title,
        body: data.body,
        subtitle: data.subtitle,
        data: {
          ...data.data,
          type: data.type,
          notificationId: data.notificationId,
        },
        sound: data.sound !== false,
        badge: data.badge,
        categoryIdentifier: data.categoryIdentifier,
        ...(data.imageUrl && {
          attachments: [
            {
              url: data.imageUrl,
            },
          ],
        }),
      },
      trigger,
    });

    return notificationId;
  }

  /**
   * 通知をキャンセル
   */
  public async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * すべてのスケジュール通知をキャンセル
   */
  public async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * バッジ数を設定
   */
  public async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * バッジ数を取得
   */
  public async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * 通知受信リスナーを追加
   */
  public addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  /**
   * 通知応答リスナーを追加
   */
  public addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  /**
   * 通知設定を取得
   */
  public async getSettings(): Promise<NotificationSettings> {
    return this.settings;
  }

  /**
   * 通知設定を更新
   */
  public async updateSettings(
    settings: Partial<NotificationSettings>
  ): Promise<void> {
    this.settings = {
      ...this.settings,
      ...settings,
    };

    await AsyncStorage.setItem(
      STORAGE_KEY_SETTINGS,
      JSON.stringify(this.settings)
    );
  }

  /**
   * 通知設定をリセット
   */
  public async resetSettings(): Promise<void> {
    this.settings = DEFAULT_SETTINGS;
    await AsyncStorage.setItem(
      STORAGE_KEY_SETTINGS,
      JSON.stringify(this.settings)
    );
  }

  /**
   * Rich Notificationを送信（画像付き通知）
   */
  public async sendRichNotification(
    data: NotificationData & { imageUrl: string }
  ): Promise<string> {
    if (!data.imageUrl) {
      throw new Error('imageUrl is required for Rich Notifications');
    }

    return await this.sendLocalNotification(data);
  }

  /**
   * Actionable Notificationを送信（アクション付き通知）
   */
  public async sendActionableNotification(
    data: NotificationData & { categoryIdentifier: string }
  ): Promise<string> {
    if (!data.categoryIdentifier) {
      throw new Error('categoryIdentifier is required for Actionable Notifications');
    }

    return await this.sendLocalNotification(data);
  }

  /**
   * Rich + Actionable Notificationを送信（画像付き + アクション付き通知）
   */
  public async sendRichActionableNotification(
    data: NotificationData & { imageUrl: string; categoryIdentifier: string }
  ): Promise<string> {
    if (!data.imageUrl) {
      throw new Error('imageUrl is required for Rich Notifications');
    }
    if (!data.categoryIdentifier) {
      throw new Error('categoryIdentifier is required for Actionable Notifications');
    }

    return await this.sendLocalNotification(data);
  }

  /**
   * アクションハンドラーを登録
   * 外部からカスタムアクションハンドラーを登録できます
   */
  public registerActionHandler(
    actionIdentifier: string,
    handler: (actionIdentifier: string, notification: Notifications.Notification) => void | Promise<void>
  ): void {
    this.actionHandler.registerActionHandler(actionIdentifier, handler);
  }

  /**
   * アクションハンドラーを削除
   */
  public unregisterActionHandler(actionIdentifier: string): void {
    this.actionHandler.unregisterActionHandler(actionIdentifier);
  }

  /**
   * CategoryManagerへのアクセス
   */
  public getCategoryManager(): NotificationCategoryManager {
    return this.categoryManager;
  }

  /**
   * ActionHandlerへのアクセス
   */
  public getActionHandler(): NotificationActionHandler {
    return this.actionHandler;
  }

  /**
   * リスナーをクリーンアップ
   */
  public cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }

    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }

    // アクションハンドラーのクリーンアップ
    this.actionHandler.cleanup();

    console.log('NotificationService cleaned up');
  }

  // ============================================================
  // Private Methods
  // ============================================================

  /**
   * プッシュ通知に登録
   */
  private async registerForPushNotifications(): Promise<void> {
    if (!Device.isDevice) {
      console.warn('プッシュ通知は実機でのみ利用可能です');
      return;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID,
      });

      this.pushToken = {
        expoPushToken: token.data,
        deviceId: Device.osInternalBuildId || 'unknown',
        platform: Platform.OS as 'ios' | 'android' | 'web',
        obtainedAt: new Date(),
      };

      // トークンを保存
      await AsyncStorage.setItem(
        STORAGE_KEY_PUSH_TOKEN,
        JSON.stringify(this.pushToken)
      );

      console.log('プッシュトークン取得成功:', this.pushToken.expoPushToken);
    } catch (error) {
      console.error('プッシュトークン取得エラー:', error);
    }
  }

  /**
   * 通知設定を読み込む
   */
  private async loadSettings(): Promise<void> {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEY_SETTINGS);
      if (settingsJson) {
        this.settings = JSON.parse(settingsJson);
      }
    } catch (error) {
      console.error('通知設定の読み込みエラー:', error);
      this.settings = DEFAULT_SETTINGS;
    }
  }

  /**
   * プッシュトークンを読み込む
   */
  private async loadPushToken(): Promise<void> {
    try {
      const tokenJson = await AsyncStorage.getItem(STORAGE_KEY_PUSH_TOKEN);
      if (tokenJson) {
        this.pushToken = JSON.parse(tokenJson);
      }
    } catch (error) {
      console.error('プッシュトークンの読み込みエラー:', error);
    }
  }

  /**
   * Android通知チャンネルを設定
   */
  private async setupAndroidChannels(): Promise<void> {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'デフォルト',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });

    await Notifications.setNotificationChannelAsync('quest', {
      name: 'クエスト通知',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3C507D',
    });

    await Notifications.setNotificationChannelAsync('milestone', {
      name: 'マイルストーン通知',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#E0C58F',
    });

    await Notifications.setNotificationChannelAsync('ranking', {
      name: 'ランキング通知',
      importance: Notifications.AndroidImportance.DEFAULT,
    });

    await Notifications.setNotificationChannelAsync('alert', {
      name: 'アラート通知',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 1000],
      lightColor: '#FF0000',
    });
  }

  /**
   * トリガーを作成
   */
  private createTrigger(
    data: ScheduledNotificationData
  ): Notifications.NotificationTriggerInput {
    const triggerDate =
      data.trigger instanceof Date ? data.trigger : new Date(data.trigger);

    if (data.repeat) {
      // 繰り返し通知
      return {
        repeats: true,
        ...(data.repeat.seconds && { seconds: data.repeat.seconds }),
        ...(data.repeat.minutes && { minute: data.repeat.minutes }),
        ...(data.repeat.hours && { hour: data.repeat.hours }),
        ...(data.repeat.days && { day: data.repeat.days }),
        ...(data.repeat.weekday !== undefined && { weekday: data.repeat.weekday }),
      };
    }

    // 一度だけの通知
    return {
      date: triggerDate,
    };
  }

  /**
   * 許可ステータスをマップ
   */
  private mapPermissionStatus(
    status: Notifications.PermissionStatus
  ): NotificationPermissionStatus {
    if (status === 'granted') {
      return NotificationPermissionStatus.GRANTED;
    } else if (status === 'denied') {
      return NotificationPermissionStatus.DENIED;
    }
    return NotificationPermissionStatus.UNDETERMINED;
  }
}

/**
 * デフォルトエクスポート
 */
export default NotificationService.getInstance();
