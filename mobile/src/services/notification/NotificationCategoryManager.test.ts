/**
 * NotificationCategoryManager Unit Tests
 * NotificationCategoryManagerのユニットテスト
 */

// モックを最初に設定
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationCategoryAsync: jest.fn(),
  deleteNotificationCategoryAsync: jest.fn(),
  getNotificationCategoriesAsync: jest.fn(),
}));

import { NotificationCategoryManager } from './NotificationCategoryManager';
import { NotificationCategoryIdentifier } from './types';
import * as Notifications from 'expo-notifications';

describe('NotificationCategoryManager', () => {
  let manager: NotificationCategoryManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = NotificationCategoryManager.getInstance();
  });

  describe('getInstance', () => {
    it('シングルトンインスタンスを返すこと', () => {
      const instance1 = NotificationCategoryManager.getInstance();
      const instance2 = NotificationCategoryManager.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('initialize', () => {
    it('初期化が正常に完了すること', async () => {
      (Notifications.setNotificationCategoryAsync as jest.Mock).mockResolvedValue(undefined);

      await manager.initialize();

      // 5つのカテゴリが登録される
      expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledTimes(5);

      // クエストリマインダーカテゴリ
      expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
        NotificationCategoryIdentifier.QUEST_REMINDER,
        expect.arrayContaining([
          expect.objectContaining({
            identifier: 'mark_complete',
            buttonTitle: '完了をマーク',
          }),
          expect.objectContaining({
            identifier: 'snooze',
            buttonTitle: '後で通知',
          }),
        ])
      );

      // マイルストーン達成カテゴリ
      expect(Notifications.setNotificationCategoryAsync).toHaveBeenCalledWith(
        NotificationCategoryIdentifier.MILESTONE_ACHIEVED,
        expect.arrayContaining([
          expect.objectContaining({
            identifier: 'view_progress',
            buttonTitle: '進捗を表示',
          }),
        ])
      );
    });
  });

  describe('deleteCategory', () => {
    it('カテゴリを削除できること', async () => {
      (Notifications.deleteNotificationCategoryAsync as jest.Mock).mockResolvedValue(undefined);

      await manager.deleteCategory(NotificationCategoryIdentifier.QUEST_REMINDER);

      expect(Notifications.deleteNotificationCategoryAsync).toHaveBeenCalledWith(
        NotificationCategoryIdentifier.QUEST_REMINDER
      );
    });
  });

  describe('getAllCategories', () => {
    it('全カテゴリを取得できること', async () => {
      const mockCategories = [
        {
          identifier: NotificationCategoryIdentifier.QUEST_REMINDER,
          actions: [],
        },
      ];
      (Notifications.getNotificationCategoriesAsync as jest.Mock).mockResolvedValue(
        mockCategories
      );

      const categories = await manager.getAllCategories();

      expect(categories).toEqual(mockCategories);
      expect(Notifications.getNotificationCategoriesAsync).toHaveBeenCalled();
    });
  });
});
