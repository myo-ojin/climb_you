/**
 * LocalNotificationManager Unit Tests
 * LocalNotificationManagerのユニットテスト
 */

// モックを最初に設定
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  setBadgeCountAsync: jest.fn(),
  getBadgeCountAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  AndroidImportance: {
    MAX: 'max',
    HIGH: 'high',
    DEFAULT: 'default',
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

jest.mock('expo-device', () => ({
  isDevice: true,
  osInternalBuildId: 'test-device-id',
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

import { LocalNotificationManager } from './LocalNotificationManager';
import { NotificationService } from './NotificationService';
import { NotificationType } from './types';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationHistoryRepository } from '../../core/domain/repositories/NotificationHistoryRepository';
import {
  NotificationHistory,
  CreateNotificationHistoryParams,
} from '../../core/domain/entities/NotificationHistory';

describe('LocalNotificationManager', () => {
  let manager: LocalNotificationManager;
  let notificationService: NotificationService;
  let mockHistoryRepo: jest.Mocked<NotificationHistoryRepository>;

  beforeEach(() => {
    // モッククリア
    jest.clearAllMocks();

    // AsyncStorage モック
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);

    // Notifications モック
    (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-1');

    // NotificationService インスタンス
    notificationService = NotificationService.getInstance();

    // NotificationServiceのメソッドをスパイ
    jest.spyOn(notificationService, 'scheduleNotification').mockResolvedValue('notification-1');
    jest.spyOn(notificationService, 'getSettings').mockResolvedValue({
      enabled: true,
      dailyQuestEnabled: true,
      dailyQuestTime: '0400',
      milestoneEnabled: true,
      rankingEnabled: true,
      stagnationEnabled: true,
      reminderEnabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
    });

    // NotificationHistoryRepository モック
    mockHistoryRepo = {
      createHistory: jest.fn().mockResolvedValue({
        id: 'history-1',
        notificationId: 'notification-1',
        type: NotificationType.REMINDER,
        title: 'Test',
        body: 'Test body',
        sentAt: new Date(),
        isTapped: false,
        isDelivered: true,
        userId: 'user-1',
        createdAt: new Date(),
      } as NotificationHistory),
      getHistoryById: jest.fn(),
      getHistoryByNotificationId: jest.fn(),
      getUserHistories: jest.fn(),
      getUserHistoriesByType: jest.fn(),
      getUnreadHistories: jest.fn(),
      markAsTapped: jest.fn(),
      markAsDelivered: jest.fn(),
      deleteOldHistories: jest.fn(),
      deleteUserHistories: jest.fn(),
      getHistoryStats: jest.fn(),
    } as any;

    // LocalNotificationManager インスタンス
    manager = LocalNotificationManager.getInstance(notificationService, mockHistoryRepo);
  });

  describe('getInstance', () => {
    it('シングルトンインスタンスを返すこと', () => {
      const instance1 = LocalNotificationManager.getInstance(
        notificationService,
        mockHistoryRepo
      );
      const instance2 = LocalNotificationManager.getInstance(
        notificationService,
        mockHistoryRepo
      );

      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('初期化が正常に完了すること', async () => {
      await manager.initialize('user-1');

      // スケジュール通知が設定される
      expect(notificationService.scheduleNotification).toHaveBeenCalled();

      // 履歴が作成される
      expect(mockHistoryRepo.createHistory).toHaveBeenCalled();
    });
  });

  describe('scheduleQuestReminder', () => {
    it('クエストリマインダーをスケジュールできること', async () => {
      await manager.scheduleQuestReminder('user-1');

      expect(notificationService.scheduleNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.REMINDER,
          title: 'クエストリマインダー',
          body: '今日のクエストを完了しましょう！',
        })
      );

      expect(mockHistoryRepo.createHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.REMINDER,
          userId: 'user-1',
        })
      );
    });

    it('カスタム時間でリマインダーをスケジュールできること', async () => {
      const settings = {
        enabled: true,
        dailyQuestEnabled: true,
        dailyQuestTime: '1800', // 18:00
        milestoneEnabled: true,
        rankingEnabled: true,
        stagnationEnabled: true,
        reminderEnabled: true,
        soundEnabled: true,
        vibrationEnabled: true,
      };

      await manager.scheduleQuestReminder('user-1', settings);

      expect(notificationService.scheduleNotification).toHaveBeenCalled();
      expect(mockHistoryRepo.createHistory).toHaveBeenCalled();
    });
  });

  describe('scheduleStreakReminder', () => {
    it('ストリーク継続リマインダーをスケジュールできること', async () => {
      await manager.scheduleStreakReminder('user-1');

      expect(notificationService.scheduleNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.REMINDER,
          title: 'ストリーク継続リマインダー',
          body: 'ストリークを継続しましょう！今日のクエストを完了してください。',
        })
      );

      expect(mockHistoryRepo.createHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.REMINDER,
          userId: 'user-1',
          data: expect.objectContaining({
            reminderType: 'streak',
          }),
        })
      );
    });

    it('23:00にスケジュールされること', async () => {
      await manager.scheduleStreakReminder('user-1');

      expect(notificationService.scheduleNotification).toHaveBeenCalled();
      expect(mockHistoryRepo.createHistory).toHaveBeenCalled();
    });
  });

  describe('scheduleFreezeDayReminder', () => {
    it('休息日使用可能通知をスケジュールできること', async () => {
      await manager.scheduleFreezeDayReminder('user-1');

      expect(notificationService.scheduleNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.REMINDER,
          title: '休息日が使用可能です',
          body: '今週の休息日をまだ使っていません。必要に応じて使用できます。',
        })
      );

      expect(mockHistoryRepo.createHistory).toHaveBeenCalledWith(
        expect.objectContaining({
          type: NotificationType.REMINDER,
          userId: 'user-1',
          data: expect.objectContaining({
            reminderType: 'freezeDay',
          }),
        })
      );
    });

    it('次の水曜日9:00にスケジュールされること', async () => {
      await manager.scheduleFreezeDayReminder('user-1');

      expect(notificationService.scheduleNotification).toHaveBeenCalled();
      expect(mockHistoryRepo.createHistory).toHaveBeenCalled();
    });
  });

  describe('cancelAllScheduledNotifications', () => {
    it('全てのスケジュール通知をキャンセルできること', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
        'notification-1'
      );
      (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockResolvedValue(
        undefined
      );

      // まずスケジュール
      await manager.scheduleQuestReminder('user-1');

      // キャンセル
      await manager.cancelAllScheduledNotifications();

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith(
        'notification-1'
      );
    });
  });

  describe('cleanup', () => {
    it('クリーンアップが正常に動作すること', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(
        'notification-1'
      );
      (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockResolvedValue(
        undefined
      );

      // スケジュール
      await manager.scheduleQuestReminder('user-1');

      // クリーンアップ
      await manager.cleanup();

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalled();
    });
  });
});
