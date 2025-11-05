/**
 * LocalNotificationManager
 * ローカル通知（リマインダー）の管理
 *
 * 以下の通知を管理します:
 * - クエストリマインダー（デフォルト20:00）
 * - ストリーク継続リマインダー（23:00）
 * - 休息日使用可能通知
 */

import { NotificationService } from './NotificationService';
import {
  NotificationType,
  ScheduledNotificationData,
  NotificationSettings,
} from './types';
import { NotificationHistoryRepository } from '../../core/domain/repositories/NotificationHistoryRepository';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorageキー
const STORAGE_KEY_SCHEDULED_NOTIFICATIONS = '@scheduled_notifications';

interface ScheduledNotificationInfo {
  id: string;
  type: NotificationType;
  nextTriggerDate: Date;
}

/**
 * LocalNotificationManager
 */
export class LocalNotificationManager {
  private static instance: LocalNotificationManager | null = null;
  private notificationService: NotificationService;
  private notificationHistoryRepo: NotificationHistoryRepository;
  private scheduledNotifications: Map<NotificationType, string> = new Map();

  private constructor(
    notificationService: NotificationService,
    notificationHistoryRepo: NotificationHistoryRepository
  ) {
    this.notificationService = notificationService;
    this.notificationHistoryRepo = notificationHistoryRepo;
  }

  /**
   * インスタンス取得（シングルトン）
   */
  public static getInstance(
    notificationService: NotificationService,
    notificationHistoryRepo: NotificationHistoryRepository
  ): LocalNotificationManager {
    if (!LocalNotificationManager.instance) {
      LocalNotificationManager.instance = new LocalNotificationManager(
        notificationService,
        notificationHistoryRepo
      );
    }
    return LocalNotificationManager.instance;
  }

  /**
   * 初期化
   */
  public async initialize(userId: string): Promise<void> {
    try {
      // 保存されているスケジュール情報を読み込む
      await this.loadScheduledNotifications();

      // 設定を読み込む
      const settings = await this.notificationService.getSettings();

      // 各リマインダーをスケジュール
      if (settings.reminderEnabled) {
        await this.scheduleQuestReminder(userId, settings);
      }

      if (settings.dailyQuestEnabled) {
        await this.scheduleStreakReminder(userId);
      }

      console.log('LocalNotificationManager initialized');
    } catch (error) {
      console.error('Failed to initialize LocalNotificationManager:', error);
      throw error;
    }
  }

  /**
   * クエストリマインダーをスケジュール
   * デフォルト: 20:00
   */
  public async scheduleQuestReminder(
    userId: string,
    settings?: NotificationSettings
  ): Promise<void> {
    try {
      // 既存のリマインダーをキャンセル
      await this.cancelNotificationByType(NotificationType.REMINDER);

      const s = settings || (await this.notificationService.getSettings());

      // リマインダー時間を取得（デフォルト: 20:00）
      const reminderTime = s.dailyQuestTime || '2000';
      const hour = parseInt(reminderTime.substring(0, 2), 10);
      const minute = parseInt(reminderTime.substring(2, 4), 10);

      // 今日の指定時刻を作成
      const triggerDate = new Date();
      triggerDate.setHours(hour, minute, 0, 0);

      // 既に過ぎていたら明日に設定
      if (triggerDate < new Date()) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      const notificationData: ScheduledNotificationData = {
        type: NotificationType.REMINDER,
        notificationId: `quest_reminder_${Date.now()}`,
        title: 'クエストリマインダー',
        body: '今日のクエストを完了しましょう！',
        trigger: triggerDate,
        repeat: {
          hours: 24,
        },
        data: {
          userId,
        },
      };

      const notificationId = await this.notificationService.scheduleNotification(
        notificationData
      );

      // スケジュール情報を保存
      this.scheduledNotifications.set(NotificationType.REMINDER, notificationId);
      await this.saveScheduledNotifications();

      // 履歴に記録
      await this.notificationHistoryRepo.createHistory({
        notificationId,
        type: NotificationType.REMINDER,
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data,
        userId,
      });

      console.log(
        `Quest reminder scheduled at ${hour}:${minute}, next trigger:`,
        triggerDate
      );
    } catch (error) {
      console.error('Failed to schedule quest reminder:', error);
      throw error;
    }
  }

  /**
   * ストリーク継続リマインダーをスケジュール
   * 毎日23:00
   */
  public async scheduleStreakReminder(userId: string): Promise<void> {
    try {
      // 既存のリマインダーをキャンセル
      await this.cancelNotificationByType(NotificationType.REMINDER);

      // 今日の23:00を作成
      const triggerDate = new Date();
      triggerDate.setHours(23, 0, 0, 0);

      // 既に過ぎていたら明日に設定
      if (triggerDate < new Date()) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      const notificationData: ScheduledNotificationData = {
        type: NotificationType.REMINDER,
        notificationId: `streak_reminder_${Date.now()}`,
        title: 'ストリーク継続リマインダー',
        body: 'ストリークを継続しましょう！今日のクエストを完了してください。',
        trigger: triggerDate,
        repeat: {
          hours: 24,
        },
        data: {
          userId,
          reminderType: 'streak',
        },
      };

      const notificationId = await this.notificationService.scheduleNotification(
        notificationData
      );

      // スケジュール情報を保存
      this.scheduledNotifications.set(NotificationType.REMINDER, notificationId);
      await this.saveScheduledNotifications();

      // 履歴に記録
      await this.notificationHistoryRepo.createHistory({
        notificationId,
        type: NotificationType.REMINDER,
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data,
        userId,
      });

      console.log('Streak reminder scheduled at 23:00, next trigger:', triggerDate);
    } catch (error) {
      console.error('Failed to schedule streak reminder:', error);
      throw error;
    }
  }

  /**
   * 休息日使用可能通知をスケジュール
   * 週の途中（水曜日 09:00）
   */
  public async scheduleFreezeDayReminder(userId: string): Promise<void> {
    try {
      // 既存のリマインダーをキャンセル
      await this.cancelNotificationByType(NotificationType.REMINDER);

      // 次の水曜日 09:00を計算
      const triggerDate = this.getNextWednesday();
      triggerDate.setHours(9, 0, 0, 0);

      const notificationData: ScheduledNotificationData = {
        type: NotificationType.REMINDER,
        notificationId: `freeze_day_reminder_${Date.now()}`,
        title: '休息日が使用可能です',
        body: '今週の休息日をまだ使っていません。必要に応じて使用できます。',
        trigger: triggerDate,
        repeat: {
          days: 7,
        },
        data: {
          userId,
          reminderType: 'freezeDay',
        },
      };

      const notificationId = await this.notificationService.scheduleNotification(
        notificationData
      );

      // スケジュール情報を保存
      this.scheduledNotifications.set(NotificationType.REMINDER, notificationId);
      await this.saveScheduledNotifications();

      // 履歴に記録
      await this.notificationHistoryRepo.createHistory({
        notificationId,
        type: NotificationType.REMINDER,
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data,
        userId,
      });

      console.log('Freeze day reminder scheduled, next trigger:', triggerDate);
    } catch (error) {
      console.error('Failed to schedule freeze day reminder:', error);
      throw error;
    }
  }

  /**
   * 特定タイプの通知をキャンセル
   */
  private async cancelNotificationByType(type: NotificationType): Promise<void> {
    const notificationId = this.scheduledNotifications.get(type);
    if (notificationId) {
      await this.notificationService.cancelNotification(notificationId);
      this.scheduledNotifications.delete(type);
      await this.saveScheduledNotifications();
    }
  }

  /**
   * 全てのスケジュール通知をキャンセル
   */
  public async cancelAllScheduledNotifications(): Promise<void> {
    try {
      for (const notificationId of this.scheduledNotifications.values()) {
        await this.notificationService.cancelNotification(notificationId);
      }
      this.scheduledNotifications.clear();
      await this.saveScheduledNotifications();

      console.log('All scheduled notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel all scheduled notifications:', error);
      throw error;
    }
  }

  /**
   * 次の水曜日を取得
   */
  private getNextWednesday(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (日) ~ 6 (土)
    const wednesday = 3; // 水曜日

    let daysToAdd = wednesday - dayOfWeek;
    if (daysToAdd <= 0) {
      daysToAdd += 7; // 次の週の水曜日
    }

    const nextWednesday = new Date(now);
    nextWednesday.setDate(now.getDate() + daysToAdd);

    return nextWednesday;
  }

  /**
   * スケジュール情報を保存
   */
  private async saveScheduledNotifications(): Promise<void> {
    try {
      const data: ScheduledNotificationInfo[] = [];
      for (const [type, id] of this.scheduledNotifications) {
        data.push({
          id,
          type,
          nextTriggerDate: new Date(), // 実際のトリガー日時は取得できないため、現在時刻を記録
        });
      }
      await AsyncStorage.setItem(
        STORAGE_KEY_SCHEDULED_NOTIFICATIONS,
        JSON.stringify(data)
      );
    } catch (error) {
      console.error('Failed to save scheduled notifications:', error);
    }
  }

  /**
   * スケジュール情報を読み込む
   */
  private async loadScheduledNotifications(): Promise<void> {
    try {
      const dataJson = await AsyncStorage.getItem(STORAGE_KEY_SCHEDULED_NOTIFICATIONS);
      if (dataJson) {
        const data: ScheduledNotificationInfo[] = JSON.parse(dataJson);
        for (const item of data) {
          this.scheduledNotifications.set(item.type, item.id);
        }
      }
    } catch (error) {
      console.error('Failed to load scheduled notifications:', error);
    }
  }

  /**
   * クリーンアップ
   */
  public async cleanup(): Promise<void> {
    await this.cancelAllScheduledNotifications();
    this.scheduledNotifications.clear();
  }
}

/**
 * デフォルトエクスポート
 */
export default LocalNotificationManager;
