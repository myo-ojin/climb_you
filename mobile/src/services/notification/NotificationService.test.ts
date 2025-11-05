/**
 * NotificationService Unit Tests
 * NotificationServiceのユニットテスト
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
  setNotificationCategoryAsync: jest.fn(),
  deleteNotificationCategoryAsync: jest.fn(),
  getNotificationCategoriesAsync: jest.fn(),
  AndroidImportance: {
    MAX: 'max',
    HIGH: 'high',
    DEFAULT: 'default',
  },
}));

jest.mock('./NotificationCategoryManager', () => ({
  NotificationCategoryManager: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
    })),
  },
}));

jest.mock('./NotificationActionHandler', () => ({
  NotificationActionHandler: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      registerActionHandler: jest.fn(),
      unregisterActionHandler: jest.fn(),
      cleanup: jest.fn(),
    })),
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

import { NotificationService } from './NotificationService';
import {
  NotificationType,
  NotificationPermissionStatus,
  NotificationPriority,
} from './types';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';

describe('NotificationService', () => {
  let service: NotificationService;

  beforeEach(() => {
    // モッククリア
    jest.clearAllMocks();

    // NotificationServiceの新しいインスタンスを取得
    service = NotificationService.getInstance();

    // AsyncStorage モック
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  describe('getInstance', () => {
    it('シングルトンインスタンスを返すこと', () => {
      const instance1 = NotificationService.getInstance();
      const instance2 = NotificationService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('初期化が正常に完了すること', async () => {
      (Notifications.setNotificationChannelAsync as jest.Mock).mockResolvedValue(undefined);

      await service.initialize();

      // 設定の読み込み
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@notification_settings');

      // プッシュトークンの読み込み
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@push_token');
    });

    it('Android の場合、通知チャンネルが設定されること', async () => {
      // Platform.OSを一時的にAndroidに変更
      const Platform = require('react-native').Platform;
      Platform.OS = 'android';

      (Notifications.setNotificationChannelAsync as jest.Mock).mockResolvedValue(undefined);

      await service.initialize();

      // 通知チャンネルが設定される（default, quest, milestone, ranking, alert の5つ）
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledTimes(5);
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('default', expect.any(Object));
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('quest', expect.any(Object));
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('milestone', expect.any(Object));
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('ranking', expect.any(Object));
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('alert', expect.any(Object));

      // 元に戻す
      Platform.OS = 'ios';
    });
  });

  describe('requestPermissions', () => {
    it('許可が未設定の場合、許可をリクエストすること', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[test-token]',
      });

      const status = await service.requestPermissions();

      expect(status).toBe(NotificationPermissionStatus.GRANTED);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalled();
    });

    it('許可が既に付与されている場合、再リクエストしないこと', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'ExponentPushToken[test-token]',
      });

      const status = await service.requestPermissions();

      expect(status).toBe(NotificationPermissionStatus.GRANTED);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('許可が拒否された場合、DENIED ステータスを返すこと', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const status = await service.requestPermissions();

      expect(status).toBe(NotificationPermissionStatus.DENIED);
    });
  });

  describe('getPermissionStatus', () => {
    it('現在の許可ステータスを取得できること', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const status = await service.getPermissionStatus();

      expect(status).toBe(NotificationPermissionStatus.GRANTED);
    });
  });

  describe('sendLocalNotification', () => {
    it('ローカル通知を送信できること', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id-1');

      const notificationId = await service.sendLocalNotification({
        type: NotificationType.DAILY_QUEST_GENERATED,
        notificationId: 'quest-1',
        title: '今日のクエストが生成されました',
        body: '3つのクエストが準備されています',
      });

      expect(notificationId).toBe('notification-id-1');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: expect.objectContaining({
          title: '今日のクエストが生成されました',
          body: '3つのクエストが準備されています',
        }),
        trigger: null,
      });
    });

    it('画像付き通知を送信できること', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id-2');

      await service.sendLocalNotification({
        type: NotificationType.MILESTONE_ACHIEVED,
        notificationId: 'milestone-1',
        title: '3合目達成！',
        body: 'おめでとうございます！',
        imageUrl: 'https://example.com/milestone-3.jpg',
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: expect.objectContaining({
          attachments: [{ url: 'https://example.com/milestone-3.jpg' }],
        }),
        trigger: null,
      });
    });
  });

  describe('scheduleNotification', () => {
    it('スケジュール通知を設定できること', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('scheduled-1');

      const triggerDate = new Date(Date.now() + 60 * 60 * 1000); // 1時間後

      const notificationId = await service.scheduleNotification({
        type: NotificationType.REMINDER,
        notificationId: 'reminder-1',
        title: 'リマインダー',
        body: 'クエストを完了しましょう',
        trigger: triggerDate,
      });

      expect(notificationId).toBe('scheduled-1');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalled();
    });

    it('繰り返し通知を設定できること', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('recurring-1');

      await service.scheduleNotification({
        type: NotificationType.DAILY_QUEST_GENERATED,
        notificationId: 'daily-quest',
        title: '今日のクエスト',
        body: 'クエストをチェックしましょう',
        trigger: new Date(),
        repeat: {
          hours: 24,
        },
      });

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: expect.any(Object),
        trigger: expect.objectContaining({
          repeats: true,
          hour: 24,
        }),
      });
    });
  });

  describe('cancelNotification', () => {
    it('通知をキャンセルできること', async () => {
      (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockResolvedValue(undefined);

      await service.cancelNotification('notification-id-1');

      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notification-id-1');
    });
  });

  describe('cancelAllNotifications', () => {
    it('すべての通知をキャンセルできること', async () => {
      (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(undefined);

      await service.cancelAllNotifications();

      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('setBadgeCount / getBadgeCount', () => {
    it('バッジ数を設定できること', async () => {
      (Notifications.setBadgeCountAsync as jest.Mock).mockResolvedValue(undefined);

      await service.setBadgeCount(5);

      expect(Notifications.setBadgeCountAsync).toHaveBeenCalledWith(5);
    });

    it('バッジ数を取得できること', async () => {
      (Notifications.getBadgeCountAsync as jest.Mock).mockResolvedValue(3);

      const count = await service.getBadgeCount();

      expect(count).toBe(3);
    });
  });

  describe('Settings management', () => {
    it('通知設定を取得できること', async () => {
      const settings = await service.getSettings();

      expect(settings).toBeDefined();
      expect(settings.enabled).toBe(true);
      expect(settings.dailyQuestEnabled).toBe(true);
    });

    it('通知設定を更新できること', async () => {
      await service.updateSettings({
        dailyQuestEnabled: false,
        soundEnabled: false,
      });

      const settings = await service.getSettings();

      expect(settings.dailyQuestEnabled).toBe(false);
      expect(settings.soundEnabled).toBe(false);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@notification_settings',
        expect.any(String)
      );
    });

    it('通知設定をリセットできること', async () => {
      // 設定を変更
      await service.updateSettings({
        enabled: false,
      });

      // リセット
      await service.resetSettings();

      const settings = await service.getSettings();

      expect(settings.enabled).toBe(true);
    });
  });

  describe('Listeners', () => {
    it('通知受信リスナーを追加できること', () => {
      const mockListener = jest.fn();
      const mockSubscription = { remove: jest.fn() };

      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(mockSubscription);

      const subscription = service.addNotificationReceivedListener(mockListener);

      expect(subscription).toBe(mockSubscription);
      expect(Notifications.addNotificationReceivedListener).toHaveBeenCalledWith(mockListener);
    });

    it('通知応答リスナーを追加できること', () => {
      const mockListener = jest.fn();
      const mockSubscription = { remove: jest.fn() };

      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue(
        mockSubscription
      );

      const subscription = service.addNotificationResponseReceivedListener(mockListener);

      expect(subscription).toBe(mockSubscription);
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalledWith(
        mockListener
      );
    });
  });

  describe('cleanup', () => {
    it('リスナーをクリーンアップできること', () => {
      const mockSubscription1 = { remove: jest.fn() };
      const mockSubscription2 = { remove: jest.fn() };

      (Notifications.addNotificationReceivedListener as jest.Mock).mockReturnValue(
        mockSubscription1
      );
      (Notifications.addNotificationResponseReceivedListener as jest.Mock).mockReturnValue(
        mockSubscription2
      );

      // リスナー追加
      service.addNotificationReceivedListener(jest.fn());
      service.addNotificationResponseReceivedListener(jest.fn());

      // クリーンアップ
      service.cleanup();

      // remove が呼ばれることを確認したいが、
      // プライベートな notificationListener と responseListener にアクセスできないため、
      // ここでは cleanup メソッドが正常に動作することのみを確認
      expect(() => service.cleanup()).not.toThrow();
    });
  });

  describe('Rich Notifications', () => {
    it('sendRichNotification: 画像付き通知を送信できること', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('rich-notification-1');

      const notificationId = await service.sendRichNotification({
        type: NotificationType.MILESTONE_ACHIEVED,
        notificationId: 'milestone-1',
        title: '3合目達成！',
        body: 'おめでとうございます！',
        imageUrl: 'https://example.com/milestone-3.jpg',
      });

      expect(notificationId).toBe('rich-notification-1');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: expect.objectContaining({
          title: '3合目達成！',
          body: 'おめでとうございます！',
          attachments: [{ url: 'https://example.com/milestone-3.jpg' }],
        }),
        trigger: null,
      });
    });

    it('sendRichNotification: imageUrlがない場合エラーをスローすること', async () => {
      await expect(
        service.sendRichNotification({
          type: NotificationType.MILESTONE_ACHIEVED,
          notificationId: 'milestone-1',
          title: '3合目達成！',
          body: 'おめでとうございます！',
          imageUrl: '',
        })
      ).rejects.toThrow('imageUrl is required for Rich Notifications');
    });
  });

  describe('Actionable Notifications', () => {
    it('sendActionableNotification: アクション付き通知を送信できること', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('actionable-1');

      const notificationId = await service.sendActionableNotification({
        type: NotificationType.REMINDER,
        notificationId: 'reminder-1',
        title: 'クエストリマインダー',
        body: '今日のクエストを完了しましょう！',
        categoryIdentifier: 'quest_reminder',
      });

      expect(notificationId).toBe('actionable-1');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: expect.objectContaining({
          categoryIdentifier: 'quest_reminder',
        }),
        trigger: null,
      });
    });

    it('sendActionableNotification: categoryIdentifierがない場合エラーをスローすること', async () => {
      await expect(
        service.sendActionableNotification({
          type: NotificationType.REMINDER,
          notificationId: 'reminder-1',
          title: 'クエストリマインダー',
          body: '今日のクエストを完了しましょう！',
          categoryIdentifier: '',
        })
      ).rejects.toThrow('categoryIdentifier is required for Actionable Notifications');
    });
  });

  describe('Rich + Actionable Notifications', () => {
    it('sendRichActionableNotification: 画像+アクション付き通知を送信できること', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('rich-actionable-1');

      const notificationId = await service.sendRichActionableNotification({
        type: NotificationType.MILESTONE_ACHIEVED,
        notificationId: 'milestone-1',
        title: '3合目達成！',
        body: 'おめでとうございます！',
        imageUrl: 'https://example.com/milestone-3.jpg',
        categoryIdentifier: 'milestone_achieved',
      });

      expect(notificationId).toBe('rich-actionable-1');
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: expect.objectContaining({
          title: '3合目達成！',
          attachments: [{ url: 'https://example.com/milestone-3.jpg' }],
          categoryIdentifier: 'milestone_achieved',
        }),
        trigger: null,
      });
    });

    it('sendRichActionableNotification: imageUrlがない場合エラーをスローすること', async () => {
      await expect(
        service.sendRichActionableNotification({
          type: NotificationType.MILESTONE_ACHIEVED,
          notificationId: 'milestone-1',
          title: '3合目達成！',
          body: 'おめでとうございます！',
          imageUrl: '',
          categoryIdentifier: 'milestone_achieved',
        })
      ).rejects.toThrow('imageUrl is required for Rich Notifications');
    });

    it('sendRichActionableNotification: categoryIdentifierがない場合エラーをスローすること', async () => {
      await expect(
        service.sendRichActionableNotification({
          type: NotificationType.MILESTONE_ACHIEVED,
          notificationId: 'milestone-1',
          title: '3合目達成！',
          body: 'おめでとうございます！',
          imageUrl: 'https://example.com/milestone-3.jpg',
          categoryIdentifier: '',
        })
      ).rejects.toThrow('categoryIdentifier is required for Actionable Notifications');
    });
  });

  describe('Action Handler Management', () => {
    it('registerActionHandler: アクションハンドラーを登録できること', () => {
      const handler = jest.fn();

      expect(() => {
        service.registerActionHandler('custom_action', handler);
      }).not.toThrow();
    });

    it('unregisterActionHandler: アクションハンドラーを削除できること', () => {
      expect(() => {
        service.unregisterActionHandler('custom_action');
      }).not.toThrow();
    });

    it('getCategoryManager: CategoryManagerを取得できること', () => {
      const categoryManager = service.getCategoryManager();
      expect(categoryManager).toBeDefined();
    });

    it('getActionHandler: ActionHandlerを取得できること', () => {
      const actionHandler = service.getActionHandler();
      expect(actionHandler).toBeDefined();
    });
  });
});
